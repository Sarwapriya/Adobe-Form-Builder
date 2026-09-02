"""Port of `backend/src/entities/QuestionMasterVersion.ts`."""

from __future__ import annotations

from typing import Literal

from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, datetimeoffset_now, nvarchar, uuid_col, uuid_pk

QuestionMasterSource = Literal["form_builder", "excel_upload"]


class QuestionMasterVersion(Base):
    __tablename__ = "QuestionMasterVersions"

    id: Mapped[str] = uuid_pk()
    projectCode: Mapped[str] = nvarchar(100)
    version: Mapped[int] = mapped_column(Integer)
    division: Mapped[str] = nvarchar(50)
    filePath: Mapped[str] = nvarchar(500)
    subsidiaryCount: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    # Named totalRows, not rowCount — ROWCOUNT is a reserved T-SQL keyword.
    totalRows: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    generatedByUserId: Mapped[str] = uuid_col()
    generatedAt = datetimeoffset_now()
    source: Mapped[QuestionMasterSource] = nvarchar(20, default="form_builder")
