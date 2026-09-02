"""Port of `backend/src/services/subsidiaryProjectBlockService.ts`."""

from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.errors import ConflictError, SubsidiaryProjectBlockedError
from app.models.subsidiary_project_block import SubsidiaryProjectBlock


def list_subsidiary_project_blocks(db: Session) -> list[SubsidiaryProjectBlock]:
    """Every currently-blocked (subsidiary, project code) pair, newest
    first — the admin management view."""
    return list(
        db.execute(select(SubsidiaryProjectBlock).order_by(SubsidiaryProjectBlock.createdAt.desc())).scalars().all()
    )


def create_subsidiary_project_block(db: Session, subsidiary_name: str, project_code: str) -> SubsidiaryProjectBlock:
    """Blocks a (subsidiary, project code) pair from new uploads —
    exact-match on both. Rejects an exact-duplicate pair with a
    `ConflictError`."""
    existing = db.execute(
        select(SubsidiaryProjectBlock).where(
            SubsidiaryProjectBlock.subsidiaryName == subsidiary_name,
            SubsidiaryProjectBlock.projectCode == project_code,
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError(f'"{project_code}" is already blocked for subsidiary "{subsidiary_name}"')

    created = SubsidiaryProjectBlock(subsidiaryName=subsidiary_name, projectCode=project_code)
    db.add(created)
    db.commit()
    db.refresh(created)
    return created


def delete_subsidiary_project_block(db: Session, id: str) -> bool:
    """Unblocks a pair (deletes the row). Returns `False` if it wasn't
    blocked — callers map that to a 404."""
    result = db.execute(delete(SubsidiaryProjectBlock).where(SubsidiaryProjectBlock.id == id))
    db.commit()
    return (result.rowcount or 0) > 0


def assert_not_blocked(db: Session, subsidiary_name: str, project_code: str) -> None:
    """Raises `SubsidiaryProjectBlockedError` if an admin has specifically
    blocked this project code for this subsidiary. A no-op otherwise — this
    is a blocklist, not a picklist. Not called from any route in this
    phase — ported so the form-builder phase can use it directly."""
    blocked = db.execute(
        select(SubsidiaryProjectBlock).where(
            SubsidiaryProjectBlock.subsidiaryName == subsidiary_name,
            SubsidiaryProjectBlock.projectCode == project_code,
        )
    ).scalar_one_or_none()
    if blocked is not None:
        raise SubsidiaryProjectBlockedError(
            f'Project code "{project_code}" is blocked for subsidiary "{subsidiary_name}"'
        )
