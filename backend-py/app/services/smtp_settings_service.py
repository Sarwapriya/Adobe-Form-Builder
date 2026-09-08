"""Port of `backend/src/services/smtpSettingsService.ts`."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.security.secret_cipher import decrypt_secret, encrypt_secret
from app.services.admin_settings_service import get_admin_setting, set_admin_setting


@dataclass
class SmtpSettings:
    host: str
    port: int
    secure: bool
    user: Optional[str]
    password: Optional[str]
    from_: Optional[str]


@dataclass
class SmtpSettingsInput:
    host: str
    port: int
    secure: bool
    user: Optional[str]
    # `None`/omitted means "keep whatever password is already stored" — the
    # admin UI never has the real password to send back, only whether one
    # exists (see `get_smtp_settings_for_display`).
    password: Optional[str]
    from_: Optional[str]


def get_smtp_settings(db: Session) -> Optional[SmtpSettings]:
    """Reads every smtp* AdminSetting row and assembles them into one
    config — returns `None` if nothing has been configured in the DB yet
    (smtpHost unset), so callers can fall back to the env-var-only config
    that predates this feature."""
    host = get_admin_setting(db, "smtpHost")
    if not host:
        return None

    port_raw = get_admin_setting(db, "smtpPort")
    secure_raw = get_admin_setting(db, "smtpSecure")
    user = get_admin_setting(db, "smtpUser")
    password_enc = get_admin_setting(db, "smtpPasswordEnc")
    from_ = get_admin_setting(db, "smtpFrom")

    return SmtpSettings(
        host=host,
        port=int(port_raw) if port_raw and port_raw.isdigit() else 587,
        secure=secure_raw == "true",
        user=user,
        password=decrypt_secret(password_enc) if password_enc else None,
        from_=from_,
    )


def get_smtp_settings_for_display(db: Session) -> dict:
    """Admin-UI-safe view of the current settings — the real password is
    never sent to the browser, only whether one is set."""
    settings = get_smtp_settings(db)
    if settings is None:
        return {"host": "", "port": 587, "secure": False, "user": None, "from": None, "hasPassword": False}
    return {
        "host": settings.host,
        "port": settings.port,
        "secure": settings.secure,
        "user": settings.user,
        "from": settings.from_,
        "hasPassword": bool(settings.password),
    }


def save_smtp_settings(db: Session, input: SmtpSettingsInput) -> None:
    set_admin_setting(db, "smtpHost", input.host)
    set_admin_setting(db, "smtpPort", str(input.port))
    set_admin_setting(db, "smtpSecure", "true" if input.secure else "false")
    set_admin_setting(db, "smtpUser", input.user)
    set_admin_setting(db, "smtpFrom", input.from_)
    if input.password and input.password.strip():
        set_admin_setting(db, "smtpPasswordEnc", encrypt_secret(input.password.strip()))
