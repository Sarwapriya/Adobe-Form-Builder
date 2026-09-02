"""Port of `backend/src/routes/subsidiaryLocale.router.ts`.

Mounted at `/api/v1/subsidiary-locales` (see `app/main.py`), requires
`require_auth` only — admin-only management (add/remove) lives under
`/api/v1/admin/subsidiary-locales` (`app/routers/admin.py`) instead.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.security.deps import require_auth
from app.services import subsidiary_locale_service

router = APIRouter(dependencies=[Depends(require_auth)])


def _serialize_locale(loc) -> dict:
    return {
        "id": loc.id,
        "subsidiaryName": loc.subsidiaryName,
        "code": loc.code,
        "langSubtag": loc.langSubtag,
        "isRtl": loc.isRtl,
        "label": loc.label,
        "isFallback": loc.isFallback,
        "sortOrder": loc.sortOrder,
        "createdAt": loc.createdAt,
    }


# Every authenticated user (not just admins) needs this to populate a locale
# picker for one subsidiary.
@router.get("")
def list_subsidiary_locales(subsidiary: Optional[str] = Query(default=None), db: Session = Depends(get_db)) -> list[dict]:
    if not subsidiary:
        return []
    return [_serialize_locale(loc) for loc in subsidiary_locale_service.list_subsidiary_locales(db, subsidiary)]
