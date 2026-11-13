"""A subsidiary user's request to edit a form that's currently locked for
subsidiary editing, and an admin's review of it — the escape hatch for both
of the locks `form_builder_service.py` enforces:

  - An ad-hoc form's own draft, once `Form.status == "published"` (see
    `update_adhoc_draft`/`upload_adhoc_consent_document`/
    `submit_adhoc_form_for_review`) — unchanged trigger point from before
    this feature existed, just with this bypass added on top.
  - A "Translate & Extend" contribution against *any* published form, once
    it's actually been deployed to Adobe at its current published version
    (see `form_builder_service.is_edit_locked_post_deploy` and
    `form_contribution_service.submit_contribution`/`save_contribution_draft`)
    — a genuinely new restriction; before this, a contribution could be
    submitted indefinitely after publish regardless of deploy status.

One row per `(formId, subsidiaryId)` "in flight" at a time (pending, or
approved-but-not-yet-consumed) — scoped by subsidiary rather than just the
form, since an admin-authored (HR) form's contributions can come from
several different subsidiaries independently, each reviewed on its own.

An approved request stays a live bypass (`has_open_update_request` returns
True) until `form_builder_service.publish_form` actually republishes this
form — at that point it's marked "consumed" (see `consume_approved_requests`,
called from `publish_form` itself), since the edit the request was for has
now gone live and the normal publish/deploy lock takes back over for
whatever comes next.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.form import Form
from app.models.form_update_request import FormUpdateRequest
from app.services import email_service, notification_service
from app.services.form_access_service import get_accessible_form_detail
from app.services.form_builder_service import find_owned_adhoc_form
from app.services.subsidiary_recipients import resolve_subsidiary_recipients
from app.utils.background import run_in_background


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _to_summary(row: FormUpdateRequest) -> dict[str, Any]:
    return {
        "id": row.id,
        "formId": row.formId,
        "subsidiaryId": row.subsidiaryId,
        "requestedByUserId": row.requestedByUserId,
        "status": row.status,
        "note": row.note,
        "reviewNote": row.reviewNote,
        "reviewedByUserId": row.reviewedByUserId,
        "requestedAt": row.requestedAt,
        "reviewedAt": row.reviewedAt,
        "consumedAt": row.consumedAt,
    }


def has_open_update_request(db: Session, form_id: str, subsidiary_id: str) -> bool:
    """True iff `subsidiary_id` has an *approved, not-yet-consumed* request
    for `form_id` — the one condition that re-opens an otherwise-locked edit
    action. A merely "pending" request grants nothing yet."""
    return (
        db.execute(
            select(FormUpdateRequest.id).where(
                FormUpdateRequest.formId == form_id,
                FormUpdateRequest.subsidiaryId == subsidiary_id,
                FormUpdateRequest.status == "approved",
            )
        ).first()
        is not None
    )


CreateUpdateRequestOutcome = Literal["ok", "not_found", "already_open"]


def create_request(db: Session, form_id: str, subsidiary_id: str, user_id: str, note: Optional[str] = None) -> dict[str, Any]:
    """A subsidiary user's own "Request Update" action. Accepts either an
    ad-hoc form this subsidiary owns, or any form they can otherwise reach
    via Translate & Extend (`get_accessible_form_detail`) — the same two
    surfaces this request is meant to unlock. Best-effort notifies admins."""
    owned = find_owned_adhoc_form(db, form_id, subsidiary_id)
    accessible = owned is not None or get_accessible_form_detail(db, form_id, subsidiary_id) is not None
    if not accessible:
        return {"outcome": "not_found"}

    already_open = db.execute(
        select(FormUpdateRequest.id).where(
            FormUpdateRequest.formId == form_id,
            FormUpdateRequest.subsidiaryId == subsidiary_id,
            FormUpdateRequest.status.in_(["pending", "approved"]),
        )
    ).first()
    if already_open is not None:
        return {"outcome": "already_open"}

    row = FormUpdateRequest(formId=form_id, subsidiaryId=subsidiary_id, requestedByUserId=user_id, status="pending", note=note or None)
    db.add(row)
    db.commit()
    db.refresh(row)

    form = db.get(Form, form_id)
    form_name = form.name if form is not None else "(deleted form)"

    def _notify(bg_db: Session) -> None:
        email_service.send_update_request_submitted_notification(bg_db, form_id, form_name, subsidiary_id, note or None)
        notification_service.notify_admins(
            bg_db, "update_request_submitted", "Update request submitted",
            f'"{form_name}" ({subsidiary_id}) requested permission to edit this deployed/published form.',
            link=f"/admin/form-builder/{form_id}",
        )

    run_in_background(_notify)
    return {"outcome": "ok", "request": _to_summary(row)}


def get_own_active_request(db: Session, form_id: str, subsidiary_id: str) -> Optional[dict[str, Any]]:
    """The one request this subsidiary should currently see on this form's
    banner — the newest pending or approved-unconsumed row if there is one,
    otherwise the most recently *rejected* row (so the rejection reason stays
    visible until a fresh request is made), otherwise `None`."""
    open_row = db.execute(
        select(FormUpdateRequest)
        .where(
            FormUpdateRequest.formId == form_id,
            FormUpdateRequest.subsidiaryId == subsidiary_id,
            FormUpdateRequest.status.in_(["pending", "approved"]),
        )
        .order_by(FormUpdateRequest.requestedAt.desc())
    ).scalars().first()
    if open_row is not None:
        return _to_summary(open_row)

    rejected_row = db.execute(
        select(FormUpdateRequest)
        .where(FormUpdateRequest.formId == form_id, FormUpdateRequest.subsidiaryId == subsidiary_id, FormUpdateRequest.status == "rejected")
        .order_by(FormUpdateRequest.requestedAt.desc())
    ).scalars().first()
    return _to_summary(rejected_row) if rejected_row is not None else None


def list_requests_for_form(db: Session, form_id: str) -> list[dict[str, Any]]:
    """Admin-facing — every request ever made against a form, newest first."""
    rows = list(db.execute(select(FormUpdateRequest).where(FormUpdateRequest.formId == form_id).order_by(FormUpdateRequest.requestedAt.desc())).scalars())
    return [_to_summary(r) for r in rows]


ReviewUpdateRequestOutcome = Literal["ok", "not_found", "not_pending"]


def approve_request(db: Session, request_id: str, admin_user_id: str, review_note: Optional[str] = None) -> ReviewUpdateRequestOutcome:
    """Opens the edit window for this one `(form, subsidiary)` pair — the
    subsidiary can now use `update_adhoc_draft`/`submit_adhoc_form_for_review`
    or `submit_contribution`/`save_contribution_draft` again, until this
    request is consumed by the next successful publish (see
    `form_builder_service.publish_form`)."""
    row = db.get(FormUpdateRequest, request_id)
    if row is None:
        return "not_found"
    if row.status != "pending":
        return "not_pending"

    row.status = "approved"
    row.reviewedByUserId = admin_user_id
    row.reviewedAt = _now()
    row.reviewNote = review_note or None
    db.commit()

    form = db.get(Form, row.formId)
    form_name = form.name if form is not None else "(deleted form)"
    form_origin = form.origin if form is not None else "admin"
    subsidiary_id = row.subsidiaryId
    form_id = row.formId

    def _notify(bg_db: Session) -> None:
        recipients = resolve_subsidiary_recipients(bg_db, subsidiary_id)
        email_service.send_update_request_approved_notification(bg_db, recipients, form_id, form_name, form_origin)
        notification_service.notify_subsidiary(
            bg_db, subsidiary_id, "update_request_approved", "Update request approved",
            f'Your request to edit "{form_name}" was approved — you can make your changes now.',
            link=f"/my-forms/adhoc/{form_id}" if form_origin == "adhoc" else f"/my-forms/{form_id}",
        )

    run_in_background(_notify)
    return "ok"


def reject_request(db: Session, request_id: str, admin_user_id: str, review_note: Optional[str] = None) -> ReviewUpdateRequestOutcome:
    """Leaves the form locked exactly as it was — just records the decision
    and lets the subsidiary know why, so they can submit a fresh request if
    the reason is addressable."""
    row = db.get(FormUpdateRequest, request_id)
    if row is None:
        return "not_found"
    if row.status != "pending":
        return "not_pending"

    row.status = "rejected"
    row.reviewedByUserId = admin_user_id
    row.reviewedAt = _now()
    row.reviewNote = review_note or None
    db.commit()

    form = db.get(Form, row.formId)
    form_name = form.name if form is not None else "(deleted form)"
    form_origin = form.origin if form is not None else "admin"
    subsidiary_id = row.subsidiaryId
    form_id = row.formId
    note_value = review_note or None

    def _notify(bg_db: Session) -> None:
        recipients = resolve_subsidiary_recipients(bg_db, subsidiary_id)
        email_service.send_update_request_rejected_notification(bg_db, recipients, form_id, form_name, form_origin, note_value)
        notification_service.notify_subsidiary(
            bg_db, subsidiary_id, "update_request_rejected", "Update request rejected",
            f'Your request to edit "{form_name}" was rejected.' + (f" Reason: {note_value}" if note_value else ""),
            link=f"/my-forms/adhoc/{form_id}" if form_origin == "adhoc" else f"/my-forms/{form_id}",
        )

    run_in_background(_notify)
    return "ok"


def consume_approved_requests(db: Session, form_id: str) -> None:
    """Marks every still-"approved" request for `form_id` as "consumed" —
    called from `form_builder_service.publish_form` right after a successful
    republish, since whatever the subsidiary was granted permission to edit
    has now gone live and the normal lock takes back over for next time.
    Never raises; a failure here must not break the publish it's called
    from."""
    try:
        rows = list(db.execute(select(FormUpdateRequest).where(FormUpdateRequest.formId == form_id, FormUpdateRequest.status == "approved")).scalars())
        if not rows:
            return
        now = _now()
        for row in rows:
            row.status = "consumed"
            row.consumedAt = now
        db.commit()
    except Exception as err:  # noqa: BLE001
        print(f"[form_update_request_service] Failed to consume approved requests for form {form_id}: {err}")
        db.rollback()
