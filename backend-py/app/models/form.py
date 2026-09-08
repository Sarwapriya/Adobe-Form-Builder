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
    isDeleted: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    createdByUserId: Mapped[str] = uuid_col()
    createdAt = datetimeoffset_now()
    updatedAt = datetimeoffset_now()
