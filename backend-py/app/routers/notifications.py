"""Mounted at `/api/v1/notifications` (see `app/main.py`), `require_auth`
only — every route scoped to the caller's own `auth["sub"]`, never another
user's rows. See app/services/notification_service.py for how these rows
get created in the first place."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.security.deps import require_auth
from app.services import notification_service

router = APIRouter(dependencies=[Depends(require_auth)])


@router.get("")
def list_notifications(
    limit: int = Query(default=notification_service.DEFAULT_LIST_LIMIT, ge=1, le=200),
    db: Session = Depends(get_db),
    auth: dict = Depends(require_auth),
) -> list[dict]:
    return notification_service.list_my_notifications(db, auth["sub"], limit)


@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> dict:
    return {"count": notification_service.count_unread(db, auth["sub"])}


@router.post("/{id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_notification_read(id: str, db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> None:
    if not notification_service.mark_read(db, auth["sub"], id):
        raise HTTPException(status_code=404, detail="notification not found")


@router.post("/read-all")
def mark_all_notifications_read(db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> dict:
    return {"count": notification_service.mark_all_read(db, auth["sub"])}
