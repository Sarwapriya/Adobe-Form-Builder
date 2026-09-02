"""Port of `backend/src/entities/Subsidiary.ts`."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, datetimeoffset_now, nvarchar, uuid_pk


class Subsidiary(Base):
    __tablename__ = "Subsidiaries"

    id: Mapped[str] = uuid_pk()
    name: Mapped[str] = nvarchar(100, unique=True)
    isActive: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    notificationEmail1: Mapped[Optional[str]] = nvarchar(255, nullable=True)
    notificationEmail2: Mapped[Optional[str]] = nvarchar(255, nullable=True)
    createdAt = datetimeoffset_now()
