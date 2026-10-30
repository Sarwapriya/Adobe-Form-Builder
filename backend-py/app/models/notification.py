"""In-app notifications (`fq.Notifications`) — one row per recipient per
event, fanned out at creation time by `app/services/notification_service.py`,
which mirrors the exact same recipient sets `email_service.py` already
resolves for the matching email (every admin / one subsidiary's own users).
See notification_service.py's own doc comment for the full list of events."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, datetimeoffset_now, nvarchar, nvarchar_max, uuid_col, uuid_pk


class Notification(Base):
    __tablename__ = "Notifications"

    id: Mapped[str] = uuid_pk()
    userId: Mapped[str] = uuid_col()
    # A short machine-readable event name (e.g. "adhoc_submitted",
    # "form_published") — not currently branched on anywhere, just useful
    # for future filtering/analytics without a schema change.
    type: Mapped[str] = nvarchar(50)
    title: Mapped[str] = nvarchar(200)
    message: Mapped[str] = nvarchar_max()
    # App-relative path (e.g. "/admin/form-builder/adhoc") the notification
    # navigates to when clicked — same path email_service._app_link() builds
    # for the matching email, minus the origin (the frontend is already on
    # it). Null for the rare notification with nothing specific to open.
    link: Mapped[Optional[str]] = nvarchar(500, nullable=True)
    isRead: Mapped[bool] = mapped_column(Boolean, default=False)
    createdAt = datetimeoffset_now()
