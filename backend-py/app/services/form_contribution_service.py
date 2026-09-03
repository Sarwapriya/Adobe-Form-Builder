"""Port of `backend/src/services/formContributionService.ts` — the
subsidiary "Translate & Extend" contribution lifecycle: submit/save-draft/
list/approve/reject, merging onto a form's current draft via
`apply_contribution` (never a direct publish)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.form_pipeline import BuilderConfig, ContributionContent, FormDefinition, ValidationResult, apply_contribution, validate_contribution
from app.models.form import Form
from app.models.form_contribution import FormContribution
from app.models.form_version import FormVersion
from app.models.project_code import ProjectCode
from app.models.user import User
from app.security import dkms_client
from app.services import email_service
from app.services.form_access_service import get_accessible_form_detail
from app.services.form_builder_service import update_draft
from app.utils.background import run_in_background


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _to_summary(row: FormContribution) -> dict[str, Any]:
    return {
        "id": row.id,
        "formId": row.formId,
        "submittedByUserId": row.submittedByUserId,
        "status": row.status,
        "content": ContributionContent.model_validate_json(row.content),
        "note": row.note,
        "reviewNote": row.reviewNote,
        "reviewedByUserId": row.reviewedByUserId,
        "submittedAt": row.submittedAt,
        "reviewedAt": row.reviewedAt,
        "publishedAt": row.publishedAt,
    }


SubmitContributionOutcome = Literal["ok", "not_found", "invalid", "project_locked"]


def submit_contribution(
    db: Session,
    form_id: str,
    user_id: str,
    subsidiary_id: str,
    content: ContributionContent,
    note: Optional[str] = None,
) -> dict[str, Any]:
    """Validates a proposed contribution against the form's *published*
    content and, if valid, queues it as "pending" — never applied directly.
    Best-effort notifies the admin team via
    `email_service.send_contribution_submitted_notification`."""
    detail = get_accessible_form_detail(db, form_id, subsidiary_id)
    if not detail or not detail.get("published"):
        return {"outcome": "not_found"}

    # A locked project code freezes subsidiary contributions.
    if detail.get("projectCode"):
        project_code = db.execute(
            select(ProjectCode).where(ProjectCode.code == detail["projectCode"])
        ).scalar_one_or_none()
        if project_code is not None and project_code.isLocked:
            return {"outcome": "project_locked"}

    published = detail["published"]
    validation: ValidationResult = validate_contribution(published["definition"], content)
    if len(validation.errors) > 0:
        return {"outcome": "invalid", "validation": validation}

    # Promote an existing draft row in place rather than inserting a second
    # row — a save-then-submit session ends with exactly one row for this
    # (form, user) pair.
    existing_draft = db.execute(
        select(FormContribution).where(
            FormContribution.formId == form_id, FormContribution.submittedByUserId == user_id, FormContribution.status == "draft"
        )
    ).scalar_one_or_none()

    if existing_draft is not None:
        existing_draft.baseVersionId = published["id"]
        existing_draft.status = "pending"
        existing_draft.content = content.model_dump_json()
        existing_draft.note = note if note else None
        existing_draft.submittedAt = _now()
        row = existing_draft
    else:
        row = FormContribution(
            formId=form_id,
            submittedByUserId=user_id,
            baseVersionId=published["id"],
            status="pending",
            content=content.model_dump_json(),
            note=note if note else None,
        )
        db.add(row)
    db.commit()
    db.refresh(row)

    form = db.get(Form, form_id)
    submitter = db.get(User, user_id)
    if form is not None and submitter is not None:
        form_name = form.name
        submitter_username = submitter.username
        submitter_email_ciphertext = submitter.email
        note_value = note or None
        run_in_background(
            lambda bg_db: email_service.send_contribution_submitted_notification(
                bg_db,
                form_name,
                subsidiary_id,
                submitter_username,
                dkms_client.decrypt_or_none(submitter_email_ciphertext) or "",
                note_value,
            )
        )

    return {"outcome": "ok", "contribution": _to_summary(row), "validation": validation}


def list_contributions_for_form(db: Session, form_id: str) -> list[dict[str, Any]]:
    """Admin-facing — every *actually submitted* contribution for a form,
    regardless of status. Excludes "draft" rows."""
    rows = list(
        db.execute(
            select(FormContribution)
            .where(FormContribution.formId == form_id, FormContribution.status != "draft")
            .order_by(FormContribution.submittedAt.desc())
        ).scalars()
    )
    return [_to_summary(r) for r in rows]


def list_own_contributions(db: Session, form_id: str, user_id: str) -> list[dict[str, Any]]:
    """Standard-user-facing — only the caller's own rows for a form
    (including a "draft" one, if any)."""
    rows = list(
        db.execute(
            select(FormContribution)
            .where(FormContribution.formId == form_id, FormContribution.submittedByUserId == user_id)
            .order_by(FormContribution.submittedAt.desc())
        ).scalars()
    )
    return [_to_summary(r) for r in rows]


SaveContributionDraftOutcome = Literal["ok", "not_found"]


def save_contribution_draft(
    db: Session,
    form_id: str,
    user_id: str,
    subsidiary_id: str,
    content: ContributionContent,
    note: Optional[str] = None,
) -> dict[str, Any]:
    """Saves (or updates in place) this user's one draft row for a form —
    never queues it for admin review, and unlike `submit_contribution` runs
    no validation."""
    detail = get_accessible_form_detail(db, form_id, subsidiary_id)
    if not detail or not detail.get("published"):
        return {"outcome": "not_found"}

    published = detail["published"]
    existing_draft = db.execute(
        select(FormContribution).where(
            FormContribution.formId == form_id, FormContribution.submittedByUserId == user_id, FormContribution.status == "draft"
        )
    ).scalar_one_or_none()

    if existing_draft is not None:
        existing_draft.baseVersionId = published["id"]
        existing_draft.content = content.model_dump_json()
        existing_draft.note = note if note else None
        existing_draft.submittedAt = _now()
        row = existing_draft
    else:
        row = FormContribution(
            formId=form_id,
            submittedByUserId=user_id,
            baseVersionId=published["id"],
            status="draft",
            content=content.model_dump_json(),
            note=note if note else None,
        )
        db.add(row)
    db.commit()
    db.refresh(row)

    return {"outcome": "ok", "contribution": _to_summary(row)}


def list_own_contributions_all_forms(db: Session, user_id: str) -> list[dict[str, Any]]:
    """Standard-user-facing — every contribution this user has ever
    submitted, across every form, newest first. Enriches each row with its
    form's current name."""
    rows = list(
        db.execute(
            select(FormContribution)
            .where(FormContribution.submittedByUserId == user_id, FormContribution.status != "draft")
            .order_by(FormContribution.submittedAt.desc())
        ).scalars()
    )
    if not rows:
        return []

    form_ids = list({r.formId for r in rows})
    forms = list(db.execute(select(Form).where(Form.id.in_(form_ids))).scalars())
    name_by_id = {f.id: f.name for f in forms}

    return [{**_to_summary(r), "formName": name_by_id.get(r.formId, "(deleted form)")} for r in rows]


ReviewContributionOutcome = Literal["ok", "not_found", "not_pending"]


def approve_contribution(db: Session, contribution_id: str, admin_user_id: str, review_note: Optional[str] = None) -> dict[str, Any]:
    """Approving merges the contribution onto the form's *current draft*
    (never the published version directly) and marks it "approved" —
    deliberately **not** a publish."""
    contribution = db.get(FormContribution, contribution_id)
    if contribution is None:
        return {"outcome": "not_found"}
    if contribution.status != "pending":
        return {"outcome": "not_pending"}

    form = db.execute(select(Form).where(Form.id == contribution.formId, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None or not form.currentDraftVersionId:
        return {"outcome": "not_found"}

    draft_version = db.get(FormVersion, form.currentDraftVersionId)
    if draft_version is None:
        return {"outcome": "not_found"}

    draft_definition = FormDefinition.model_validate_json(draft_version.definition)
    draft_config = BuilderConfig.model_validate_json(draft_version.config)
    content = ContributionContent.model_validate_json(contribution.content)
    merged = apply_contribution(draft_definition, content)

    update_draft(db, form.id, merged, draft_config)

    contribution.status = "approved"
    contribution.reviewedByUserId = admin_user_id
    contribution.reviewedAt = _now()
    contribution.reviewNote = review_note if review_note else None
    db.commit()

    return {"outcome": "ok"}


def reject_contribution(db: Session, contribution_id: str, admin_user_id: str, review_note: Optional[str] = None) -> ReviewContributionOutcome:
    """Rejecting leaves the form entirely untouched — just records the
    decision."""
    contribution = db.get(FormContribution, contribution_id)
    if contribution is None:
        return "not_found"
    if contribution.status != "pending":
        return "not_pending"

    contribution.status = "rejected"
    contribution.reviewedByUserId = admin_user_id
    contribution.reviewedAt = _now()
    contribution.reviewNote = review_note if review_note else None
    db.commit()
    return "ok"
