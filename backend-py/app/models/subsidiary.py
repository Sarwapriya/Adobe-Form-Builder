"""Port of `backend/src/entities/Subsidiary.ts`."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, datetimeoffset_nullable, datetimeoffset_now, nvarchar, uuid_pk


class Subsidiary(Base):
    __tablename__ = "Subsidiaries"

    id: Mapped[str] = uuid_pk()
    name: Mapped[str] = nvarchar(100, unique=True)
    isActive: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    notificationEmail1: Mapped[Optional[str]] = nvarchar(255, nullable=True)
    notificationEmail2: Mapped[Optional[str]] = nvarchar(255, nullable=True)
    # Soft delete — the row (and everything keyed on its name) is kept; a
    # deleted subsidiary is also `isActive = False` and hidden from every list.
    # Re-adding the same name restores it. See subsidiary_service.delete_subsidiary.
    isDeleted: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    deletedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
    createdAt = datetimeoffset_now()
