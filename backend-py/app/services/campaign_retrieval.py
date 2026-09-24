"""Campaign retrieval (RAG) for the AI chatbot: search_previous_campaigns,
get_campaign_details and search_question_library.

`call_campaign_tool` is the one entry point every caller uses. By default
(`AI_RETRIEVAL_SOURCE=direct`) the tools run right here, on the backend's own
database session — the FormIQ `fq.` schema, which on the VM is AX-Innovation
(`crm-ax`). Setting `AI_RETRIEVAL_SOURCE=mcp` sends the same calls to the MCP
server instead (`mcp_sql_client.call_formiq_tool`, same tool names, arguments
and result shapes — the MCP port lives in the mcp_mssql_py repo's
`tools/formiq_tools.py`; keep the two in sync).

The direct path keeps the MCP design's guarantees:
  * fixed, parameterized SQL only — the LLM picks neither table nor query;
  * the subsidiary scope comes from the authenticated session (`auth`), inside
    the SQL WHERE clause — never from tool arguments. An LLM `subsidiary`
    argument is only ANDed onto that scope (can narrow, never widen);
  * an explicit field allow-list: campaign structure, questions, options,
    required flags and validation-message keys. Nothing from fq.Users,
    conversations, email logs, review notes, creator ids or file names is
    ever projected, so it can't reach the LLM.

Visibility:
  * admin / superadmin: every non-deleted form;
  * standard user with a subsidiary: that subsidiary's published forms whose
    (subsidiary, project code) pair isn't blocked (published version only),
    plus that subsidiary's own ad-hoc forms (any status, draft first);
  * standard user without a subsidiary: nothing.

Results are `{...}` or `{"error": {"code", "message"}}`; never raises.
"""

from __future__ import annotations

import json
import re
import uuid
from typing import Any, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import is_admin_role

CAMPAIGN_TOOLS = frozenset({"search_previous_campaigns", "get_campaign_details", "search_question_library"})

MAX_SCAN_FORMS = 200
MAX_RESULTS = 10
MAX_QUESTION_RESULTS = 20
CHOICE_CONTROL_TYPES = ("radio", "checkbox", "dropdown")
CONTROL_TYPES = (*CHOICE_CONTROL_TYPES, "text", "shortText")
PROFILE_FIELD_KEYS = (
    "email", "firstName", "lastName", "countryCode", "callingCode",
    "mobileNumber", "privacyPolicy", "marketingOptin", "termsAndConditions",
)
FORM_STATUSES = ("draft", "published", "unpublished")

# Campaign-type keyword aliases: internal CRM program names users abbreviate.
CAMPAIGN_ALIASES: tuple[tuple[str, ...], ...] = (
    ("hand raiser", "handraiser", "hand-raiser", "hr"),
    ("nps", "net promoter"),
)


class ToolError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


def retrieval_source() -> str:
    return "mcp" if (settings.AI_RETRIEVAL_SOURCE or "").strip().lower() == "mcp" else "direct"


async def call_campaign_tool(db: Session, name: str, arguments: dict[str, Any], auth: dict) -> dict[str, Any]:
    """Runs one retrieval tool for the signed-in `auth` user. Never raises."""
    if name not in CAMPAIGN_TOOLS:
        return {"error": {"code": "UNKNOWN_TOOL", "message": "unknown campaign tool"}}
    if retrieval_source() == "mcp":
        from app.services import mcp_sql_client

        return await mcp_sql_client.call_formiq_tool(name, arguments, auth)

    impl = {
        "search_previous_campaigns": search_previous_campaigns,
        "get_campaign_details": get_campaign_details,
        "search_question_library": search_question_library,
    }[name]
    try:
        result = impl(db, auth, **(arguments if isinstance(arguments, dict) else {}))
        print(f"[campaignRetrieval] {name} ok (direct)")
        return result
    except ToolError as exc:
        print(f"[campaignRetrieval] {name} {exc.code}")
        return {"error": {"code": exc.code, "message": str(exc)}}
    except TypeError:
        # The LLM passed an argument the tool doesn't take.
        return {"error": {"code": "BAD_ARGUMENT", "message": "unsupported argument for this tool"}}
    except Exception as exc:  # noqa: BLE001 - never leak SQL/driver details to the LLM
        print(f"[campaignRetrieval] {name} failed: {type(exc).__name__}")
        try:
            db.rollback()
        except Exception:  # noqa: BLE001
            pass
        return {"error": {"code": "INTERNAL", "message": "campaign lookup failed"}}


# --- database access --------------------------------------------------------

def _scope(auth: dict) -> tuple[str, str, dict[str, Any]]:
    """(WHERE clause, content-version column expression, params) for the session user."""
    if is_admin_role(auth.get("role")):
        return "f.isDeleted = 0", "COALESCE(f.currentDraftVersionId, f.publishedVersionId)", {}
    subsidiary_id = auth.get("subsidiaryId")
    if not subsidiary_id:
        return "1 = 0", "f.publishedVersionId", {}
    where = (
        "f.isDeleted = 0 AND f.subsidiaryId = :scope_subsidiary AND ("
        "(f.status = 'published' AND NOT EXISTS ("
        "SELECT 1 FROM fq.SubsidiaryProjectBlocks b "
        "WHERE b.subsidiaryName = :scope_subsidiary AND b.projectCode = f.projectCode))"
        " OR f.origin = 'adhoc')"
    )
    version = (
        "CASE WHEN f.origin = 'adhoc' THEN COALESCE(f.currentDraftVersionId, f.publishedVersionId) "
        "ELSE f.publishedVersionId END"
    )
    return where, version, {"scope_subsidiary": subsidiary_id}


def _load_forms(
    db: Session,
    auth: dict,
    *,
    form_id: Optional[str] = None,
    subsidiary: Optional[str] = None,
    project_code: Optional[str] = None,
    status: Optional[str] = None,
) -> list[dict[str, Any]]:
    where, version_expr, params = _scope(auth)
    clauses = [where]
    if form_id:
        clauses.append("f.id = :form_id")
        params["form_id"] = form_id
    if subsidiary:
        clauses.append("f.subsidiaryId = :filter_subsidiary")
        params["filter_subsidiary"] = subsidiary
    if project_code:
        clauses.append("f.projectCode = :filter_project_code")
        params["filter_project_code"] = project_code
    if status:
        clauses.append("f.status = :filter_status")
        params["filter_status"] = status
    sql = (
        f"SELECT TOP {MAX_SCAN_FORMS} f.id, f.name, f.subsidiaryId, f.projectCode, f.status, f.origin, "
        f"f.updatedAt, v.definition "
        f"FROM fq.Forms f LEFT JOIN fq.FormVersions v ON v.id = {version_expr} "
        f"WHERE {' AND '.join(clauses)} ORDER BY f.updatedAt DESC"
    )
    return [dict(row) for row in db.execute(text(sql), params).mappings().all()]


# --- allow-list projection --------------------------------------------------

def _text(by_locale: Any, default_locale: str) -> str:
    if not isinstance(by_locale, dict) or not by_locale:
        return ""
    for key in (default_locale, "en_GB", "en_US"):
        value = by_locale.get(key)
        if isinstance(value, str) and value:
            return value
    return next((v for v in by_locale.values() if isinstance(v, str) and v), "")


def _parse_definition(raw: Any) -> Optional[dict[str, Any]]:
    if not raw:
        return None
    try:
        value = json.loads(raw) if isinstance(raw, str) else raw
    except (TypeError, ValueError):
        return None
    return value if isinstance(value, dict) else None


def _project_questions(definition: dict[str, Any], default_locale: str) -> list[dict[str, Any]]:
    questions = [q for q in definition.get("questions") or [] if isinstance(q, dict)]
    projected = []
    for q in sorted(questions, key=lambda q: q.get("order") or 0):
        answers = [a for a in q.get("answers") or [] if isinstance(a, dict)]
        control_type = q.get("controlType")
        projected.append({
            "id": str(q.get("id") or ""),
            "order": q.get("order"),
            "controlType": control_type if control_type in CONTROL_TYPES else None,
            "required": bool(q.get("required")),
            "heading": _text(q.get("headingByLocale"), default_locale),
            "subheading": _text(q.get("subheadingByLocale"), default_locale) or None,
            "answers": [
                {"id": str(a.get("id") or ""), "order": a.get("order"), "text": _text(a.get("textByLocale"), default_locale)}
                for a in sorted(answers, key=lambda a: a.get("order") or 0)
            ],
            "visibleInVariants": [v for v in q.get("visibleInVariants") or [] if v in ("ff", "oc")] or None,
        })
    return projected


def _definition_summary(definition: Optional[dict[str, Any]]) -> tuple[str, list[str], list[dict[str, Any]]]:
    if not definition:
        return "", [], []
    meta = definition.get("meta") if isinstance(definition.get("meta"), dict) else {}
    default_locale = meta.get("defaultLocale") or "en_GB"
    locales = [
        str(l.get("code")) for l in definition.get("locales") or [] if isinstance(l, dict) and l.get("code")
    ]
    return default_locale, locales, _project_questions(definition, default_locale)


def _updated_at(value: Any) -> Optional[str]:
    return value.isoformat() if hasattr(value, "isoformat") else (str(value) if value is not None else None)


def project_campaign_summary(row: dict[str, Any]) -> dict[str, Any]:
    _default_locale, locales, questions = _definition_summary(_parse_definition(row.get("definition")))
    return {
        "formId": str(row["id"]),
        "name": row.get("name") or "",
        "subsidiary": row.get("subsidiaryId"),
        "projectCode": row.get("projectCode"),
        "status": row.get("status"),
        "origin": row.get("origin") if row.get("origin") in ("admin", "adhoc") else None,
        "questionCount": len(questions),
        "locales": locales,
        "updatedAt": _updated_at(row.get("updatedAt")),
    }


def project_campaign_details(row: dict[str, Any]) -> dict[str, Any]:
    definition = _parse_definition(row.get("definition"))
    default_locale, locales, questions = _definition_summary(definition)
    fields = (definition or {}).get("fields") if isinstance((definition or {}).get("fields"), dict) else {}
    profile_fields = []
    for key in PROFILE_FIELD_KEYS:
        meta = fields.get(key)
        if meta:
            entry: dict[str, Any] = {"key": key}
            if isinstance(meta, dict) and isinstance(meta.get("required"), bool):
                entry["required"] = meta["required"]
            profile_fields.append(entry)
    consents = [
        {"id": str(c.get("id")), **({"required": c["required"]} if isinstance(c.get("required"), bool) else {})}
        for c in fields.get("additionalConsents") or [] if isinstance(c, dict) and c.get("id")
    ]
    validation_messages = (definition or {}).get("validationMessages")
    locale_messages = validation_messages.get(default_locale) if isinstance(validation_messages, dict) else None
    return {
        **project_campaign_summary(row),
        "defaultLocale": default_locale or None,
        "questions": questions,
        "profileFields": profile_fields,
        "consents": consents,
        "validationMessageKeys": sorted(k for k, v in (locale_messages or {}).items() if v),
    }


# --- matching ---------------------------------------------------------------

def _normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def _tokens(value: str) -> set[str]:
    return {t for t in re.split(r"[^a-z0-9]+", value.lower()) if len(t) > 1}


def _query_variants(query: str) -> list[str]:
    variants = [query]
    lowered = query.lower().strip()
    for group in CAMPAIGN_ALIASES:
        if any(re.search(rf"(?<![a-z0-9]){re.escape(alias)}(?![a-z0-9])", lowered) for alias in group):
            variants.extend(alias for alias in group if alias != lowered)
    return variants


def _keyword_score(query: str, name: str, headings: list[str], answers: list[str], project_code: str) -> int:
    score = 0
    for variant in _query_variants(query):
        needle = _normalize(variant)
        if needle and needle in _normalize(name):
            score += 6
        if needle and needle == _normalize(project_code):
            score += 6
        tokens = _tokens(variant)
        score += 3 * len(tokens & _tokens(name))
        score += 2 * sum(len(tokens & _tokens(h)) for h in headings)
        score += sum(len(tokens & _tokens(a)) for a in answers)
    return score


def _structure_signature(questions: list[dict[str, Any]]) -> set[str]:
    signature = set()
    for q in questions:
        signature |= _tokens(q["heading"])
        signature.add(f"type:{q['controlType']}")
    return signature


def _jaccard(a: set[str], b: set[str]) -> float:
    return len(a & b) / len(a | b) if a and b else 0.0


def _valid_uuid(value: Any) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except (TypeError, ValueError):
        return False


def _clamp(value: Any, default: int, maximum: int) -> int:
    try:
        return max(1, min(maximum, int(value)))
    except (TypeError, ValueError):
        return default


# --- tools (auth always comes from the session, never from the LLM) ---------

def search_previous_campaigns(
    db: Session,
    auth: dict,
    query: Optional[str] = None,
    projectCode: Optional[str] = None,
    subsidiary: Optional[str] = None,
    status: Optional[str] = None,
    similarToFormId: Optional[str] = None,
    limit: Optional[int] = None,
) -> dict[str, Any]:
    if status and status not in FORM_STATUSES:
        raise ToolError("BAD_ARGUMENT", f"status must be one of {', '.join(FORM_STATUSES)}")
    if similarToFormId and not _valid_uuid(similarToFormId):
        raise ToolError("BAD_ARGUMENT", "similarToFormId must be a formId returned by a previous search")
    limit = _clamp(limit, MAX_RESULTS, MAX_RESULTS)

    rows = _load_forms(db, auth, subsidiary=subsidiary, project_code=projectCode, status=status)

    target_signature: Optional[set[str]] = None
    if similarToFormId:
        target = next((r for r in rows if str(r["id"]).lower() == similarToFormId.lower()), None)
        if target is None:
            found = _load_forms(db, auth, form_id=similarToFormId)
            target = found[0] if found else None
        if target is None:
            raise ToolError("NOT_FOUND", "campaign not found")
        target_signature = _structure_signature(_definition_summary(_parse_definition(target.get("definition")))[2])

    scored: list[tuple[float, dict[str, Any]]] = []
    for row in rows:
        if similarToFormId and str(row["id"]).lower() == similarToFormId.lower():
            continue
        _locale, _locales, questions = _definition_summary(_parse_definition(row.get("definition")))
        score = 0.0
        matched_on: list[str] = []
        if query:
            keyword = _keyword_score(
                query, row.get("name") or "",
                [q["heading"] for q in questions],
                [a["text"] for q in questions for a in q["answers"]],
                row.get("projectCode") or "",
            )
            if keyword <= 0:
                continue
            score += keyword
            matched_on.append("keywords")
        if target_signature is not None:
            similarity = _jaccard(target_signature, _structure_signature(questions))
            if similarity <= 0:
                continue
            score += similarity * 20
            matched_on.append("structure")
        summary = project_campaign_summary(row)
        if matched_on:
            summary["matchedOn"] = matched_on
        scored.append((score, summary))

    if query or target_signature is not None:
        scored.sort(key=lambda item: item[0], reverse=True)
    return {"campaigns": [summary for _score, summary in scored[:limit]], "totalMatched": len(scored)}


def get_campaign_details(db: Session, auth: dict, formId: str) -> dict[str, Any]:
    if not _valid_uuid(formId):
        raise ToolError("NOT_FOUND", "campaign not found")
    rows = _load_forms(db, auth, form_id=formId)
    if not rows:
        # Identical whether the form doesn't exist or is outside the caller's scope.
        raise ToolError("NOT_FOUND", "campaign not found")
    return project_campaign_details(rows[0])


def search_question_library(
    db: Session,
    auth: dict,
    text: str = "",
    controlType: Optional[str] = None,
    formId: Optional[str] = None,
    subsidiary: Optional[str] = None,
    limit: Optional[int] = None,
) -> dict[str, Any]:
    if not text or not text.strip():
        raise ToolError("BAD_ARGUMENT", "text is required")
    if controlType and controlType not in CONTROL_TYPES:
        raise ToolError("BAD_ARGUMENT", f"controlType must be one of {', '.join(CONTROL_TYPES)}")
    if formId and not _valid_uuid(formId):
        raise ToolError("NOT_FOUND", "campaign not found")
    limit = _clamp(limit, MAX_QUESTION_RESULTS, MAX_QUESTION_RESULTS)

    rows = _load_forms(db, auth, form_id=formId, subsidiary=subsidiary)
    scored: list[tuple[int, dict[str, Any]]] = []
    for row in rows:
        _locale, _locales, questions = _definition_summary(_parse_definition(row.get("definition")))
        for q in questions:
            if controlType and q["controlType"] != controlType:
                continue
            score = _keyword_score(text, "", [q["heading"]], [a["text"] for a in q["answers"]], "")
            if score <= 0:
                continue
            scored.append((score, {
                "sourceFormId": str(row["id"]),
                "formName": row.get("name") or "",
                "subsidiary": row.get("subsidiaryId"),
                "sourceQuestionId": q["id"],
                "heading": q["heading"],
                "subheading": q["subheading"],
                "controlType": q["controlType"],
                "required": q["required"],
                "answers": q["answers"],
            }))
    scored.sort(key=lambda item: item[0], reverse=True)
    return {"questions": [item for _score, item in scored[:limit]], "totalMatched": len(scored)}
