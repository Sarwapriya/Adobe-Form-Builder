"""Port of `backend/src/services/fabrixSettingsService.ts`.

DB-stored connection config for the FabriX OpenAPI chat endpoint, admin-
managed via Configuration > AI Assistant. Mirrors `smtp_settings_service`'s
shape (same AdminSetting-row-per-field convention, same "DB settings win, env
vars are the fallback" precedence).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.config import settings as env_settings
from app.security.secret_cipher import decrypt_secret, encrypt_secret
from app.services.admin_settings_service import get_admin_setting, set_admin_setting
from app.services.fabrix_models_service import list_enabled_model_ids

DEFAULT_TIMEOUT_SECONDS = 30
DEFAULT_MAX_RETRIES = 2


@dataclass
class FabrixSettings:
    baseUrl: str
    modelIds: list[str]
    enabled: bool
    timeoutSeconds: int
    maxRetries: int
    clientHeader: str
    openApiToken: str
    userEmail: str


@dataclass
class FabrixSettingsInput:
    baseUrl: str
    clientHeader: Optional[str] = None
    openApiToken: Optional[str] = None
    userEmail: Optional[str] = None
    enabled: Optional[bool] = None


def get_fabrix_settings(db: Session) -> Optional[FabrixSettings]:
    """Reads every fabrix* AdminSetting row plus the FabrixModels table and
    assembles them into one config — falls back to the FABRIX_* env vars for
    whichever piece isn't set in the DB. Returns `None` if baseUrl is
    missing, or if there isn't at least one enabled model."""
    db_base_url = get_admin_setting(db, "fabrixApiBaseUrl")
    enabled_raw = get_admin_setting(db, "fabrixEnabled")
    timeout_raw = get_admin_setting(db, "fabrixTimeoutSeconds")
    retries_raw = get_admin_setting(db, "fabrixMaxRetries")
    client_header_enc = get_admin_setting(db, "fabrixClientHeaderEnc")
    open_api_token_enc = get_admin_setting(db, "fabrixOpenApiTokenEnc")
    db_user_email = get_admin_setting(db, "fabrixUserEmail")
    table_model_ids = list_enabled_model_ids(db)

    base_url = db_base_url or env_settings.FABRIX_API_BASE_URL or ""
    env_model_id = (env_settings.FABRIX_MODEL_ID or "").strip()
    model_ids = table_model_ids if table_model_ids else ([env_model_id] if env_model_id else [])
    if not base_url or not model_ids:
        return None

    client_header = (decrypt_secret(client_header_enc) if client_header_enc else (env_settings.FABRIX_CLIENT_HEADER or "")).strip()
    open_api_token = (decrypt_secret(open_api_token_enc) if open_api_token_enc else (env_settings.FABRIX_OPENAPI_TOKEN or "")).strip()
    user_email = (db_user_email or env_settings.FABRIX_USER_EMAIL or "").strip()
    enabled = (enabled_raw == "true") if enabled_raw is not None else env_settings.FABRIX_ENABLED
    try:
        timeout_seconds = int(timeout_raw) if timeout_raw else (env_settings.FABRIX_TIMEOUT_SECONDS or DEFAULT_TIMEOUT_SECONDS)
    except ValueError:
        timeout_seconds = DEFAULT_TIMEOUT_SECONDS
    try:
        max_retries = int(retries_raw) if retries_raw else (env_settings.FABRIX_MAX_RETRIES or DEFAULT_MAX_RETRIES)
    except ValueError:
        max_retries = DEFAULT_MAX_RETRIES

    return FabrixSettings(
        baseUrl=base_url,
        modelIds=model_ids,
        enabled=enabled,
        # Not `timeout_seconds or DEFAULT_...` — an explicit 0 for maxRetries
        # ("don't retry, fail fast") is falsy in Python, and the ternaries
        # above already applied the real fallback chain, so a bare `or`
        # here would silently discard a deliberate 0 back to the default.
        timeoutSeconds=timeout_seconds,
        maxRetries=max_retries,
        clientHeader=client_header,
        openApiToken=open_api_token,
        userEmail=user_email,
    )


def get_fabrix_settings_for_display(db: Session) -> dict:
    """Admin-UI-safe view of the current settings — the two secrets
    (client header, openapi token) are never sent to the browser, only
    whether one is set."""
    settings = get_fabrix_settings(db)
    if settings is None:
        enabled_model_count = len(list_enabled_model_ids(db))
        return {
            "baseUrl": "",
            "enabled": False,
            "userEmail": "",
            "hasClientHeader": False,
            "hasOpenApiToken": False,
            "enabledModelCount": enabled_model_count,
        }
    return {
        "baseUrl": settings.baseUrl,
        "enabled": settings.enabled,
        "userEmail": settings.userEmail,
        "hasClientHeader": bool(settings.clientHeader),
        "hasOpenApiToken": bool(settings.openApiToken),
        "enabledModelCount": len(settings.modelIds),
    }


def save_fabrix_settings(db: Session, input: FabrixSettingsInput) -> None:
    set_admin_setting(db, "fabrixApiBaseUrl", input.baseUrl)
    set_admin_setting(db, "fabrixUserEmail", input.userEmail if input.userEmail is not None else "")
    set_admin_setting(
        db, "fabrixEnabled", None if input.enabled is None else ("true" if input.enabled else "false")
    )
    if input.clientHeader and input.clientHeader.strip():
        set_admin_setting(db, "fabrixClientHeaderEnc", encrypt_secret(input.clientHeader.strip()))
    if input.openApiToken and input.openApiToken.strip():
        set_admin_setting(db, "fabrixOpenApiTokenEnc", encrypt_secret(input.openApiToken.strip()))
