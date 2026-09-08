"""Port of `backend/src/services/subsidiaryService.ts`.

Note on `set_subsidiary_active`: the real TS implementation toggles ONLY the
`Subsidiary.isActive` flag itself — it does NOT cascade to disable/re-enable
that subsidiary's `User` rows. The cascade to `User.isActive` only happens on
`create_subsidiary` (re-enables users scoped to that name, mirroring a
previously-deleted subsidiary being re-added) and `delete_subsidiary`
(disables users scoped to the now-gone name). This module mirrors that
exactly — verified against the real source, not assumed.
"""

from __future__ import annotations

from typing import Any, Optional

from sqlalchemy import delete as sa_delete
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.errors import ConflictError, NotFoundError, SubsidiaryInactiveError
from app.models.subsidiary import Subsidiary
from app.models.subsidiary_project_block import SubsidiaryProjectBlock
from app.models.user import User


def list_subsidiaries(db: Session) -> list[Subsidiary]:
    """Every subsidiary, active and inactive alike, name ascending — the
    admin management view (needs to see disabled ones too, to re-enable
    them)."""
    return list(db.execute(select(Subsidiary).order_by(Subsidiary.name.asc())).scalars().all())


def find_subsidiary_by_name(db: Session, name: str) -> Optional[Subsidiary]:
    """Looked up by name (not id) — `User.subsidiaryId`/the JWT's
    `subsidiaryId` claim both store the subsidiary's *name*, not its id."""
    return db.execute(select(Subsidiary).where(Subsidiary.name == name)).scalar_one_or_none()


def list_active_subsidiaries(db: Session) -> list[Subsidiary]:
    """Only the active ones — what the upload/user-creation forms'
    "Subsidiary" dropdowns offer to any authenticated user."""
    return list(
        db.execute(
            select(Subsidiary).where(Subsidiary.isActive == True).order_by(Subsidiary.name.asc())  # noqa: E712
        ).scalars().all()
    )


def create_subsidiary(db: Session, name: str) -> Subsidiary:
    """Creates a new subsidiary, active by default. Rejects an
    exact-duplicate name (case-insensitive) with a `ConflictError`.

    Also re-enables every User scoped to this subsidiary name — the mirror
    image of `delete_subsidiary`'s own cascade: re-adding a subsidiary that
    was previously deleted (and so had auto-disabled its users) brings those
    accounts back automatically. A no-op update if no such users exist."""
    trimmed = name.strip()

    existing = db.execute(
        select(Subsidiary).where(func.lower(Subsidiary.name) == trimmed.lower())
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError(f'Subsidiary "{trimmed}" already exists')

    created = Subsidiary(name=trimmed, isActive=True)
    db.add(created)
    db.execute(update(User).where(User.subsidiaryId == trimmed).values(isActive=True))
    db.commit()
    db.refresh(created)
    return created


def set_subsidiary_active(db: Session, id: str, is_active: bool) -> Optional[Subsidiary]:
    """Toggles a subsidiary active/inactive — the reversible way to block
    every project for it in one step. Returns `None` if the id doesn't
    exist. Does NOT cascade to `User.isActive` — see this module's own doc
    comment above."""
    existing = db.get(Subsidiary, id)
    if existing is None:
        return None
    existing.isActive = is_active
    db.add(existing)
    db.commit()
    db.refresh(existing)
    return existing


def set_subsidiary_notification_emails(db: Session, id: str, emails: dict[str, Any]) -> Optional[Subsidiary]:
    """Updates a subsidiary's up-to-two extra notification recipient
    addresses. Each explicit `None`/key-present clears/sets that slot; an
    omitted key leaves it as-is. Returns `None` if the id doesn't exist."""
    existing = db.get(Subsidiary, id)
    if existing is None:
        return None

    if "notificationEmail1" in emails:
        value = emails["notificationEmail1"]
        existing.notificationEmail1 = value.strip() if value else None
    if "notificationEmail2" in emails:
        value = emails["notificationEmail2"]
        existing.notificationEmail2 = value.strip() if value else None
    db.add(existing)
    db.commit()
    db.refresh(existing)
    return existing


def delete_subsidiary(db: Session, id: str) -> bool:
    """Permanently removes a subsidiary — the irreversible alternative to
    disabling it. Also removes any `SubsidiaryProjectBlock` rows naming it,
    and disables every `User` currently scoped to this subsidiary (with the
    subsidiary gone from the picklist there's no valid value left for their
    account to upload under). Returns `False` if the id didn't exist."""
    existing = db.get(Subsidiary, id)
    if existing is None:
        return False

    db.execute(sa_delete(SubsidiaryProjectBlock).where(SubsidiaryProjectBlock.subsidiaryName == existing.name))
    db.execute(update(User).where(User.subsidiaryId == existing.name).values(isActive=False))
    db.delete(existing)
    db.commit()
    return True


def assert_subsidiary_active(db: Session, name: str) -> None:
    """Raises `NotFoundError` if no subsidiary matches, or
    `SubsidiaryInactiveError` if an admin has since disabled it. A no-op if
    it's active. Not called from any route in this phase — ported so the
    form-builder phase can use it directly."""
    subsidiary = db.execute(select(Subsidiary).where(Subsidiary.name == name)).scalar_one_or_none()
    if subsidiary is None:
        raise NotFoundError(f'Unknown subsidiary "{name}"')
    if not subsidiary.isActive:
        raise SubsidiaryInactiveError(f'Subsidiary "{name}" is disabled')

