"""Port of `backend/src/services/claudeSettingsService.ts`.

DB-stored connection config for the Anthropic Claude Messages API,
admin-managed via Configuration > AI Assistant — the automatic fallback
provider used only when FabriX can't be reached. Simpler surface than
FabriX's: one API key, one model string, no separate headers/model-array.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.config import settings as env_settings
from app.security.secret_cipher import decrypt_secret, encrypt_secret
from app.services.admin_settings_service import get_admin_setting, set_admin_setting

DEFAULT_MODEL = "claude-opus-5"


@dataclass
class ClaudeSettings:
    apiKey: str
    model: str
    enabled: bool


@dataclass
class ClaudeSettingsInput:
    model: str
    apiKey: Optional[str] = None
    enabled: Optional[bool] = None


def get_claude_settings(db: Session) -> Optional[ClaudeSettings]:
    """Falls back to ANTHROPIC_API_KEY/CLAUDE_MODEL/CLAUDE_ENABLED env vars
    for whichever piece isn't set in the DB. Returns `None` only if there's
    no usable API key at all."""
    api_key_enc = get_admin_setting(db, "claudeApiKeyEnc")
    db_model = get_admin_setting(db, "claudeModel")
    enabled_raw = get_admin_setting(db, "claudeEnabled")

    api_key = (decrypt_secret(api_key_enc) if api_key_enc else (env_settings.ANTHROPIC_API_KEY or "")).strip()
    if not api_key:
        return None

    model = db_model or env_settings.CLAUDE_MODEL or DEFAULT_MODEL
    enabled = (enabled_raw == "true") if enabled_raw is not None else env_settings.CLAUDE_ENABLED

    return ClaudeSettings(apiKey=api_key, model=model, enabled=enabled)


def get_claude_settings_for_display(db: Session) -> dict:
    """Admin-UI-safe view — the API key is never sent to the browser, only
    whether one is set."""
    settings = get_claude_settings(db)
    if settings is None:
        model = get_admin_setting(db, "claudeModel") or env_settings.CLAUDE_MODEL or DEFAULT_MODEL
        return {"model": model, "enabled": False, "hasApiKey": False}
    return {"model": settings.model, "enabled": settings.enabled, "hasApiKey": True}


def save_claude_settings(db: Session, input: ClaudeSettingsInput) -> None:
    set_admin_setting(db, "claudeModel", input.model)
    set_admin_setting(db, "claudeEnabled", None if input.enabled is None else ("true" if input.enabled else "false"))
    if input.apiKey and input.apiKey.strip():
        set_admin_setting(db, "claudeApiKeyEnc", encrypt_secret(input.apiKey.strip()))
