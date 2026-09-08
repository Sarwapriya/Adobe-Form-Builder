"""Port of `backend/src/entities/FormVersion.ts`."""

from __future__ import annotations

from typing import Literal, Optional

from sqlalchemy import Integer
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

FormVersionStatus = Literal["draft", "published", "archived"]


class FormVersion(Base):
    __tablename__ = "FormVersions"

    id: Mapped[str] = uuid_pk()
    formId: Mapped[str] = uuid_col()
    versionNumber: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    definition: Mapped[str] = nvarchar_max()
    config: Mapped[str] = nvarchar_max()
    status: Mapped[FormVersionStatus] = nvarchar(20, default="draft")
    createdByUserId: Mapped[str] = uuid_col()
    createdAt = datetimeoffset_now()
    publishedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
    unpublishedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
