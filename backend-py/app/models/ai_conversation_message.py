"""Port of `backend/src/entities/AIConversationMessage.ts`."""

from __future__ import annotations

from typing import Literal, Optional

from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, datetimeoffset_now, nvarchar, nvarchar_max, uuid_col, uuid_pk

AIMessageRole = Literal["user", "assistant", "system", "tool"]


class AIConversationMessage(Base):
    __tablename__ = "AIConversationMessages"

    id: Mapped[str] = uuid_pk()
    conversationId: Mapped[str] = uuid_col()
    role: Mapped[AIMessageRole] = nvarchar(20)
    message: Mapped[str] = nvarchar_max()
    tokenUsage: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    model: Mapped[Optional[str]] = nvarchar(100, nullable=True)
    requestId: Mapped[Optional[str]] = nvarchar(100, nullable=True)
    createdAt = datetimeoffset_now()
