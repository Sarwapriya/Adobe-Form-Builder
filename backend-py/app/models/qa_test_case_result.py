"""Port of `backend/src/entities/QaTestCaseResult.ts`."""

from __future__ import annotations

from typing import Literal, Optional

from sqlalchemy.orm import Mapped

from app.models.base import Base, datetimeoffset_now, nvarchar, uuid_col, uuid_pk

QaTestCaseStatus = Literal["passed", "failed"]


class QaTestCaseResult(Base):
    __tablename__ = "QaTestCaseResults"

    id: Mapped[str] = uuid_pk()
    qaRunId: Mapped[str] = uuid_col()
    category: Mapped[str] = nvarchar(40)
    name: Mapped[str] = nvarchar(255)
    status: Mapped[QaTestCaseStatus] = nvarchar(10)
    fieldId: Mapped[Optional[str]] = nvarchar(100, nullable=True)
    message: Mapped[Optional[str]] = nvarchar(2000, nullable=True)
    createdAt = datetimeoffset_now()
