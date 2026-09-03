"""DB-stored connection config for the DKMS PII-encryption service —
admin-managed via Configuration, mirroring `smtp_settings_service.py`'s/
`sftp_settings_service.py`'s AdminSetting-row-per-field convention. DB-stored
settings (once `dkmsBaseUrl` is set) always win over the `DKMS_*` env vars in
`app/config.py`, which remain a fallback for a not-yet-configured
environment — see `dkms_client._resolve_settings`, the only reader of this
module outside the admin routes.

Nothing stored here is a secret (no API key/token — DKMS auth today is just
`baseUrl` + `taskId`), so unlike SMTP/FabriX/Groq there's no encrypted field
and the display view can return everything as-is.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.services.admin_settings_service import get_admin_setting, set_admin_setting

DEFAULT_TIMEOUT_SECONDS = 10
DEFAULT_PII_TAG_EMAIL = "email"
DEFAULT_PII_TAG_NAME = "name"


@dataclass
class DkmsSettings:
    baseUrl: str
    taskId: str
    timeoutSeconds: int
    piiTagEmail: str
    piiTagFirstName: str
    piiTagLastName: str


@dataclass
class DkmsSettingsInput:
    baseUrl: str
    taskId: str
    timeoutSeconds: Optional[int] = None
    piiTagEmail: Optional[str] = None
    piiTagFirstName: Optional[str] = None
    piiTagLastName: Optional[str] = None


def get_dkms_settings(db: Session) -> Optional[DkmsSettings]:
    """Reads every `dkms*` AdminSetting row and assembles them into one
    config — returns the `DKMS_*` env-var config instead if `dkmsBaseUrl`
    isn't set in the DB yet, or `None` if neither is configured."""
    base_url = get_admin_setting(db, "dkmsBaseUrl")
    if not base_url:
        from app.config import settings

        if not settings.DKMS_BASE_URL:
            return None
        return DkmsSettings(
            baseUrl=settings.DKMS_BASE_URL,
            taskId=settings.DKMS_TASK_ID or "",
            timeoutSeconds=settings.DKMS_TIMEOUT_SECONDS,
            piiTagEmail=settings.DKMS_PII_TAG_EMAIL,
            piiTagFirstName=settings.DKMS_PII_TAG_FIRST_NAME,
            piiTagLastName=settings.DKMS_PII_TAG_LAST_NAME,
        )

    task_id = get_admin_setting(db, "dkmsTaskId") or ""
    timeout_raw = get_admin_setting(db, "dkmsTimeoutSeconds")
    return DkmsSettings(
        baseUrl=base_url,
        taskId=task_id,
        timeoutSeconds=int(timeout_raw) if timeout_raw and timeout_raw.isdigit() else DEFAULT_TIMEOUT_SECONDS,
        piiTagEmail=get_admin_setting(db, "dkmsPiiTagEmail") or DEFAULT_PII_TAG_EMAIL,
        piiTagFirstName=get_admin_setting(db, "dkmsPiiTagFirstName") or DEFAULT_PII_TAG_NAME,
        piiTagLastName=get_admin_setting(db, "dkmsPiiTagLastName") or DEFAULT_PII_TAG_NAME,
    )


def get_dkms_settings_for_display(db: Session) -> dict:
    resolved = get_dkms_settings(db)
    if resolved is None:
        return {
            "baseUrl": "",
            "taskId": "",
            "timeoutSeconds": DEFAULT_TIMEOUT_SECONDS,
            "piiTagEmail": DEFAULT_PII_TAG_EMAIL,
            "piiTagFirstName": DEFAULT_PII_TAG_NAME,
            "piiTagLastName": DEFAULT_PII_TAG_NAME,
            "configured": False,
        }
    return {
        "baseUrl": resolved.baseUrl,
        "taskId": resolved.taskId,
        "timeoutSeconds": resolved.timeoutSeconds,
        "piiTagEmail": resolved.piiTagEmail,
        "piiTagFirstName": resolved.piiTagFirstName,
        "piiTagLastName": resolved.piiTagLastName,
        "configured": True,
    }


def save_dkms_settings(db: Session, input: DkmsSettingsInput) -> None:
    set_admin_setting(db, "dkmsBaseUrl", input.baseUrl)
    set_admin_setting(db, "dkmsTaskId", input.taskId)
    if input.timeoutSeconds is not None:
        set_admin_setting(db, "dkmsTimeoutSeconds", str(input.timeoutSeconds))
    if input.piiTagEmail:
        set_admin_setting(db, "dkmsPiiTagEmail", input.piiTagEmail)
    if input.piiTagFirstName:
        set_admin_setting(db, "dkmsPiiTagFirstName", input.piiTagFirstName)
    if input.piiTagLastName:
        set_admin_setting(db, "dkmsPiiTagLastName", input.piiTagLastName)
