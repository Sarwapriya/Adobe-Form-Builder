"""In-app notifications — one `Notification` row per recipient per event,
fanned out at creation time. Mirrors every event `email_service.py` already
sends an email for, using the exact same recipient sets (every active admin/
superadmin, or one subsidiary's own active users), just resolving `User.id`
instead of decrypting an email address. Called from the same
`run_in_background` call sites as the matching email send — see each of:
  - form_builder_service.submit_adhoc_form_for_review
  - form_contribution_service (contribution submitted)
  - project_code_service (project locked)
  - form_builder_service.publish_form (first publish of an admin-origin form)
  - resource_check_service._notify_admins / _notify_subsidiary_success
  - cutoff_reminder_service.run_cutoff_reminders

Never raises — a notification failure must not break whatever triggered it,
same discipline email_service.py already follows.
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User

DEFAULT_LIST_LIMIT = 50


def _admin_user_ids(db: Session) -> list[str]:
    return list(
        db.execute(select(User.id).where(User.role.in_(["admin", "superadmin"]), User.isActive == True)).scalars()  # noqa: E712
    )


def _subsidiary_user_ids(db: Session, subsidiary_id: str) -> list[str]:
    return list(db.execute(select(User.id).where(User.subsidiaryId == subsidiary_id, User.isActive == True)).scalars())  # noqa: E712


def _create_for(db: Session, user_ids: list[str], type_: str, title: str, message: str, link: Optional[str]) -> None:
    if not user_ids:
        return
    try:
        for user_id in user_ids:
            db.add(Notification(userId=user_id, type=type_, title=title, message=message, link=link))
        db.commit()
    except Exception as err:  # noqa: BLE001 — a notification failure must never break the caller
        print(f"[notification_service] Failed to create notifications: {err}")
        db.rollback()


def notify_admins(db: Session, type_: str, title: str, message: str, link: Optional[str] = None) -> None:
    _create_for(db, _admin_user_ids(db), type_, title, message, link)


def notify_subsidiary(db: Session, subsidiary_id: str, type_: str, title: str, message: str, link: Optional[str] = None) -> None:
    _create_for(db, _subsidiary_user_ids(db, subsidiary_id), type_, title, message, link)


def list_my_notifications(db: Session, user_id: str, limit: int = DEFAULT_LIST_LIMIT) -> list[dict]:
    rows = db.execute(
        select(Notification).where(Notification.userId == user_id).order_by(Notification.createdAt.desc()).limit(limit)
    ).scalars()
    return [
        {
            "id": r.id,
            "type": r.type,
            "title": r.title,
            "message": r.message,
            "link": r.link,
            "isRead": r.isRead,
            "createdAt": r.createdAt,
        }
        for r in rows
    ]


def count_unread(db: Session, user_id: str) -> int:
    return len(list(db.execute(select(Notification.id).where(Notification.userId == user_id, Notification.isRead == False)).scalars()))  # noqa: E712


def mark_read(db: Session, user_id: str, notification_id: str) -> bool:
    result = db.execute(
        update(Notification).where(Notification.id == notification_id, Notification.userId == user_id).values(isRead=True)
    )
    db.commit()
    return result.rowcount > 0


def mark_all_read(db: Session, user_id: str) -> int:
    result = db.execute(
        update(Notification).where(Notification.userId == user_id, Notification.isRead == False).values(isRead=True)  # noqa: E712
    )
    db.commit()
    return result.rowcount
