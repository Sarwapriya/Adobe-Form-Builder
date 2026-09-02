"""Port of `backend/src/services/adminSettingsService.ts` — the generic
key/value substrate every other settings service (SMTP/FabriX/Claude/SFTP)
builds on.
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.admin_setting import AdminSetting


def get_admin_setting(db: Session, key: str) -> Optional[str]:
    """Reads a single AdminSettings value by key. Returns `None` if the key
    has no row rather than raising — every current caller treats an unset
    setting as "fall back to a sensible default," not as an error
    condition."""
    setting = db.execute(select(AdminSetting).where(AdminSetting.key == key)).scalar_one_or_none()
    return setting.value if setting is not None else None


def set_admin_setting(db: Session, key: str, value: Optional[str]) -> None:
    """Upserts (or, for a `None`/blank value, deletes) a single AdminSettings
    row. `AdminSetting.value` is NOT NULL, so "unset" is represented by the
    row's absence rather than an empty string — matching `get_admin_setting`'s
    own "no row = None" convention, not a stored empty string that would need
    special-casing on every read."""
    trimmed = value.strip() if value else None
    if not trimmed:
        db.execute(delete(AdminSetting).where(AdminSetting.key == key))
        db.commit()
        return

    existing = db.execute(select(AdminSetting).where(AdminSetting.key == key)).scalar_one_or_none()
    if existing is not None:
        existing.value = trimmed
        db.add(existing)
    else:
        db.add(AdminSetting(key=key, value=trimmed))
    db.commit()
