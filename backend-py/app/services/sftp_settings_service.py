"""Port of `backend/src/services/sftpSettingsService.ts`.

DB-stored connection config for the Adobe Campaign SFTP deployment target,
admin-managed via Configuration > Deployment. Mirrors
`fabrix_settings_service`'s AdminSetting-row-per-field convention, minus the
encryption — nothing stored here is a secret in itself, just a
host/username/local-file-path/remote-path.

Two independent targets ("staging"/"production") are always both stored;
`activeEnvironment` picks which one deployment actually targets.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from sqlalchemy.orm import Session

from app.services.admin_settings_service import get_admin_setting, set_admin_setting

SftpEnvironment = Literal["staging", "production"]

DEFAULT_PORT = 22
DEFAULT_REMOTE_PATH = "/incoming/ACC/Operations/HRForms/ToProcess"

# Adobe Campaign ingest endpoint baked into the published data file's
# `param.apiEndpoint` (see form_builder_service._resolve_analytics_param_updates)
# — admin-editable (Configuration > Deployment) rather than hardcoded, since
# these have already changed once in production use. Defaults match what was
# previously hardcoded, so an unconfigured install behaves exactly as before.
_DEFAULT_API_ENDPOINT = {
    "staging": "https://res5.africa2s.crm.samsung.com/ingest",
    "production": "https://res6.mena2p.crm.samsung.com/ingest",
}

# Adobe Campaign frontal-server path a consent-document PDF (Terms &
# Conditions / Privacy Policy upload — see consent_document_service.py)
# resolves at once deployed, same convention as _DEFAULT_API_ENDPOINT above:
# admin-editable, pre-filled with the real current values rather than
# hardcoded, since this host has already changed once in production use.
_DEFAULT_RESOURCE_TRACKING_BASE_URL = {
    "staging": "https://res5.africa2s.crm.samsung.com/res/tracking/",
    "production": "https://res6.mena2p.crm.samsung.com/res/tracking/",
}


@dataclass
class SftpTargetConfig:
    host: str
    port: int
    username: str
    privateKeyPath: str
    remotePath: str
    apiEndpoint: str
    resourceTrackingBaseUrl: str


@dataclass
class SftpDeploymentSettings:
    activeEnvironment: SftpEnvironment
    staging: SftpTargetConfig
    production: SftpTargetConfig


def _setting_key_prefix(environment: SftpEnvironment) -> str:
    return "sftpStaging" if environment == "staging" else "sftpProduction"


def _get_target(db: Session, environment: SftpEnvironment) -> SftpTargetConfig:
    prefix = _setting_key_prefix(environment)
    host = get_admin_setting(db, f"{prefix}Host")
    port = get_admin_setting(db, f"{prefix}Port")
    username = get_admin_setting(db, f"{prefix}Username")
    private_key_path = get_admin_setting(db, f"{prefix}PrivateKeyPath")
    remote_path = get_admin_setting(db, f"{prefix}RemotePath")
    api_endpoint = get_admin_setting(db, f"{prefix}ApiEndpoint")
    resource_tracking_base_url = get_admin_setting(db, f"{prefix}ResourceTrackingBaseUrl")
    try:
        port_num = int(port) if port else DEFAULT_PORT
    except ValueError:
        port_num = DEFAULT_PORT
    return SftpTargetConfig(
        host=host or "",
        port=port_num or DEFAULT_PORT,
        username=username or "",
        privateKeyPath=private_key_path or "",
        remotePath=remote_path or DEFAULT_REMOTE_PATH,
        apiEndpoint=api_endpoint or _DEFAULT_API_ENDPOINT[environment],
        resourceTrackingBaseUrl=resource_tracking_base_url or _DEFAULT_RESOURCE_TRACKING_BASE_URL[environment],
    )


def get_sftp_deployment_settings(db: Session) -> SftpDeploymentSettings:
    active_raw = get_admin_setting(db, "sftpActiveEnvironment")
    staging = _get_target(db, "staging")
    production = _get_target(db, "production")
    active_environment: SftpEnvironment = "production" if active_raw == "production" else "staging"
    return SftpDeploymentSettings(activeEnvironment=active_environment, staging=staging, production=production)


def save_sftp_target(db: Session, environment: SftpEnvironment, input: SftpTargetConfig) -> None:
    prefix = _setting_key_prefix(environment)
    set_admin_setting(db, f"{prefix}Host", input.host)
    set_admin_setting(db, f"{prefix}Port", str(input.port or DEFAULT_PORT))
    set_admin_setting(db, f"{prefix}Username", input.username)
    set_admin_setting(db, f"{prefix}PrivateKeyPath", input.privateKeyPath)
    set_admin_setting(db, f"{prefix}RemotePath", input.remotePath or DEFAULT_REMOTE_PATH)
    set_admin_setting(db, f"{prefix}ApiEndpoint", input.apiEndpoint or _DEFAULT_API_ENDPOINT[environment])
    set_admin_setting(
        db, f"{prefix}ResourceTrackingBaseUrl", input.resourceTrackingBaseUrl or _DEFAULT_RESOURCE_TRACKING_BASE_URL[environment]
    )


def set_active_sftp_environment(db: Session, environment: SftpEnvironment) -> None:
    set_admin_setting(db, "sftpActiveEnvironment", environment)


def get_active_sftp_target(db: Session) -> SftpTargetConfig | None:
    """The currently-active environment's config, or `None` if that
    environment's required fields (host/username/privateKeyPath) aren't all
    filled in yet. Not called from any route in this phase — ported so the
    deployment phase can use it directly."""
    settings = get_sftp_deployment_settings(db)
    target = settings.production if settings.activeEnvironment == "production" else settings.staging
    if not target.host or not target.username or not target.privateKeyPath:
        return None
    return target
