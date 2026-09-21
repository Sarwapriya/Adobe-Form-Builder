"""Port of `backend/src/services/subsidiaryService.ts`.

Note on `set_subsidiary_active`: the real TS implementation toggles ONLY the
`Subsidiary.isActive` flag itself — it does NOT cascade to disable/re-enable
that subsidiary's `User` rows. The cascade to `User.isActive` only happens on
`create_subsidiary` (re-enables users scoped to that name, mirroring a
previously-deleted subsidiary being re-added) and `delete_subsidiary`
(disables users scoped to the now-gone name). This module mirrors that
exactly — verified against the real source, not assumed.

Deleting is a soft delete (`Subsidiary.isDeleted`): the row is kept, hidden from
every list and treated as inactive, and adding the same name again restores it.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.errors import ConflictError, NotFoundError, SubsidiaryInactiveError
from app.models.subsidiary import Subsidiary
from app.models.user import User


def list_subsidiaries(db: Session) -> list[Subsidiary]:
    """Every subsidiary that hasn't been deleted, active and inactive alike,
    name ascending — the admin management view (needs to see disabled ones
    too, to re-enable them)."""
    return list(
        db.execute(
            select(Subsidiary).where(Subsidiary.isDeleted == False).order_by(Subsidiary.name.asc())  # noqa: E712
        ).scalars().all()
    )


def find_subsidiary_by_name(db: Session, name: str) -> Optional[Subsidiary]:
    """Looked up by name (not id) — `User.subsidiaryId`/the JWT's
    `subsidiaryId` claim both store the subsidiary's *name*, not its id."""
    return db.execute(select(Subsidiary).where(Subsidiary.name == name)).scalar_one_or_none()


def list_active_subsidiaries(db: Session) -> list[Subsidiary]:
    """Only the active ones — what the upload/user-creation forms'
    "Subsidiary" dropdowns offer to any authenticated user."""
    return list(
        db.execute(
            select(Subsidiary)
            .where(Subsidiary.isActive == True, Subsidiary.isDeleted == False)  # noqa: E712
            .order_by(Subsidiary.name.asc())
        ).scalars().all()
    )


def create_subsidiary(db: Session, name: str) -> Subsidiary:
    """Creates a new subsidiary, active by default. Rejects an
    exact-duplicate name (case-insensitive) with a `ConflictError`.

    Adding the name of a previously *deleted* subsidiary restores that row
    (active again) rather than creating a second one — its name is unique in
    the DB, and everything keyed on that name (project-code blocks, locales,
    forms) is still attached to it.

    Also re-enables every User scoped to this subsidiary name — the mirror
    image of `delete_subsidiary`'s own cascade: re-adding a subsidiary that
    was previously deleted (and so had auto-disabled its users) brings those
    accounts back automatically. A no-op update if no such users exist. Users
    who were themselves deleted stay deleted."""
    trimmed = name.strip()

    existing = db.execute(
        select(Subsidiary).where(func.lower(Subsidiary.name) == trimmed.lower())
    ).scalar_one_or_none()
    if existing is not None and not existing.isDeleted:
        raise ConflictError(f'Subsidiary "{trimmed}" already exists')

    if existing is not None:
        existing.name = trimmed
        existing.isDeleted = False
        existing.deletedAt = None
        existing.isActive = True
        created = existing
    else:
        created = Subsidiary(name=trimmed, isActive=True)
    db.add(created)
    db.execute(
        update(User).where(User.subsidiaryId == trimmed, User.isDeleted == False).values(isActive=True)  # noqa: E712
    )
    db.commit()
    db.refresh(created)
    return created


def set_subsidiary_active(db: Session, id: str, is_active: bool) -> Optional[Subsidiary]:
    """Toggles a subsidiary active/inactive — the reversible way to block
    every project for it in one step. Returns `None` if the id doesn't
    exist. Does NOT cascade to `User.isActive` — see this module's own doc
    comment above."""
    existing = db.get(Subsidiary, id)
    if existing is None or existing.isDeleted:
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
    if existing is None or existing.isDeleted:
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
    """Soft-deletes a subsidiary: flags it `isDeleted` and inactive (so it
    drops out of every list and every "is this subsidiary active" check), and
    disables every `User` currently scoped to it (with the subsidiary gone from
    the picklist there's no valid value left for their account to work
    under). Nothing is removed — its project-code blocks, locales and forms
    stay, and re-adding the same name restores it. Returns `False` if the id
    didn't exist (or was already deleted)."""
    existing = db.get(Subsidiary, id)
    if existing is None or existing.isDeleted:
        return False

    existing.isDeleted = True
    existing.deletedAt = datetime.now(timezone.utc)
    existing.isActive = False
    db.add(existing)
    db.execute(update(User).where(User.subsidiaryId == existing.name).values(isActive=False))
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

