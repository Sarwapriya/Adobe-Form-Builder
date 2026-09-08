"""Port of `backend/src/services/projectCodeService.ts`."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.errors import ConflictError, NotFoundError, ProjectCodeClosedError
from app.models.form import Form
from app.models.project_code import ProjectCode
from app.models.subsidiary_project_block import SubsidiaryProjectBlock
from app.services import email_service
from app.services.subsidiary_recipients import resolve_subsidiary_recipients
from app.utils.background import run_in_background


def _parse_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()


def list_project_codes(db: Session) -> list[ProjectCode]:
    """Every project code, newest first — the admin management view (shows
    both open and closed)."""
    return list(db.execute(select(ProjectCode).order_by(ProjectCode.createdAt.desc())).scalars().all())


def list_open_project_codes(db: Session, exclude_locked: bool = False) -> list[ProjectCode]:
    """Only the open ones, code ascending — what the upload form's dropdown
    offers to any authenticated user. `exclude_locked` additionally drops
    locked codes for non-admin callers; admins stay exempt from the lock."""
    stmt = select(ProjectCode).where(ProjectCode.isOpen == True)  # noqa: E712
    if exclude_locked:
        stmt = stmt.where(ProjectCode.isLocked == False)  # noqa: E712
    stmt = stmt.order_by(ProjectCode.code.asc())
    return list(db.execute(stmt).scalars().all())


def list_open_project_codes_for_subsidiary(
    db: Session, subsidiary_name: str, exclude_locked: bool = False
) -> list[ProjectCode]:
    """Only the open ones, minus any an admin has specifically blocked for
    this subsidiary."""
    open_codes = list_open_project_codes(db, exclude_locked)
    blocks = db.execute(
        select(SubsidiaryProjectBlock).where(SubsidiaryProjectBlock.subsidiaryName == subsidiary_name)
    ).scalars().all()
    blocked_codes = {b.projectCode for b in blocks}
    return [pc for pc in open_codes if pc.code not in blocked_codes]


def create_project_code(
    db: Session,
    code: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    cutoff_date: Optional[str] = None,
) -> ProjectCode:
    """Creates a new project code, open by default. Rejects an
    exact-duplicate code (case-insensitive) with a `ConflictError`."""
    trimmed = code.strip()

    existing = db.execute(
        select(ProjectCode).where(func.lower(ProjectCode.code) == trimmed.lower())
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError(f'Project code "{trimmed}" already exists')

    created = ProjectCode(
        code=trimmed,
        isOpen=True,
        startDate=_parse_date(start_date),
        endDate=_parse_date(end_date),
        cutoffDate=_parse_date(cutoff_date),
    )
    db.add(created)
    db.commit()
    db.refresh(created)
    return created


def set_project_code_value(db: Session, id: str, code: str) -> Optional[ProjectCode]:
    """Renames a project code's own text value. Rejects an exact-duplicate
    code (case-insensitive, excluding this row itself). Returns `None` if
    the id doesn't exist. Does NOT retroactively rename anything already
    referencing the old value (text snapshot, not a foreign key)."""
    trimmed = code.strip()
    existing = db.get(ProjectCode, id)
    if existing is None:
        return None

    duplicate = db.execute(
        select(ProjectCode).where(func.lower(ProjectCode.code) == trimmed.lower(), ProjectCode.id != id)
    ).scalar_one_or_none()
    if duplicate is not None:
        raise ConflictError(f'Project code "{trimmed}" already exists')

    existing.code = trimmed
    db.add(existing)
    db.commit()
    db.refresh(existing)
    return existing


def set_project_code_open(db: Session, id: str, is_open: bool) -> Optional[ProjectCode]:
    """Toggles a project code open/closed. Returns `None` if the id doesn't
    exist — callers map that to a 404."""
    existing = db.get(ProjectCode, id)
    if existing is None:
        return None
    existing.isOpen = is_open
    db.add(existing)
    db.commit()
    db.refresh(existing)
    return existing


def _list_subsidiaries_under_project_code(db: Session, code: str) -> list[str]:
    """Every distinct subsidiary with a Form (draft or published, undeleted)
    under the given project code — the recipient set for the
    project-locked notification, mirroring cutoff_reminder_service's own
    "group Forms by subsidiaryId" shape."""
    rows = db.execute(select(Form.subsidiaryId).where(Form.projectCode == code, Form.isDeleted == False)).scalars()  # noqa: E712
    return list({r for r in rows})


def set_project_code_locked(db: Session, id: str, is_locked: bool) -> Optional[ProjectCode]:
    """Toggles a project code locked/unlocked — locking it (not unlocking)
    best-effort notifies every subsidiary that has a form under this code.
    Returns `None` if the id doesn't exist."""
    existing = db.get(ProjectCode, id)
    if existing is None:
        return None
    was_locked = existing.isLocked
    existing.isLocked = is_locked
    db.add(existing)
    db.commit()
    db.refresh(existing)

    if is_locked and not was_locked:
        code = existing.code
        cutoff_date = existing.cutoffDate
        for subsidiary_id in _list_subsidiaries_under_project_code(db, code):
            run_in_background(
                lambda bg_db, sid=subsidiary_id: email_service.send_project_locked_notification(
                    bg_db, resolve_subsidiary_recipients(bg_db, sid), code, cutoff_date
                )
            )

    return existing


def set_project_code_date_range(db: Session, id: str, date_range: dict[str, Any]) -> Optional[ProjectCode]:
    """Updates a project code's campaign date range. Each field is applied
    only if present as a key in `date_range` (an explicit `None` clears that
    bound; an omitted key leaves it as-is). Returns `None` if the id doesn't
    exist."""
    existing = db.get(ProjectCode, id)
    if existing is None:
        return None

    if "startDate" in date_range:
        existing.startDate = _parse_date(date_range["startDate"])
    if "endDate" in date_range:
        existing.endDate = _parse_date(date_range["endDate"])
    if "cutoffDate" in date_range:
        existing.cutoffDate = _parse_date(date_range["cutoffDate"])
    db.add(existing)
    db.commit()
    db.refresh(existing)
    return existing


def assert_project_code_open(db: Session, code: str) -> None:
    """Raises `NotFoundError` if no project code matches, or
    `ProjectCodeClosedError` if an admin has since closed it. A no-op if
    it's open. Not called from any route in this phase — ported so the
    form-builder phase can use it directly."""
    project_code = db.execute(select(ProjectCode).where(ProjectCode.code == code)).scalar_one_or_none()
    if project_code is None:
        raise NotFoundError(f'Unknown project code "{code}"')
    if not project_code.isOpen:
        raise ProjectCodeClosedError(f'Project code "{code}" is closed')
