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
    # A digest of "which question ids exist, which optional profile fields
    # are present" at the point this version's generated files were last
    # fully (re)generated — see form_builder_service.compute_structure_fingerprint.
    # Null for a version whose files have never been generated at all.
    # Compared at Publish time to decide whether a hand-edited HTML/behavior-
    # JS file is still structurally valid or needs the admin's confirmation
    # before being reset.
    structureFingerprint: Mapped[Optional[str]] = nvarchar(1000, nullable=True)
