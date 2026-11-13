"""Port of `backend/src/entities/Form.ts`."""

from __future__ import annotations

from typing import Literal, Optional

from sqlalchemy import Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import (
    Base,
    datetimeoffset_now,
    datetimeoffset_nullable,
    nvarchar,
    uuid_col,
    uuid_pk,
)

FormStatus = Literal["draft", "published", "unpublished"]
FormOrigin = Literal["admin", "adhoc"]


class Form(Base):
    __tablename__ = "Forms"

    id: Mapped[str] = uuid_pk()
    name: Mapped[str] = nvarchar(200)
    subsidiaryId: Mapped[str] = nvarchar(50)
    projectCode: Mapped[Optional[str]] = nvarchar(100, nullable=True)
    status: Mapped[FormStatus] = nvarchar(20, default="draft")
    origin: Mapped[FormOrigin] = nvarchar(10, default="admin")
    pendingReview: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    submittedForReviewAt: Mapped[Optional[object]] = datetimeoffset_nullable()
    reviewedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
    reviewNote: Mapped[Optional[str]] = nvarchar(2000, nullable=True)
    currentDraftVersionId: Mapped[Optional[str]] = uuid_col(nullable=True)
    publishedVersionId: Mapped[Optional[str]] = uuid_col(nullable=True)
    # Which FormVersion (if any) was actually successfully pushed to Adobe
    # over SFTP (see form_builder_service.deploy_form) and when — distinct
    # from publishedVersionId/status "published", which flip the moment an
    # admin clicks Publish/Approve, well before any SFTP activity (see
    # publish_form's own doc comment on why those two are deliberately
    # separate actions). `lastDeployedVersionId == publishedVersionId` is
    # what "this exact content has actually gone live" means — the gate
    # form_builder_service.is_edit_locked_post_deploy checks, rather than
    # just `status == "published"`, so a subsidiary user's edit window
    # genuinely stays open for the gap between Publish and Deploy, and only
    # closes once the currently-published content has actually been
    # deployed. Never cleared by a later republish — a fresh publish just
    # changes publishedVersionId out from under it, which is exactly what
    # reopens the edit window (no mismatch -> no lock) until Deploy runs
    # again and re-stamps both.
    lastDeployedVersionId: Mapped[Optional[str]] = uuid_col(nullable=True)
    lastDeployedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
    isDeleted: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    createdByUserId: Mapped[str] = uuid_col()
    createdAt = datetimeoffset_now()
    updatedAt = datetimeoffset_now()
