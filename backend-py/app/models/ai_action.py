"""Port of `backend/src/entities/AIAction.ts`.

`actionType` was typed as the shared package's `AIToolName` union in TS
(`@formbuilder/shared`); ported here as a plain `str` (nvarchar(50)) since
that shared TS-only type isn't available on the Python side in this phase —
TODO(phase N): tighten to a `Literal[...]` once the AI-assistant tool schema
is ported.
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, datetimeoffset_now, nvarchar, nvarchar_max, uuid_col, uuid_pk


class AIAction(Base):
    __tablename__ = "AIActions"

    id: Mapped[str] = uuid_pk()
    conversationId: Mapped[str] = uuid_col()
    formId: Mapped[Optional[str]] = uuid_col(nullable=True)
    userId: Mapped[str] = uuid_col()
    actionType: Mapped[str] = nvarchar(50)
    requestJson: Mapped[str] = nvarchar_max()
    responseJson: Mapped[Optional[str]] = nvarchar_max(nullable=True)
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    executed: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    executionResult: Mapped[Optional[str]] = nvarchar_max(nullable=True)
    createdAt = datetimeoffset_now()
