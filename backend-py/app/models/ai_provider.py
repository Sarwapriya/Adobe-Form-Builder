"""An admin-managed "other" AI provider — any OpenAI-compatible chat
completions endpoint (Groq, OpenAI, Together, a self-hosted gateway, ...), used
as a fallback after FabriX. Replaces the single Groq entry that used to live in
`AdminSettings` (`groqApiKeyEnc`/`groqModel`/`groqEnabled`).

Never hard-deleted: an admin turns a provider off with `isEnabled` instead, so
the row (and its encrypted key) is kept."""

from __future__ import annotations

from sqlalchemy import Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, datetimeoffset_now, nvarchar, nvarchar_max, uuid_pk


class AiProvider(Base):
    __tablename__ = "AiProviders"

    id: Mapped[str] = uuid_pk()
    # The admin's own label ("Groq", "OpenAI - team key", ...) — the only thing
    # that tells providers apart in the UI and in the server logs.
    name: Mapped[str] = nvarchar(100)
    # Base URL up to (not including) `/chat/completions`, e.g. https://api.groq.com/openai/v1
    baseUrl: Mapped[str] = nvarchar(500)
    model: Mapped[str] = nvarchar(200)
    # Encrypted with app.security.secret_cipher — never returned to the browser.
    apiKeyEnc: Mapped[str] = nvarchar_max()
    isEnabled: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    # Fallback order among enabled providers, ascending (oldest first by default).
    sortOrder: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    createdAt = datetimeoffset_now()
