"""Port of `backend/src/services/subsidiaryRecipients.ts`."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.subsidiary import Subsidiary
from app.models.user import User


def resolve_subsidiary_recipients(db: Session, subsidiary_name: str) -> list[str]:
    """This subsidiary's own active standard users' emails, plus its two
    extra notification addresses if set — deduplicated. Shared by every
    notification that's scoped to one subsidiary's own people."""
    users = db.execute(
        select(User).where(User.subsidiaryId == subsidiary_name, User.isActive == True)  # noqa: E712
    ).scalars().all()
    subsidiary = db.execute(select(Subsidiary).where(Subsidiary.name == subsidiary_name)).scalar_one_or_none()

    emails = {u.email for u in users}
    if subsidiary is not None and subsidiary.notificationEmail1:
        emails.add(subsidiary.notificationEmail1)
    if subsidiary is not None and subsidiary.notificationEmail2:
        emails.add(subsidiary.notificationEmail2)
    return list(emails)
