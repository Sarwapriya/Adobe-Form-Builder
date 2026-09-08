"""Port of `backend/src/entities/FormContribution.ts`."""

from __future__ import annotations

from typing import Literal, Optional

from sqlalchemy.orm import Mapped

from app.models.base import (
    Base,
    datetimeoffset_now,
    datetimeoffset_nullable,
    nvarchar,
    nvarchar_max,
    uuid_col,
    uuid_pk,
)

ContributionStatus = Literal["draft", "pending", "approved", "rejected"]


class FormContribution(Base):
    __tablename__ = "FormContributions"

    id: Mapped[str] = uuid_pk()
    formId: Mapped[str] = uuid_col()
    submittedByUserId: Mapped[str] = uuid_col()
    baseVersionId: Mapped[Optional[str]] = uuid_col(nullable=True)
    status: Mapped[ContributionStatus] = nvarchar(20, default="pending")
    content: Mapped[str] = nvarchar_max()
    note: Mapped[Optional[str]] = nvarchar_max(nullable=True)
    reviewNote: Mapped[Optional[str]] = nvarchar_max(nullable=True)
    reviewedByUserId: Mapped[Optional[str]] = uuid_col(nullable=True)
    submittedAt = datetimeoffset_now()
    reviewedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
    publishedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
