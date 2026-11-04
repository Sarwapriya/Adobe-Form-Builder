"""Mounted at `/api/v1/subsidiary-recaptcha-configs` (see `app/main.py`),
requires `require_auth` only — every authenticated user (not just admins)
needs this so the form builder can warn when reCAPTCHA is toggled on for a
subsidiary with no site key configured yet. Admin-only management (add/edit/
remove rows) lives under `/api/v1/admin/subsidiary-recaptcha-configs`
(`app/routers/admin.py`) instead. The site key itself is never secret (only
Google's *secret* key, which this app never touches, needs protecting), so
returning it to any authenticated user is fine.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.security.deps import require_auth
from app.services import subsidiary_recaptcha_config_service

router = APIRouter(dependencies=[Depends(require_auth)])


@router.get("")
def get_subsidiary_recaptcha_config(subsidiary: Optional[str] = Query(default=None), db: Session = Depends(get_db)) -> dict:
    if not subsidiary:
        return {"siteKey": None}
    return {"siteKey": subsidiary_recaptcha_config_service.get_site_key_for_subsidiary(db, subsidiary)}
