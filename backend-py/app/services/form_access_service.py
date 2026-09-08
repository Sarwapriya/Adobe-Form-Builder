"""Port of `backend/src/services/formAccessService.ts` — read access to a
*published* Form for a subsidiary-scoped standard user. A form is visible to
a standard user iff: it belongs to their own subsidiary, it's currently
published, and its (subsidiary, project code) pair isn't blocked."""

from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.form import Form
from app.models.form_contribution import FormContribution
from app.models.form_version import FormVersion
from app.models.project_code import ProjectCode
from app.models.subsidiary_project_block import SubsidiaryProjectBlock
from app.services.form_builder_service import get_form_detail


def _to_access_list_item(
    db: Session,
    form: Form,
    my_contribution_progress: Optional[dict[str, Any]] = None,
    project_code_locked: bool = False,
) -> dict[str, Any]:
    """Own local view-model builder (deliberately not reusing
    `form_builder_service`'s private list-item helper), mirroring the Node
    source's `formAccessService.ts`, which likewise defines its own
    `toListItem` rather than importing `formBuilderService`'s."""
    published_version = db.get(FormVersion, form.publishedVersionId) if form.publishedVersionId else None
    return {
        "id": form.id,
        "name": form.name,
        "subsidiaryId": form.subsidiaryId,
        "projectCode": form.projectCode,
        "status": form.status,
        "createdByUserId": form.createdByUserId,
        "createdAt": form.createdAt,
        "updatedAt": form.updatedAt,
        "publishedVersionNumber": published_version.versionNumber if published_version else None,
        "origin": form.origin,
        "pendingReview": form.pendingReview,
        "submittedForReviewAt": form.submittedForReviewAt,
        "reviewedAt": form.reviewedAt,
        "reviewNote": form.reviewNote,
        "myContributionProgress": my_contribution_progress,
        "projectCodeLocked": project_code_locked,
    }


def _locked_by_project_code(db: Session, forms: list[Form]) -> dict[str, bool]:
    """Locked status for every distinct project code among `forms`, in one
    query — avoids an N+1 lookup when building a whole list."""
    codes = list({f.projectCode for f in forms if f.projectCode})
    if not codes:
        return {}
    rows = list(db.execute(select(ProjectCode).where(ProjectCode.code.in_(codes))).scalars())
    return {pc.code: pc.isLocked for pc in rows}


def _latest_own_contribution_progress_by_form(db: Session, form_ids: list[str], user_id: str) -> dict[str, dict[str, Any]]:
    """This user's own latest *actually submitted* contribution per form,
    keyed by formId. Excludes "draft" rows."""
    if not form_ids:
        return {}
    rows = list(
        db.execute(
            select(FormContribution)
            .where(
                FormContribution.formId.in_(form_ids),
                FormContribution.submittedByUserId == user_id,
                FormContribution.status != "draft",
            )
            .order_by(FormContribution.submittedAt.desc())
        ).scalars()
    )
    by_form: dict[str, dict[str, Any]] = {}
    for row in rows:
        if row.formId not in by_form:
            by_form[row.formId] = {
                "status": row.status,
                "submittedAt": row.submittedAt,
                "reviewedAt": row.reviewedAt,
                "publishedAt": row.publishedAt,
            }
    return by_form


def list_accessible_forms(db: Session, subsidiary_id: str, user_id: str) -> list[dict[str, Any]]:
    """Every published form for `subsidiary_id`, minus any whose project code
    is currently blocked for that subsidiary."""
    forms = list(
        db.execute(
            select(Form)
            .where(Form.subsidiaryId == subsidiary_id, Form.status == "published", Form.isDeleted == False)  # noqa: E712
            .order_by(Form.updatedAt.desc())
        ).scalars()
    )
    if not forms:
        return []

    blocks = list(db.execute(select(SubsidiaryProjectBlock).where(SubsidiaryProjectBlock.subsidiaryName == subsidiary_id)).scalars())
    blocked_project_codes = {b.projectCode for b in blocks}
    visible = [f for f in forms if not f.projectCode or f.projectCode not in blocked_project_codes]

    progress_by_form = _latest_own_contribution_progress_by_form(db, [f.id for f in visible], user_id)
    locked_by_code = _locked_by_project_code(db, visible)

    return [
        _to_access_list_item(
            db,
            f,
            progress_by_form.get(f.id),
            locked_by_code.get(f.projectCode, False) if f.projectCode else False,
        )
        for f in visible
    ]


def get_accessible_form_detail(db: Session, form_id: str, subsidiary_id: str) -> Optional[dict[str, Any]]:
    """Same visibility rule as `list_accessible_forms`, for a single form —
    returns `None` identically whether the form doesn't exist, isn't
    published, belongs to a different subsidiary, or is blocked."""
    form = db.execute(
        select(Form).where(
            Form.id == form_id, Form.subsidiaryId == subsidiary_id, Form.status == "published", Form.isDeleted == False  # noqa: E712
        )
    ).scalar_one_or_none()
    if form is None:
        return None

    if form.projectCode:
        blocked = db.execute(
            select(SubsidiaryProjectBlock).where(
                SubsidiaryProjectBlock.subsidiaryName == subsidiary_id, SubsidiaryProjectBlock.projectCode == form.projectCode
            )
        ).scalar_one_or_none()
        if blocked is not None:
            return None

    detail = get_form_detail(db, form_id)
    if detail is None:
        return None

    if form.projectCode:
        project_code_row = db.execute(select(ProjectCode).where(ProjectCode.code == form.projectCode)).scalar_one_or_none()
        detail["projectCodeLocked"] = project_code_row.isLocked if project_code_row else False
    return detail
