"""DB-stored connection config for Groq's OpenAI-compatible chat completions
API, admin-managed via Configuration > AI Assistant — a second automatic
fallback provider, tried after FabriX and Claude (see
`aiProviderService.send_message`). Mirrors `claude_settings_service.py`'s
shape exactly (one API key, one model string, DB-settings-win-over-env-vars
precedence).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.config import settings as env_settings
from app.security.secret_cipher import decrypt_secret, encrypt_secret
from app.services.admin_settings_service import get_admin_setting, set_admin_setting

DEFAULT_MODEL = "openai/gpt-oss-120b"


@dataclass
class GroqSettings:
    apiKey: str
    model: str
    enabled: bool


@dataclass
class GroqSettingsInput:
    model: str
    apiKey: Optional[str] = None
    enabled: Optional[bool] = None


def get_groq_settings(db: Session) -> Optional[GroqSettings]:
    """Falls back to GROQ_API_KEY/GROQ_MODEL/GROQ_ENABLED env vars for
    whichever piece isn't set in the DB. Returns `None` only if there's no
    usable API key at all."""
    api_key_enc = get_admin_setting(db, "groqApiKeyEnc")
    db_model = get_admin_setting(db, "groqModel")
    enabled_raw = get_admin_setting(db, "groqEnabled")

    api_key = (decrypt_secret(api_key_enc) if api_key_enc else (env_settings.GROQ_API_KEY or "")).strip()
    if not api_key:
        return None

    model = db_model or env_settings.GROQ_MODEL or DEFAULT_MODEL
    enabled = (enabled_raw == "true") if enabled_raw is not None else env_settings.GROQ_ENABLED

    return GroqSettings(apiKey=api_key, model=model, enabled=enabled)


def get_groq_settings_for_display(db: Session) -> dict:
    """Admin-UI-safe view — the API key is never sent to the browser, only
    whether one is set."""
    settings = get_groq_settings(db)
    if settings is None:
        model = get_admin_setting(db, "groqModel") or env_settings.GROQ_MODEL or DEFAULT_MODEL
        return {"model": model, "enabled": False, "hasApiKey": False}
    return {"model": settings.model, "enabled": settings.enabled, "hasApiKey": True}


def save_groq_settings(db: Session, input: GroqSettingsInput) -> None:
    set_admin_setting(db, "groqModel", input.model)
    set_admin_setting(db, "groqEnabled", None if input.enabled is None else ("true" if input.enabled else "false"))
    if input.apiKey and input.apiKey.strip():
        set_admin_setting(db, "groqApiKeyEnc", encrypt_secret(input.apiKey.strip()))
