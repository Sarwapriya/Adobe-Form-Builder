"""Port of `backend/src/services/aiCampaignTools.ts`.

Read-only tool implementations backing the AI assistant. Every function enforces
the same subsidiary-scoping as subsidiaryForms.router.ts.
"""

from __future__ import annotations

import re
from typing import Any, Optional, TypedDict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.form_pipeline import resolve_localized_text, validate_form_definition
from app.models.form import Form
from app.models.user import is_admin_role
from app.services import form_builder_service
from app.services.form_access_service import get_accessible_form_detail, list_accessible_forms

SCAN_FORM_LIMIT = 100
RESULT_LIMIT = 10


class AiToolCallerContext(TypedDict):
    userId: str
    role: str
    subsidiaryId: Optional[str]


class CompactQuestion(TypedDict):
    id: str
    heading: str
    controlType: str
    required: bool


class CompactCampaign(TypedDict):
    formId: str
    name: str
    status: str
    locales: list[str]
    defaultLocale: str
    questions: list[CompactQuestion]


class CampaignSearchResult(TypedDict):
    formId: str
    name: str
    status: str
    projectCode: Optional[str]
    questionCount: int
    updatedAt: str


class QuestionSearchResult(TypedDict):
    formId: str
    formName: str
    questionId: str
    heading: str
    controlType: str


def _list_caller_forms(
    db: Session, ctx: AiToolCallerContext,
    *, search: Optional[str] = None, project_code: Optional[str] = None,
    status: Optional[str] = None,
) -> list[dict[str, Any]]:
    """Every form the caller may read, scoped by role."""
    if is_admin_role(ctx["role"]):
        page = form_builder_service.list_forms(
            db, page_size=SCAN_FORM_LIMIT, search=search,
            project_code=project_code, status=status,
        )
        return page["items"]

    if not ctx["subsidiaryId"]:
        return []

    accessible = list_accessible_forms(db, ctx["subsidiaryId"], ctx["userId"])
    my_adhoc = form_builder_service.list_my_adhoc_forms(db, ctx["subsidiaryId"])
    by_id = {f["id"]: f for f in accessible}
    for f in my_adhoc:
        if f["id"] not in by_id:
            by_id[f["id"]] = f

    # Include drafts
    draft_rows = list(
        db.execute(
            select(Form).where(
                Form.subsidiaryId == ctx["subsidiaryId"],
                Form.status == "draft",
                Form.isDeleted == False,  # noqa: E712
            ).order_by(Form.updatedAt.desc())
        ).scalars()
    )
    for f in draft_rows:
        fid = f.id
        if fid not in by_id:
            by_id[fid] = {
                "id": f.id, "name": f.name, "subsidiaryId": f.subsidiaryId,
                "projectCode": f.projectCode, "status": f.status,
                "createdByUserId": f.createdByUserId, "createdAt": f.createdAt,
                "updatedAt": f.updatedAt, "publishedVersionNumber": None,
                "origin": f.origin, "pendingReview": f.pendingReview,
                "submittedForReviewAt": f.submittedForReviewAt,
                "reviewedAt": f.reviewedAt, "reviewNote": f.reviewNote,
            }

    forms = list(by_id.values())
    if status:
        forms = [f for f in forms if f["status"] == status]
    if project_code:
        forms = [f for f in forms if f.get("projectCode") == project_code]
    if search:
        needle = search.lower()
        forms = [f for f in forms if needle in f["name"].lower()]
    return forms[:SCAN_FORM_LIMIT]


def get_caller_form_detail(
    db: Session, ctx: AiToolCallerContext, form_id: str
) -> Optional[dict[str, Any]]:
    """Same access rule as _list_caller_forms, for a single form by id."""
    if is_admin_role(ctx["role"]):
        return form_builder_service.get_form_detail(db, form_id)
    if not ctx["subsidiaryId"]:
        return None

    accessible = get_accessible_form_detail(db, form_id, ctx["subsidiaryId"])
    if accessible:
        return accessible

    owned = form_builder_service.find_owned_adhoc_form(db, form_id, ctx["subsidiaryId"])
    if owned:
        return form_builder_service.get_form_detail(db, form_id)
    return None


def _to_compact_campaign(
    form_id: str, name: str, status: str, detail: dict[str, Any]
) -> CompactCampaign:
    content = detail.get("draft") or detail.get("published")
    if not content:
        return {"formId": form_id, "name": name, "status": status, "locales": [], "defaultLocale": "", "questions": []}
    definition = content["definition"]
    default_locale = definition.meta.defaultLocale
    questions = sorted(definition.questions, key=lambda q: q.order)
    return {
        "formId": form_id,
        "name": name,
        "status": status,
        "locales": [l.code for l in definition.locales],
        "defaultLocale": default_locale,
        "questions": [
            {
                "id": q.id,
                "heading": resolve_localized_text(q.headingByLocale, default_locale, default_locale),
                "controlType": q.controlType,
                "required": q.required,
            }
            for q in questions
        ],
    }


def _normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def _tokenize(text: str) -> set[str]:
    return {t for t in re.split(r"[^a-z0-9]+", text.lower()) if len(t) > 1}


def _overlap_score(a: set[str], b: set[str]) -> int:
    return sum(1 for t in a if t in b)


def search_campaigns(
    db: Session, ctx: AiToolCallerContext, args: dict[str, Any]
) -> list[CampaignSearchResult]:
    search_text = args.get("searchText")
    project_code = args.get("projectCode")
    status = args.get("status")

    forms = _list_caller_forms(
        db, ctx, search=search_text, project_code=project_code, status=status
    )

    # Fallback: normalize and tokenize if no results
    if not forms and search_text:
        candidates = _list_caller_forms(db, ctx, project_code=project_code, status=status)
        needle = _normalize(search_text)
        forms = [f for f in candidates if needle in _normalize(f["name"])]

        if not forms:
            needle_tokens = _tokenize(search_text)
            scored = [
                (f, _overlap_score(needle_tokens, _tokenize(f["name"])))
                for f in candidates
            ]
            scored = [(f, s) for f, s in scored if s > 0]
            scored.sort(key=lambda x: x[1], reverse=True)
            forms = [f for f, _ in scored]

    results: list[CampaignSearchResult] = []
    for f in forms[:RESULT_LIMIT]:
        results.append({
            "formId": f["id"],
            "name": f["name"],
            "status": f["status"],
            "projectCode": f.get("projectCode"),
            "questionCount": 0,
            "updatedAt": f["updatedAt"].isoformat() if hasattr(f["updatedAt"], "isoformat") else str(f["updatedAt"]),
        })
    return results


def get_campaign(
    db: Session, ctx: AiToolCallerContext, args: dict[str, Any]
) -> Optional[CompactCampaign]:
    detail = get_caller_form_detail(db, ctx, args["formId"])
    if not detail:
        return None
    return _to_compact_campaign(detail["id"], detail["name"], detail["status"], detail)


def get_campaign_questions(
    db: Session, ctx: AiToolCallerContext, args: dict[str, Any]
) -> Optional[list[CompactQuestion]]:
    campaign = get_campaign(db, ctx, args)
    return campaign["questions"] if campaign else None


def search_questions(
    db: Session, ctx: AiToolCallerContext, args: dict[str, Any]
) -> list[QuestionSearchResult]:
    form_id = args.get("formId")
    search_text = args["searchText"]
    needle = search_text.lower()

    if form_id:
        detail = get_caller_form_detail(db, ctx, form_id)
        forms = [detail] if detail else []
    else:
        form_list = _list_caller_forms(db, ctx)
        forms = []
        for f in form_list:
            detail = get_caller_form_detail(db, ctx, f["id"])
            if detail:
                forms.append(detail)

    results: list[QuestionSearchResult] = []
    for form in forms:
        content = form.get("draft") or form.get("published")
        if not content:
            continue
        definition = content["definition"]
        default_locale = definition.meta.defaultLocale
        for q in definition.questions:
            heading = resolve_localized_text(q.headingByLocale, default_locale, default_locale)
            if needle in heading.lower():
                results.append({
                    "formId": form["id"],
                    "formName": form["name"],
                    "questionId": q.id,
                    "heading": heading,
                    "controlType": q.controlType,
                })
            if len(results) >= RESULT_LIMIT:
                break
        if len(results) >= RESULT_LIMIT:
            break
    return results[:RESULT_LIMIT]


def find_similar_campaigns(
    db: Session, ctx: AiToolCallerContext, args: dict[str, Any]
) -> list[CampaignSearchResult]:
    target = get_caller_form_detail(db, ctx, args["formId"])
    if not target:
        return []
    target_tokens = _tokenize(target["name"])

    candidates = _list_caller_forms(db, ctx)
    scored = [
        (f, _overlap_score(target_tokens, _tokenize(f["name"])))
        for f in candidates if f["id"] != args["formId"]
    ]
    scored = [(f, s) for f, s in scored if s > 0]
    scored.sort(key=lambda x: x[1], reverse=True)

    results: list[CampaignSearchResult] = []
    for f, _ in scored[:RESULT_LIMIT]:
        results.append({
            "formId": f["id"],
            "name": f["name"],
            "status": f["status"],
            "projectCode": f.get("projectCode"),
            "questionCount": 0,
            "updatedAt": f["updatedAt"].isoformat() if hasattr(f["updatedAt"], "isoformat") else str(f["updatedAt"]),
        })
    return results


def find_similar_questions(
    db: Session, ctx: AiToolCallerContext, args: dict[str, Any]
) -> list[QuestionSearchResult]:
    target_text = args.get("text", "")
    if not target_text and args.get("formId") and args.get("questionId"):
        campaign = get_campaign(db, ctx, {"formId": args["formId"]})
        if campaign:
            q = next((q for q in campaign["questions"] if q["id"] == args["questionId"]), None)
            if q:
                target_text = q["heading"]
    if not target_text:
        return []

    target_tokens = _tokenize(target_text)
    form_list = _list_caller_forms(db, ctx)
    details = []
    for f in form_list:
        d = get_caller_form_detail(db, ctx, f["id"])
        if d:
            details.append(d)

    scored: list[tuple[QuestionSearchResult, int]] = []
    for form in details:
        content = form.get("draft") or form.get("published")
        if not content:
            continue
        definition = content["definition"]
        default_locale = definition.meta.defaultLocale
        for q in definition.questions:
            if args.get("formId") and args.get("questionId"):
                if form["id"] == args["formId"] and q.id == args["questionId"]:
                    continue
            heading = resolve_localized_text(q.headingByLocale, default_locale, default_locale)
            score = _overlap_score(target_tokens, _tokenize(heading))
            if score > 0:
                scored.append((
                    {
                        "formId": form["id"],
                        "formName": form["name"],
                        "questionId": q.id,
                        "heading": heading,
                        "controlType": q.controlType,
                    },
                    score,
                ))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [r for r, _ in scored[:RESULT_LIMIT]]


def validate_form(
    db: Session, ctx: AiToolCallerContext, args: dict[str, Any]
) -> Optional[dict[str, Any]]:
    detail = get_caller_form_detail(db, ctx, args["formId"])
    if not detail:
        return None
    content = detail.get("draft") or detail.get("published")
    if not content:
        return None
    validation = validate_form_definition(content["definition"])
    return {"errors": validation.errors, "warnings": validation.warnings}


async def build_campaign_references(
    db: Session, ctx: AiToolCallerContext, results: list[CampaignSearchResult]
) -> list[dict[str, Any]]:
    """Builds AIChatResponse.references for SEARCH_CAMPAIGNS/FIND_SIMILAR_CAMPAIGNS."""
    references = []
    for r in results:
        detail = get_caller_form_detail(db, ctx, r["formId"])
        if not detail:
            continue
        content = detail.get("draft") or detail.get("published")
        references.append({
            "formId": r["formId"],
            "name": r["name"],
            "status": r["status"],
            "origin": detail.get("origin", "admin"),
            "questionCount": len(content["definition"].questions) if content else 0,
            "locales": [l.code for l in content["definition"].locales] if content else [],
            "updatedAt": r["updatedAt"],
        })
    return references
