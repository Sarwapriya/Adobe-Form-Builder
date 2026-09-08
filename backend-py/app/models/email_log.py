"""Port of `backend/src/entities/EmailLog.ts`.

`uploadId` is NOT NULL in the DB, a leftover from the removed Excel-upload
feature — nothing in this phase (or any phase before email-sending is built)
should ever write an `EmailLog` row; the model is kept faithful to the DB
schema only.
"""

from __future__ import annotations

from typing import Literal, Optional

from sqlalchemy.orm import Mapped

from app.models.base import Base, datetimeoffset_now, nvarchar, uuid_col, uuid_pk

EmailLogStatus = Literal["sent", "failed"]


class EmailLog(Base):
    __tablename__ = "EmailLogs"

    id: Mapped[str] = uuid_pk()
    uploadId: Mapped[str] = uuid_col()
    recipient: Mapped[str] = nvarchar(255)
    status: Mapped[EmailLogStatus] = nvarchar(20)
    errorMessage: Mapped[Optional[str]] = nvarchar(1000, nullable=True)
    sentAt = datetimeoffset_now()
