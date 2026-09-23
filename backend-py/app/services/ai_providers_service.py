"""Admin-managed "other" AI providers (Configuration > AI Assistant > Other AI
Providers) — any number of OpenAI-compatible chat-completions endpoints, each
with its own admin-chosen name, tried in order as fallbacks after FabriX (see
`aiProviderService.send_message`).

A provider is never deleted: `isEnabled` is the whole on/off control, so the row
and its (encrypted) key are kept. The API key never leaves the server — the
admin UI only learns that one is set.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional
from urllib.parse import urlparse

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings as env_settings
from app.errors import ValidationError
from app.models.ai_provider import AiProvider
from app.security.secret_cipher import decrypt_secret, encrypt_secret

DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b"
DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o"
_CHAT_SUFFIX = "/chat/completions"


@dataclass
class ProviderConfig:
    """Everything `openaiCompatAIService.send_message` needs to call one provider."""

    id: Optional[str]
    name: str
    baseUrl: str
    model: str
    apiKey: str


def normalize_base_url(raw: str) -> str:
    """Accepts a base URL with or without a trailing slash or a pasted
    `/chat/completions`, and returns it without either. Raises
    `ValidationError` for anything that isn't an http(s) URL."""
    url = (raw or "").strip().rstrip("/")
    if url.lower().endswith(_CHAT_SUFFIX):
        url = url[: -len(_CHAT_SUFFIX)].rstrip("/")
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValidationError("Base URL must start with http:// or https://")
    return url


def chat_completions_url(provider: ProviderConfig) -> str:
    return provider.baseUrl.rstrip("/") + _CHAT_SUFFIX


def list_ai_providers(db: Session) -> list[AiProvider]:
    """Every provider, enabled and disabled alike, in fallback order — the
    admin management view."""
    return list(db.execute(select(AiProvider).order_by(AiProvider.sortOrder.asc(), AiProvider.createdAt.asc())).scalars().all())


def get_ai_provider(db: Session, id: str) -> Optional[AiProvider]:
    return db.get(AiProvider, id)


def _env_fallback_provider_configs() -> list[ProviderConfig]:
    configs: list[ProviderConfig] = []

    openrouter_key = (env_settings.OPENROUTER_API_KEY or "").strip()
    if openrouter_key and env_settings.OPENROUTER_ENABLED:
        configs.append(
            ProviderConfig(
                id=None,
                name="OpenRouter",
                baseUrl=DEFAULT_OPENROUTER_BASE_URL,
                model=env_settings.OPENROUTER_MODEL or DEFAULT_OPENROUTER_MODEL,
                apiKey=openrouter_key,
            )
        )

    groq_key = (env_settings.GROQ_API_KEY or "").strip()
    if groq_key and env_settings.GROQ_ENABLED:
        configs.append(
            ProviderConfig(
                id=None,
                name="Groq",
                baseUrl=DEFAULT_GROQ_BASE_URL,
                model=env_settings.GROQ_MODEL or DEFAULT_GROQ_MODEL,
                apiKey=groq_key,
            )
        )

    return configs


def list_enabled_provider_configs(db: Session) -> list[ProviderConfig]:
    """The enabled providers that have a usable key, in fallback order. If none
    have ever been added in the DB, falls back to whichever of the legacy
    `OPENROUTER_*`/`GROQ_*` environment variables are configured (so a
    deployment that was only ever configured through env keeps working) —
    OpenRouter first when both are set, since it isn't a hidden-reasoning
    model the way Groq's default is."""
    rows = list_ai_providers(db)
    if not rows:
        return _env_fallback_provider_configs()

    configs: list[ProviderConfig] = []
    for row in rows:
        if not row.isEnabled:
            continue
        api_key = decrypt_secret(row.apiKeyEnc).strip() if row.apiKeyEnc else ""
        if not api_key:
            continue
        configs.append(ProviderConfig(id=row.id, name=row.name, baseUrl=row.baseUrl, model=row.model, apiKey=api_key))
    return configs


def config_for_provider(row: AiProvider) -> Optional[ProviderConfig]:
    """A provider's config regardless of `isEnabled` (used by "Send test
    message", which should work on a disabled provider too). `None` if it has no
    usable key."""
    api_key = decrypt_secret(row.apiKeyEnc).strip() if row.apiKeyEnc else ""
    if not api_key:
        return None
    return ProviderConfig(id=row.id, name=row.name, baseUrl=row.baseUrl, model=row.model, apiKey=api_key)


def serialize_ai_provider(row: AiProvider) -> dict[str, Any]:
    """Admin-UI-safe view — the API key is never sent to the browser."""
    return {
        "id": row.id,
        "name": row.name,
        "baseUrl": row.baseUrl,
        "model": row.model,
        "isEnabled": row.isEnabled,
        "hasApiKey": bool(row.apiKeyEnc),
        "sortOrder": row.sortOrder,
        "createdAt": row.createdAt,
    }


def _require_text(value: Optional[str], label: str) -> str:
    trimmed = (value or "").strip()
    if not trimmed:
        raise ValidationError(f"{label} is required")
    return trimmed


def create_ai_provider(db: Session, name: str, base_url: str, model: str, api_key: str, is_enabled: bool = True) -> AiProvider:
    """New providers are tried after every existing one (max sortOrder + 1)."""
    max_order = db.execute(select(func.max(AiProvider.sortOrder))).scalar_one_or_none()
    created = AiProvider(
        name=_require_text(name, "Provider name"),
        baseUrl=normalize_base_url(base_url),
        model=_require_text(model, "Model"),
        apiKeyEnc=encrypt_secret(_require_text(api_key, "API key")),
        isEnabled=is_enabled,
        sortOrder=(max_order if max_order is not None else -1) + 1,
    )
    db.add(created)
    db.commit()
    db.refresh(created)
    return created


def update_ai_provider(db: Session, id: str, changes: dict[str, Any]) -> Optional[AiProvider]:
    """Partial update by key presence. A blank/absent `apiKey` keeps the stored
    key. Returns `None` if the id doesn't exist."""
    existing = db.get(AiProvider, id)
    if existing is None:
        return None

    if changes.get("name") is not None:
        existing.name = _require_text(changes["name"], "Provider name")
    if changes.get("baseUrl") is not None:
        existing.baseUrl = normalize_base_url(changes["baseUrl"])
    if changes.get("model") is not None:
        existing.model = _require_text(changes["model"], "Model")
    if changes.get("isEnabled") is not None:
        existing.isEnabled = bool(changes["isEnabled"])
    api_key = (changes.get("apiKey") or "").strip()
    if api_key:
        existing.apiKeyEnc = encrypt_secret(api_key)
    db.add(existing)
    db.commit()
    db.refresh(existing)
    return existing
