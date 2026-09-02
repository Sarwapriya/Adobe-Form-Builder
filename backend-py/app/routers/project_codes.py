"""Port of `backend/src/routes/projectCode.router.ts`.

Mounted at `/api/v1/project-codes` (see `app/main.py`), requires `require_auth`
only (any authenticated user, not just admins) — admin-only management lives
under `/api/v1/admin/project-codes` (`app/routers/admin.py`) instead.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import is_admin_role
from app.security.deps import require_auth
from app.services import project_code_service

router = APIRouter(dependencies=[Depends(require_auth)])


def _serialize_project_code(pc) -> dict:
    return {
        "id": pc.id,
        "code": pc.code,
        "isOpen": pc.isOpen,
        "isLocked": pc.isLocked,
        "startDate": pc.startDate.isoformat() if pc.startDate else None,
        "endDate": pc.endDate.isoformat() if pc.endDate else None,
        "cutoffDate": pc.cutoffDate.isoformat() if pc.cutoffDate else None,
        "createdAt": pc.createdAt,
    }


# Every authenticated user (not just admins) needs this to populate the
# upload form's "Project Code" dropdown. With ?subsidiary=NAME, also excludes
# any code an admin has specifically blocked for that subsidiary. A locked
# code is additionally excluded for non-admin callers (admins stay exempt
# from the lock).
@router.get("")
def list_open_project_codes(
    subsidiary: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    auth: dict = Depends(require_auth),
) -> list[dict]:
    exclude_locked = not is_admin_role(auth.get("role", ""))
    if subsidiary:
        codes = project_code_service.list_open_project_codes_for_subsidiary(db, subsidiary, exclude_locked)
    else:
        codes = project_code_service.list_open_project_codes(db, exclude_locked)
    return [_serialize_project_code(c) for c in codes]
