"""Port of `backend/src/entities/User.ts`.

Includes `firstName`/`lastName` (added by the un-registered migration
`2010000000000-AddUserFirstLastName.ts` — real columns in the live DB, kept
here as if they'd always existed, per the phase-1 instructions).
"""

from __future__ import annotations

from typing import Literal, Optional

from sqlalchemy import Boolean
from sqlalchemy.dialects import mssql
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, datetimeoffset_now, nvarchar, uuid_pk

UserRole = Literal["admin", "standard", "superadmin"]


def is_admin_role(role: str) -> bool:
    """Port of `isAdminRole` (`backend/src/entities/User.ts`) — "admin" and
    "superadmin" both get full admin-panel access; "superadmin" is a strict
    superset (can provision other admins/superadmins)."""
    return role in ("admin", "superadmin")


class User(Base):
    __tablename__ = "Users"

    id: Mapped[str] = uuid_pk()
    username: Mapped[str] = nvarchar(100, unique=True)
    email: Mapped[str] = nvarchar(255, unique=True)
    passwordHash: Mapped[str] = nvarchar(255)
    firstName: Mapped[Optional[str]] = nvarchar(100, nullable=True)
    lastName: Mapped[Optional[str]] = nvarchar(100, nullable=True)
    role: Mapped[UserRole] = mapped_column(mssql.NVARCHAR(20), default="standard", server_default="standard")
    subsidiaryId: Mapped[Optional[str]] = nvarchar(50, nullable=True)
    isActive: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    notificationEmail: Mapped[Optional[str]] = nvarchar(255, nullable=True)
    notificationEmail2: Mapped[Optional[str]] = nvarchar(255, nullable=True)
    createdAt = datetimeoffset_now()
