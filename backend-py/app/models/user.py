"""Port of `backend/src/entities/User.ts`.

Includes `firstName`/`lastName` (added by the un-registered migration
`2010000000000-AddUserFirstLastName.ts` — real columns in the live DB, kept
here as if they'd always existed, per the phase-1 instructions).

`email`/`firstName`/`lastName` hold DKMS-encrypted ciphertext, not plaintext,
as of the DKMS PII-encryption rollout — see `app/security/dkms_client.py`
and `app/services/auth_service.py`'s create_user/update_user/
issue_access_token. `emailHash` is the deterministic hash used for
lookup/dedup instead of comparing (decrypted) plaintext email — this is a
Python-side-only column not yet present in the Node/TypeORM `User` entity;
see this feature's rollout notes for the required `ALTER TABLE` and the
one-time backfill script for existing rows.
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
    # Not `unique=True` (unlike username) — DKMS encryption is not guaranteed
    # deterministic (a randomized IV would make two encryptions of the same
    # plaintext email produce different ciphertext), so a DB-level unique
    # constraint on this column can no longer correctly express "one account
    # per email"; `emailHash` (deterministic) carries that constraint instead.
    # Widened from the pre-encryption `nvarchar(255)` — ciphertext for even a
    # short email can run longer than the plaintext did.
    email: Mapped[str] = nvarchar(1000)
    # Deterministic hash of the normalized (trimmed + lowercased) plaintext
    # email — the only thing ever compared for lookup/dedup, so nothing
    # needs to decrypt-and-compare `email` for that purpose. Not `unique=True`
    # here: SQL Server's plain UNIQUE constraint only tolerates one NULL row
    # total, which would reject the second not-yet-migrated/legacy row —
    # uniqueness is instead enforced via a filtered unique index
    # (`WHERE emailHash IS NOT NULL`) applied directly in SQL after the
    # existing-row backfill — see this feature's rollout SQL.
    emailHash: Mapped[Optional[str]] = nvarchar(500, nullable=True)
    passwordHash: Mapped[str] = nvarchar(255)
    firstName: Mapped[Optional[str]] = nvarchar(1000, nullable=True)
    lastName: Mapped[Optional[str]] = nvarchar(1000, nullable=True)
    role: Mapped[UserRole] = mapped_column(mssql.NVARCHAR(20), default="standard", server_default="standard")
    subsidiaryId: Mapped[Optional[str]] = nvarchar(50, nullable=True)
    isActive: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    notificationEmail: Mapped[Optional[str]] = nvarchar(255, nullable=True)
    notificationEmail2: Mapped[Optional[str]] = nvarchar(255, nullable=True)
    createdAt = datetimeoffset_now()
