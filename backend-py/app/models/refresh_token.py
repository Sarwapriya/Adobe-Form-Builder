"""Port of `backend/src/entities/RefreshToken.ts`."""

from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Mapped

from app.models.base import (
    Base,
    datetimeoffset_now,
    datetimeoffset_nullable,
    datetimeoffset_required,
    nvarchar,
    uuid_col,
    uuid_pk,
)


class RefreshToken(Base):
    __tablename__ = "RefreshTokens"

    id: Mapped[str] = uuid_pk()
    userId: Mapped[str] = uuid_col()
    tokenHash: Mapped[str] = nvarchar(128, unique=True)
    expiresAt = datetimeoffset_required()
    revokedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
    createdByIp: Mapped[Optional[str]] = nvarchar(45, nullable=True)
    createdAt = datetimeoffset_now()
