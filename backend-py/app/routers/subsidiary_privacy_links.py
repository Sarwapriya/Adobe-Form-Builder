"""Mounted at `/api/v1/subsidiary-privacy-links` (see `app/main.py`), requires
`require_auth` only — every authenticated user (not just admins) needs this
to auto-fill the Privacy Policy consent's Link URL in the form builder.
Admin-only management (add/edit/remove rows) lives under
`/api/v1/admin/subsidiary-privacy-links` (`app/routers/admin.py`) instead.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.security.deps import require_auth
from app.services import subsidiary_privacy_link_service

router = APIRouter(dependencies=[Depends(require_auth)])


@router.get("")
def get_subsidiary_privacy_links(subsidiary: Optional[str] = Query(default=None), db: Session = Depends(get_db)) -> dict[str, str]:
    if not subsidiary:
        return {}
    return subsidiary_privacy_link_service.get_privacy_links_for_subsidiary(db, subsidiary)
