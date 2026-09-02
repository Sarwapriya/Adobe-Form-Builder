"""Port of `backend/src/entities/AIConversation.ts`."""

from __future__ import annotations

from typing import Literal, Optional

from sqlalchemy.orm import Mapped

from app.models.base import Base, datetimeoffset_now, nvarchar, uuid_col, uuid_pk

AIConversationStatus = Literal["active", "archived"]


class AIConversation(Base):
    __tablename__ = "AIConversations"

    id: Mapped[str] = uuid_pk()
    userId: Mapped[str] = uuid_col()
    formId: Mapped[Optional[str]] = uuid_col(nullable=True)
    title: Mapped[Optional[str]] = nvarchar(200, nullable=True)
    status: Mapped[AIConversationStatus] = nvarchar(20, default="active")
    createdAt = datetimeoffset_now()
    updatedAt = datetimeoffset_now()
