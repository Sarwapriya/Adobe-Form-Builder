"""Port of `backend/src/services/subsidiaryRecipients.ts`."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.subsidiary import Subsidiary
from app.models.user import User
from app.security import dkms_client


def resolve_subsidiary_recipients(db: Session, subsidiary_name: str) -> list[str]:
    """This subsidiary's own active standard users' emails, plus its two
    extra notification addresses if set — deduplicated. Shared by every
    notification that's scoped to one subsidiary's own people.

    `User.email` is DKMS ciphertext at rest; decrypting it here is a genuine
    "otherwise use the original PII value" case (an actual outbound email
    needs a real address to send to), not a lookup/compare that could use
    `emailHash` instead. A user whose email fails to decrypt is silently
    skipped (via `decrypt_or_none`) rather than failing the whole recipient
    list — notificationEmail1/2 are separate, unencrypted columns."""
    users = db.execute(
        select(User).where(User.subsidiaryId == subsidiary_name, User.isActive == True)  # noqa: E712
    ).scalars().all()
    subsidiary = db.execute(select(Subsidiary).where(Subsidiary.name == subsidiary_name)).scalar_one_or_none()

    emails = {email for u in users if (email := dkms_client.decrypt_or_none(u.email))}
    if subsidiary is not None and subsidiary.notificationEmail1:
        emails.add(subsidiary.notificationEmail1)
    if subsidiary is not None and subsidiary.notificationEmail2:
        emails.add(subsidiary.notificationEmail2)
    return list(emails)
