"""A validated form draft proposed by the AI chatbot (`fq.AIFormProposals`).

Rows are immutable once written: every change the user asks for produces a
new row (a new `version` in the same conversation), so what the user approved
can never be edited afterwards. Saving requires an approval token that only
the UI obtains, through an explicit "Approve & Save" click, and that is bound
to this exact row's `contentHash` — see app/services/ai_proposal_service.py.
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import (
    Base,
    datetimeoffset_now,
    datetimeoffset_nullable,
    nvarchar,
    nvarchar_max,
    uuid_col,
    uuid_pk,
)


class AIFormProposal(Base):
    __tablename__ = "AIFormProposals"

    id: Mapped[str] = uuid_pk()
    conversationId: Mapped[str] = uuid_col()
    userId: Mapped[str] = uuid_col()
    # The subsidiary the draft will be created in — resolved from the session
    # for standard users, validated for admins. Never an unchecked LLM value.
    subsidiaryId: Mapped[str] = nvarchar(50)
    version: Mapped[int] = mapped_column(Integer)
    # Canonical JSON of the validated proposal (see ai_proposal_service.canonical_json).
    proposalJson: Mapped[str] = nvarchar_max()
    contentHash: Mapped[str] = nvarchar(64)
    # sha256 of the one-time approval token — the raw token is never stored.
    approvalTokenHash: Mapped[Optional[str]] = nvarchar(64, nullable=True)
    approvalExpiresAt: Mapped[Optional[object]] = datetimeoffset_nullable()
    approvedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
    consumedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
    savedFormId: Mapped[Optional[str]] = uuid_col(nullable=True)
    createdAt = datetimeoffset_now()
