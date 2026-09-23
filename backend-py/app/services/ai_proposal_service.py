"""AI chatbot form proposals: validate → present → approve → save.

  * `validate_form` (an LLM tool, run by the backend): checks a proposed draft
    and, only if it passes, stores it as a new immutable `AIFormProposal`
    version. Reused items must cite `sourceFormId`/`sourceQuestionId`/
    `sourceAnswerId`, verified to exist AND be visible to the user through the
    MCP server's scoped `get_campaign_details`; new items must use `id: null`
    (the model never invents database ids). The target subsidiary comes from
    the session for standard users, and is validated for admins.
  * `approve_proposal` (UI only, `POST /ai/proposals/{id}/approve`): the user's
    explicit "Approve & Save" click. Issues a one-time, 10-minute token bound
    to that exact version; only its sha256 is stored.
  * `save_draft_form` (UI only, `POST /ai/proposals/{id}/save`): requires that
    token. Rejects a proposal that was superseded by a newer version, altered
    after approval, already saved, or no longer valid, then creates the draft
    through form_builder_service (FormIQ's normal create rules: active
    subsidiary, open/unblocked project code, locales).

The LLM is never given the token and there is no LLM tool that saves, so
nothing reaches `fq.Forms` without the user's click.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.errors import AppError, ConflictError, NotFoundError
from app.form_pipeline import AnswerDefinition, QuestionDefinition, validate_form_definition
from app.models.ai_form_proposal import AIFormProposal
from app.models.user import is_admin_role

MAX_QUESTIONS = 30
MAX_ANSWERS = 30
APPROVAL_TTL = timedelta(minutes=10)
CHOICE_CONTROL_TYPES = ("radio", "checkbox", "dropdown")
TEXT_CONTROL_TYPES = ("text", "shortText")


class ApprovalError(Exception):
    """Missing, wrong or expired approval token (HTTP 403)."""


# --- proposal shape (the validate_form tool's arguments) ---------------------

class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ProposalAnswer(_Strict):
    id: Optional[str] = None
    sourceAnswerId: Optional[str] = None
    text: str = Field(min_length=1, max_length=500)


class ProposalQuestion(_Strict):
    id: Optional[str] = None
    sourceFormId: Optional[str] = None
    sourceQuestionId: Optional[str] = None
    controlType: str
    required: bool = False
    heading: str = Field(min_length=1, max_length=500)
    subheading: Optional[str] = Field(default=None, max_length=500)
    answers: list[ProposalAnswer] = Field(default_factory=list, max_length=MAX_ANSWERS)


class FormProposal(_Strict):
    name: str = Field(min_length=1, max_length=200)
    projectCode: Optional[str] = Field(default=None, max_length=100)
    subsidiary: Optional[str] = Field(default=None, max_length=50)
    baseFormId: Optional[str] = None
    questions: list[ProposalQuestion] = Field(min_length=1, max_length=MAX_QUESTIONS)


# JSON schema handed to Groq for the validate_form tool.
FORM_PROPOSAL_JSON_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": ["name", "questions"],
    "properties": {
        "name": {"type": "string", "description": "Campaign/form name"},
        "projectCode": {"type": ["string", "null"], "description": "Open project code (required for subsidiary users)"},
        "subsidiary": {"type": ["string", "null"], "description": "Target subsidiary code (admins only; ignored for subsidiary users)"},
        "baseFormId": {"type": ["string", "null"], "description": "formId of an existing campaign whose settings/profile fields to copy, or null"},
        "questions": {
            "type": "array",
            "minItems": 1,
            "maxItems": MAX_QUESTIONS,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["controlType", "heading", "required", "answers"],
                "properties": {
                    "id": {"type": "null", "description": "Always null — never invent ids"},
                    "sourceFormId": {"type": ["string", "null"], "description": "formId the question is reused from, else null"},
                    "sourceQuestionId": {"type": ["string", "null"], "description": "question id in sourceFormId it is reused from, else null"},
                    "controlType": {"type": "string", "enum": [*CHOICE_CONTROL_TYPES, *TEXT_CONTROL_TYPES]},
                    "required": {"type": "boolean"},
                    "heading": {"type": "string"},
                    "subheading": {"type": ["string", "null"]},
                    "answers": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["text"],
                            "properties": {
                                "id": {"type": "null"},
                                "sourceAnswerId": {"type": ["string", "null"]},
                                "text": {"type": "string"},
                            },
                        },
                    },
                },
            },
        },
    },
}


# --- helpers -----------------------------------------------------------------

def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _issue(path: str, code: str, message: str) -> dict[str, str]:
    return {"path": path, "code": code, "message": message}


def build_questions(proposal: FormProposal, default_locale: str) -> list[QuestionDefinition]:
    """Proposal questions → FormDefinition questions (fresh Q1..Qn / A1..An ids for the new draft)."""
    questions = []
    for index, q in enumerate(proposal.questions, start=1):
        answers = [] if q.controlType in TEXT_CONTROL_TYPES else [
            AnswerDefinition(id=f"A{a_index}", order=a_index, textByLocale={default_locale: a.text})
            for a_index, a in enumerate(q.answers, start=1)
        ]
        questions.append(QuestionDefinition(
            id=f"Q{index}",
            order=index,
            controlType=q.controlType,
            headingByLocale={default_locale: q.heading},
            subheadingByLocale={default_locale: q.subheading} if q.subheading else {},
            required=q.required,
            answers=answers,
            visibleInVariants=["ff", "oc"],
        ))
    return questions


async def _fetch_source(cache: dict[str, dict[str, Any]], form_id: str, auth: dict) -> dict[str, Any]:
    from app.services.mcp_sql_client import call_formiq_tool

    if form_id not in cache:
        cache[form_id] = await call_formiq_tool("get_campaign_details", {"formId": form_id}, auth)
    return cache[form_id]


async def check_proposal(db: Session, auth: dict, raw: Any) -> dict[str, Any]:
    """Validates without storing. Returns
    `{"valid": bool, "errors": [...], "warnings": [...], "proposal": FormProposal|None,
      "subsidiaryId": str|None, "defaultLocale": str}`."""
    from app.services import form_builder_service, project_code_service, subsidiary_project_block_service, subsidiary_service

    errors: list[dict[str, str]] = []
    warnings: list[dict[str, str]] = []
    result: dict[str, Any] = {"valid": False, "errors": errors, "warnings": warnings, "proposal": None,
                              "subsidiaryId": None, "defaultLocale": "en_GB"}

    try:
        proposal = FormProposal.model_validate(raw)
    except PydanticValidationError as exc:
        for err in exc.errors()[:20]:
            path = ".".join(str(p) for p in err.get("loc", ())) or "(root)"
            errors.append(_issue(path, "SCHEMA", err.get("msg", "invalid value")))
        return result
    result["proposal"] = proposal
    admin = is_admin_role(auth["role"])
    sources: dict[str, dict[str, Any]] = {}

    # Base campaign (settings/profile fields to copy) — must be visible to this user.
    base_details: Optional[dict[str, Any]] = None
    if proposal.baseFormId:
        base_details = await _fetch_source(sources, proposal.baseFormId, auth)
        if "error" in base_details:
            errors.append(_issue("baseFormId", "UNKNOWN_SOURCE_ID", "baseFormId is not a campaign you can access"))
            base_details = None

    # Target subsidiary: the session decides for standard users; never widened.
    if admin:
        subsidiary_id = proposal.subsidiary or (base_details or {}).get("subsidiary")
        if not subsidiary_id:
            errors.append(_issue("subsidiary", "REQUIRED", "Ask the admin which subsidiary this campaign is for"))
    else:
        subsidiary_id = auth.get("subsidiaryId")
        if not subsidiary_id:
            errors.append(_issue("subsidiary", "FORBIDDEN", "This account has no subsidiary assigned"))
        elif proposal.subsidiary and proposal.subsidiary != subsidiary_id:
            warnings.append(_issue("subsidiary", "IGNORED", f"Drafts are always created in your own subsidiary ({subsidiary_id})"))
    result["subsidiaryId"] = subsidiary_id

    if subsidiary_id:
        try:
            subsidiary_service.assert_subsidiary_active(db, subsidiary_id)
        except AppError as exc:
            errors.append(_issue("subsidiary", "INVALID", exc.message))

    if not proposal.projectCode:
        if not admin:
            errors.append(_issue("projectCode", "REQUIRED", "Ask the user which open project code to use"))
    else:
        try:
            project_code_service.assert_project_code_open(db, proposal.projectCode, exclude_locked=not admin)
            if subsidiary_id:
                subsidiary_project_block_service.assert_not_blocked(db, subsidiary_id, proposal.projectCode)
        except AppError as exc:
            errors.append(_issue("projectCode", "INVALID", exc.message))

    for q_index, q in enumerate(proposal.questions):
        path = f"questions.{q_index}"
        if q.id is not None:
            errors.append(_issue(f"{path}.id", "INVENTED_ID", "New items must use id null; cite reused items via sourceQuestionId"))
        if q.controlType not in (*CHOICE_CONTROL_TYPES, *TEXT_CONTROL_TYPES):
            errors.append(_issue(f"{path}.controlType", "INVALID", "controlType must be radio, checkbox, dropdown, text or shortText"))
        elif q.controlType in CHOICE_CONTROL_TYPES and len(q.answers) < 2:
            errors.append(_issue(f"{path}.answers", "TOO_FEW", "Choice questions need at least 2 answers"))
        elif q.controlType in TEXT_CONTROL_TYPES and q.answers:
            errors.append(_issue(f"{path}.answers", "NOT_ALLOWED", "Text questions have no answers"))
        texts = [a.text.strip().lower() for a in q.answers]
        if len(set(texts)) != len(texts):
            errors.append(_issue(f"{path}.answers", "DUPLICATE", "Answer texts must be unique"))

        source_question: Optional[dict[str, Any]] = None
        if q.sourceQuestionId and not q.sourceFormId:
            errors.append(_issue(f"{path}.sourceFormId", "REQUIRED", "sourceQuestionId needs its sourceFormId"))
        elif q.sourceFormId:
            details = await _fetch_source(sources, q.sourceFormId, auth)
            if "error" in details:
                errors.append(_issue(f"{path}.sourceFormId", "UNKNOWN_SOURCE_ID", "sourceFormId is not a campaign you can access"))
            elif q.sourceQuestionId:
                source_question = next((sq for sq in details.get("questions", []) if sq.get("id") == q.sourceQuestionId), None)
                if source_question is None:
                    errors.append(_issue(f"{path}.sourceQuestionId", "UNKNOWN_SOURCE_ID", "sourceQuestionId does not exist in sourceFormId"))

        for a_index, a in enumerate(q.answers):
            a_path = f"{path}.answers.{a_index}"
            if a.id is not None:
                errors.append(_issue(f"{a_path}.id", "INVENTED_ID", "New items must use id null"))
            if a.sourceAnswerId:
                if source_question is None:
                    errors.append(_issue(f"{a_path}.sourceAnswerId", "UNKNOWN_SOURCE_ID", "sourceAnswerId needs a valid sourceQuestionId"))
                elif not any(sa.get("id") == a.sourceAnswerId for sa in source_question.get("answers", [])):
                    errors.append(_issue(f"{a_path}.sourceAnswerId", "UNKNOWN_SOURCE_ID", "sourceAnswerId does not exist in that question"))

    # FormIQ's own definition rules, on the draft exactly as it would be saved.
    if not errors and subsidiary_id:
        base = None
        if proposal.baseFormId:
            from app.services.aiCampaignTools import get_caller_form_detail

            # Backend business-rule read (never sent to the LLM), same access rule as the MCP check above.
            ctx = {"userId": auth["sub"], "role": auth["role"], "subsidiaryId": auth.get("subsidiaryId")}
            detail = get_caller_form_detail(db, ctx, proposal.baseFormId)
            content = (detail or {}).get("draft") or (detail or {}).get("published")
            base = content["definition"] if content else None
        definition = base.model_copy(deep=True) if base else form_builder_service._empty_form_definition(subsidiary_id)
        result["defaultLocale"] = definition.meta.defaultLocale
        definition = definition.model_copy(update={"questions": build_questions(proposal, definition.meta.defaultLocale)})
        validation = validate_form_definition(definition)
        for issue in validation.errors:
            errors.append(_issue("form", "FORM_RULE", issue.message))

    result["valid"] = not errors
    return result


def _normalized_proposal(proposal: FormProposal, subsidiary_id: str) -> dict[str, Any]:
    return {**proposal.model_dump(), "subsidiary": subsidiary_id}


def proposal_view(row: AIFormProposal, warnings: Optional[list[dict[str, str]]] = None) -> dict[str, Any]:
    """What the chat UI renders (a subset of the stored proposal)."""
    data = json.loads(row.proposalJson)
    return {
        "id": row.id,
        "version": row.version,
        "name": data["name"],
        "subsidiary": row.subsidiaryId,
        "projectCode": data.get("projectCode"),
        "baseFormId": data.get("baseFormId"),
        "questions": [
            {
                "heading": q["heading"],
                "subheading": q.get("subheading"),
                "controlType": q["controlType"],
                "required": q["required"],
                "answers": [a["text"] for a in q.get("answers", [])],
                "reused": bool(q.get("sourceQuestionId")),
                "sourceFormId": q.get("sourceFormId"),
                "sourceQuestionId": q.get("sourceQuestionId"),
            }
            for q in data["questions"]
        ],
        "warnings": [w["message"] for w in warnings or []],
        "saved": row.consumedAt is not None,
        "savedFormId": row.savedFormId,
    }


# --- the three entry points --------------------------------------------------

async def validate_form(db: Session, auth: dict, conversation_id: str, raw: Any) -> tuple[dict[str, Any], Optional[AIFormProposal]]:
    """The validate_form tool. Returns (tool result for the LLM, stored row if valid)."""
    checked = await check_proposal(db, auth, raw)
    if not checked["valid"]:
        return {"valid": False, "errors": checked["errors"], "warnings": checked["warnings"]}, None

    normalized = _normalized_proposal(checked["proposal"], checked["subsidiaryId"])
    body = canonical_json(normalized)
    latest = db.execute(
        select(func.max(AIFormProposal.version)).where(AIFormProposal.conversationId == conversation_id)
    ).scalar()
    row = AIFormProposal(
        conversationId=conversation_id,
        userId=auth["sub"],
        subsidiaryId=checked["subsidiaryId"],
        version=(latest or 0) + 1,
        proposalJson=body,
        contentHash=_sha256(body),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "valid": True,
        "proposalId": row.id,
        "version": row.version,
        "warnings": checked["warnings"],
        "note": "Shown to the user as a preview with an Approve & Save button. You cannot save it yourself.",
    }, row


def _owned_proposal(db: Session, auth: dict, proposal_id: str) -> AIFormProposal:
    row = db.get(AIFormProposal, proposal_id)
    # Strict ownership: only the user the proposal was made for can approve/save it.
    if row is None or str(row.userId).lower() != str(auth["sub"]).lower():
        raise NotFoundError("proposal not found")
    return row


def _assert_latest(db: Session, row: AIFormProposal) -> None:
    newer = db.execute(
        select(AIFormProposal.id).where(
            AIFormProposal.conversationId == row.conversationId, AIFormProposal.version > row.version
        )
    ).first()
    if newer is not None:
        raise ConflictError("This proposal was changed after it was shown — review and approve the latest version")


def approve_proposal(db: Session, auth: dict, proposal_id: str) -> dict[str, Any]:
    row = _owned_proposal(db, auth, proposal_id)
    if row.consumedAt is not None:
        raise ConflictError("This proposal has already been saved")
    _assert_latest(db, row)
    if not hmac.compare_digest(_sha256(row.proposalJson), row.contentHash):
        raise ConflictError("This proposal no longer matches what was validated")

    token = secrets.token_urlsafe(32)
    expires = _now() + APPROVAL_TTL
    db.execute(
        update(AIFormProposal).where(AIFormProposal.id == row.id).values(
            approvalTokenHash=_sha256(token), approvalExpiresAt=expires, approvedAt=_now(),
        )
    )
    db.commit()
    return {"approvalToken": token, "expiresAt": expires.isoformat()}


async def save_draft_form(db: Session, auth: dict, proposal_id: str, approval_token: Optional[str]) -> dict[str, Any]:
    from app.services import form_builder_service

    row = _owned_proposal(db, auth, proposal_id)
    if row.consumedAt is not None:
        raise ConflictError("This proposal has already been saved")
    if not approval_token or not row.approvalTokenHash or not hmac.compare_digest(_sha256(approval_token), row.approvalTokenHash):
        raise ApprovalError("Approve the proposal before saving it")
    expires = _aware(row.approvalExpiresAt)
    if expires is None or expires < _now():
        raise ApprovalError("The approval expired — approve the proposal again")
    _assert_latest(db, row)
    if not hmac.compare_digest(_sha256(row.proposalJson), row.contentHash):
        raise ConflictError("This proposal no longer matches what was approved")

    stored = json.loads(row.proposalJson)
    # Re-validate: access, project code or subsidiary state may have changed since.
    checked = await check_proposal(db, auth, {**stored, "subsidiary": stored.get("subsidiary") if is_admin_role(auth["role"]) else None})
    if not checked["valid"] or checked["subsidiaryId"] != row.subsidiaryId:
        raise ConflictError("This proposal is no longer valid: " + "; ".join(e["message"] for e in checked["errors"][:3]))

    # Claim the token atomically so two concurrent saves can't both create a form.
    claimed = db.execute(
        update(AIFormProposal)
        .where(AIFormProposal.id == row.id, AIFormProposal.consumedAt.is_(None), AIFormProposal.approvalTokenHash == row.approvalTokenHash)
        .values(consumedAt=_now())
    )
    db.commit()
    if claimed.rowcount != 1:
        raise ConflictError("This proposal has already been saved")

    admin = is_admin_role(auth["role"])
    proposal: FormProposal = checked["proposal"]
    try:
        created = form_builder_service.create_form(
            db,
            name=proposal.name,
            subsidiary_id=row.subsidiaryId,
            user_id=auth["sub"],
            project_code=proposal.projectCode,
            origin="admin" if admin else "adhoc",
            copy_from_form_id=proposal.baseFormId,
            exclude_locked_project_code=not admin,
        )
        detail = form_builder_service.get_form_detail(db, created["id"])
        draft = detail["draft"]
        definition = draft["definition"]
        definition = definition.model_copy(update={"questions": build_questions(proposal, definition.meta.defaultLocale)})
        form_builder_service.update_draft(db, created["id"], definition, draft["config"])
    except Exception:
        db.rollback()
        db.execute(update(AIFormProposal).where(AIFormProposal.id == row.id).values(consumedAt=None))
        db.commit()
        raise

    db.execute(update(AIFormProposal).where(AIFormProposal.id == row.id).values(savedFormId=created["id"]))
    db.commit()
    route = f"/admin/form-builder/{created['id']}" if admin else f"/my-forms/adhoc/{created['id']}"
    return {"formId": created["id"], "route": route, "proposalId": row.id}
