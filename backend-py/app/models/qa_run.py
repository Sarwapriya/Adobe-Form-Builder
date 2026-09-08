"""Port of `backend/src/entities/QaRun.ts`, plus the un-registered migration
`2000000000000-AddFormQaRuns.ts` which:
  - relaxed `uploadId` to nullable,
  - added `formId`/`contributionId` (each with an FK to `Forms`/
    `FormContributions`),
  - added a CHECK constraint enforcing exactly one of `uploadId`/`formId`.

Per the phase-1 instructions, these are modeled as if they'd always been
part of the entity (`formId`/`contributionId` are real, currently-used
columns; only `uploadId` is the unused leftover from the removed Excel
feature).
"""

from __future__ import annotations

from typing import Literal, Optional

from sqlalchemy import CheckConstraint, ForeignKey, Integer
from sqlalchemy.dialects import mssql
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import (
    Base,
    datetimeoffset_now,
    datetimeoffset_nullable,
    nvarchar,
    nvarchar_max,
    uuid_col,
    uuid_pk,
)

QaRunStatus = Literal["pending", "running", "passed", "failed", "error"]
QaRunVariant = Literal["ff", "oc"]


class QaRun(Base):
    __tablename__ = "QaRuns"
    __table_args__ = (
        CheckConstraint(
            "([uploadId] IS NOT NULL AND [formId] IS NULL) OR ([uploadId] IS NULL AND [formId] IS NOT NULL)",
            name="CK_QaRuns_owner",
        ),
    )

    id: Mapped[str] = uuid_pk()
    uploadId: Mapped[Optional[str]] = uuid_col(nullable=True)
    formId: Mapped[Optional[str]] = mapped_column(
        mssql.UNIQUEIDENTIFIER(as_uuid=False),
        ForeignKey("Forms.id", name="FK_QaRuns_formId"),
        nullable=True,
    )
    contributionId: Mapped[Optional[str]] = mapped_column(
        mssql.UNIQUEIDENTIFIER(as_uuid=False),
        ForeignKey("FormContributions.id", name="FK_QaRuns_contributionId"),
        nullable=True,
    )
    variant: Mapped[QaRunVariant] = nvarchar(10)
    status: Mapped[QaRunStatus] = nvarchar(20, default="pending")
    triggeredByUserId: Mapped[str] = uuid_col()
    totalTests: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    passedTests: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    failedTests: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    errorMessage: Mapped[Optional[str]] = nvarchar_max(nullable=True)
    reportPath: Mapped[Optional[str]] = nvarchar(2000, nullable=True)
    createdAt = datetimeoffset_now()
    startedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
    completedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
