"""A subsidiary user's request to edit a form that's currently locked for
subsidiary editing (see `form_builder_service.is_edit_locked_post_deploy`
for the ad-hoc "status == published" lock and the Translate & Extend
deploy-aware lock) — the admin-reviewed escape hatch for both, see
`form_update_request_service.py`.

Scoped to `(formId, subsidiaryId)` rather than just `formId`, since an
admin-authored (HR) form's Translate & Extend contributions can come from
several different subsidiaries independently — each subsidiary's own
request against the same shared form is tracked and reviewed separately.
"""

from __future__ import annotations

from typing import Literal, Optional

from sqlalchemy.orm import Mapped

from app.models.base import (
    Base,
    datetimeoffset_nullable,
    datetimeoffset_now,
    nvarchar,
    nvarchar_max,
    uuid_col,
    uuid_pk,
)

FormUpdateRequestStatus = Literal["pending", "approved", "rejected", "consumed"]


class FormUpdateRequest(Base):
    __tablename__ = "FormUpdateRequests"

    id: Mapped[str] = uuid_pk()
    formId: Mapped[str] = uuid_col()
    subsidiaryId: Mapped[str] = nvarchar(50)
    requestedByUserId: Mapped[str] = uuid_col()
    status: Mapped[FormUpdateRequestStatus] = nvarchar(20, default="pending")
    note: Mapped[Optional[str]] = nvarchar_max(nullable=True)
    reviewNote: Mapped[Optional[str]] = nvarchar_max(nullable=True)
    reviewedByUserId: Mapped[Optional[str]] = uuid_col(nullable=True)
    requestedAt = datetimeoffset_now()
    reviewedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
    # Stamped once an admin's subsequent Publish/Approve actually ships the
    # subsidiary's edit live (see form_builder_service.publish_form's own
    # consume step) — an "approved" request with this still unset is the
    # live, currently-open bypass; once consumed, a later edit attempt needs
    # a fresh request.
    consumedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
