"""Port of `backend/src/routes/subsidiary.router.ts`.

Mounted at `/api/v1/subsidiaries` (see `app/main.py`), requires `require_auth`
only — admin-only management (create/disable/delete, seeing inactive ones)
lives under `/api/v1/admin/subsidiaries` (`app/routers/admin.py`) instead.
"""

from __future__ import annotations

from typing import Annotated, Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, BeforeValidator, EmailStr
from sqlalchemy.orm import Session

from app.db import get_db
from app.security.deps import require_auth
from app.services import subsidiary_service

router = APIRouter(dependencies=[Depends(require_auth)])


def _empty_to_none(v: Any) -> Any:
    return None if v == "" else v


OptionalEmail = Annotated[Optional[EmailStr], BeforeValidator(_empty_to_none)]


def _serialize_subsidiary(s) -> dict:
    return {
        "id": s.id,
        "name": s.name,
        "isActive": s.isActive,
        "notificationEmail1": s.notificationEmail1,
        "notificationEmail2": s.notificationEmail2,
        "createdAt": s.createdAt,
    }


# Every authenticated user (not just admins) needs this to populate the
# upload/user-creation forms' "Subsidiary" dropdowns — a disabled subsidiary
# shouldn't even appear as an option.
@router.get("")
def list_active_subsidiaries(db: Session = Depends(get_db)) -> list[dict]:
    return [_serialize_subsidiary(s) for s in subsidiary_service.list_active_subsidiaries(db)]


# Lets a subsidiary-scoped standard user see their *own* subsidiary's two
# extra notification-email addresses without needing admin access.
# `auth["subsidiaryId"]` is the subsidiary's *name*, not its id.
@router.get("/mine")
def get_my_subsidiary(db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> dict:
    subsidiary_name = auth.get("subsidiaryId")
    if not subsidiary_name:
        raise HTTPException(status_code=400, detail="Your account isn't scoped to a subsidiary")
    subsidiary = subsidiary_service.find_subsidiary_by_name(db, subsidiary_name)
    if subsidiary is None:
        raise HTTPException(status_code=404, detail="Subsidiary not found")
    return _serialize_subsidiary(subsidiary)


class UpdateMineNotificationEmailBody(BaseModel):
    notificationEmail1: OptionalEmail = None
    notificationEmail2: OptionalEmail = None


@router.patch("/mine/notification-email")
def update_my_subsidiary_notification_email(
    body: UpdateMineNotificationEmailBody, db: Session = Depends(get_db), auth: dict = Depends(require_auth)
) -> dict:
    subsidiary_name = auth.get("subsidiaryId")
    if not subsidiary_name:
        raise HTTPException(status_code=400, detail="Your account isn't scoped to a subsidiary")
    subsidiary = subsidiary_service.find_subsidiary_by_name(db, subsidiary_name)
    if subsidiary is None:
        raise HTTPException(status_code=404, detail="Subsidiary not found")

    data = body.model_dump(exclude_unset=True)
    updated = subsidiary_service.set_subsidiary_notification_emails(db, subsidiary.id, data)
    assert updated is not None
    return _serialize_subsidiary(updated)
