"""Port of `backend/src/routes/admin.router.ts` — every route here requires
`require_admin` (both `"admin"` and `"superadmin"`), same as
`adminRouter.use(requireAdmin)`.

Route groups ported: project codes, subsidiaries, subsidiary-project blocks,
subsidiary locales, users, SMTP/FabriX/Groq settings, SFTP deployment
settings, QA runs, dashboard-summary, and Question Master.

FabriX and Groq are the two AI-assistant provider tiers, each independently
enable/disable-toggleable (see `fabrix_settings_service.py`/
`groq_settings_service.py`) — FabriX always gets first priority when both are
enabled (see `aiProviderService.py`). There is no third "Claude/Anthropic"
tier — an earlier version of this port had one, but it was never actually
configured with real Anthropic credentials in practice and has been removed.

Mounted at `/api/v1/admin` (see `app/main.py`).
"""

from __future__ import annotations

import re
from typing import Annotated, Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, BeforeValidator, EmailStr, Field, field_validator, model_validator
from sqlalchemy.orm import Session

from app.db import get_db
from app.form_pipeline import ValidationResult
from app.models.qa_run import QaRunVariant
from app.security import dkms_client
from app.security.deps import require_admin
from app.services import (
    auth_service,
    dashboard_service,
    dkms_settings_service,
    email_service,
    fabrix_models_service,
    fabrix_settings_service,
    groq_settings_service,
    project_code_service,
    qa_run_service,
    question_master_service,
    sftp_settings_service,
    smtp_settings_service,
    subsidiary_locale_service,
    subsidiary_project_block_service,
    subsidiary_service,
)
from app.services.dkms_settings_service import DkmsSettingsInput
from app.services.fabrix_models_service import CreateFabrixModelInput
from app.services.fabrix_settings_service import FabrixSettingsInput
from app.services.fabrixAIService import send_message as send_fabrix_message
from app.services.groq_settings_service import GroqSettingsInput
from app.services.groqAIService import send_message as send_groq_message
from app.services.sftp_settings_service import SftpTargetConfig
from app.services.smtp_settings_service import SmtpSettingsInput
from app.services.subsidiary_locale_service import CreateSubsidiaryLocaleInput

router = APIRouter(dependencies=[Depends(require_admin)])


def _empty_to_none(v: Any) -> Any:
    return None if v == "" else v


OptionalEmail = Annotated[Optional[EmailStr], BeforeValidator(_empty_to_none)]
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _validate_date_string(v: Optional[str]) -> Optional[str]:
    if v is not None and not DATE_RE.match(v):
        raise ValueError("Expected an ISO date string (YYYY-MM-DD)")
    return v


# --- Serialization helpers (ORM row -> plain JSON-able dict) ----------------


def _serialize_project_code(pc) -> dict:
    return {
        "id": pc.id,
        "code": pc.code,
        "isOpen": pc.isOpen,
        "isLocked": pc.isLocked,
        "startDate": pc.startDate.isoformat() if pc.startDate else None,
        "endDate": pc.endDate.isoformat() if pc.endDate else None,
        "cutoffDate": pc.cutoffDate.isoformat() if pc.cutoffDate else None,
        "createdAt": pc.createdAt,
    }


def _serialize_subsidiary(s) -> dict:
    return {
        "id": s.id,
        "name": s.name,
        "isActive": s.isActive,
        "notificationEmail1": s.notificationEmail1,
        "notificationEmail2": s.notificationEmail2,
        "createdAt": s.createdAt,
    }


def _serialize_block(b) -> dict:
    return {"id": b.id, "subsidiaryName": b.subsidiaryName, "projectCode": b.projectCode, "createdAt": b.createdAt}


def _serialize_locale(loc) -> dict:
    return {
        "id": loc.id,
        "subsidiaryName": loc.subsidiaryName,
        "code": loc.code,
        "langSubtag": loc.langSubtag,
        "isRtl": loc.isRtl,
        "label": loc.label,
        "isFallback": loc.isFallback,
        "sortOrder": loc.sortOrder,
        "createdAt": loc.createdAt,
    }


def _serialize_user_full(u) -> dict:
    # email/firstName/lastName are DKMS ciphertext at rest — decrypted only
    # here, for the admin-facing response that actually needs to display
    # them. `decrypt_or_none` degrades a single field to `null` on a DKMS
    # failure rather than failing the whole list/response (see its own
    # doc comment) — notificationEmail/notificationEmail2 are untouched,
    # separate columns this feature doesn't encrypt.
    return {
        "id": u.id,
        "username": u.username,
        "email": dkms_client.decrypt_or_none(u.email),
        "firstName": dkms_client.decrypt_or_none(u.firstName),
        "lastName": dkms_client.decrypt_or_none(u.lastName),
        "role": u.role,
        "subsidiaryId": u.subsidiaryId,
        "isActive": u.isActive,
        "notificationEmail": u.notificationEmail,
        "notificationEmail2": u.notificationEmail2,
        "createdAt": u.createdAt,
    }


def _serialize_fabrix_model(m) -> dict:
    return {"id": m.id, "name": m.name, "modelId": m.modelId, "isEnabled": m.isEnabled, "sortOrder": m.sortOrder, "createdAt": m.createdAt}


def _serialize_question_master_version(v) -> dict:
    return {
        "id": v.id,
        "projectCode": v.projectCode,
        "version": v.version,
        "division": v.division,
        "subsidiaryCount": v.subsidiaryCount,
        "totalRows": v.totalRows,
        "generatedByUserId": v.generatedByUserId,
        "generatedAt": v.generatedAt,
        "source": v.source,
    }


def _serialize_sftp_settings(s: sftp_settings_service.SftpDeploymentSettings) -> dict:
    def target(t: SftpTargetConfig) -> dict:
        return {
            "host": t.host,
            "port": t.port,
            "username": t.username,
            "privateKeyPath": t.privateKeyPath,
            "remotePath": t.remotePath,
        }

    return {"activeEnvironment": s.activeEnvironment, "staging": target(s.staging), "production": target(s.production)}


# --- Project codes -----------------------------------------------------------


@router.get("/project-codes")
def list_project_codes(db: Session = Depends(get_db)) -> list[dict]:
    codes = project_code_service.list_project_codes(db)
    return [_serialize_project_code(c) for c in codes]


class CreateProjectCodeBody(BaseModel):
    code: str = Field(min_length=1)
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    cutoffDate: Optional[str] = None

    _validate_dates = field_validator("startDate", "endDate", "cutoffDate")(_validate_date_string)

    @field_validator("code")
    @classmethod
    def _trim_code(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("code must not be empty")
        return v


@router.post("/project-codes", status_code=status.HTTP_201_CREATED)
def create_project_code(body: CreateProjectCodeBody, db: Session = Depends(get_db)) -> dict:
    created = project_code_service.create_project_code(
        db, body.code, start_date=body.startDate, end_date=body.endDate, cutoff_date=body.cutoffDate
    )
    return _serialize_project_code(created)


class UpdateProjectCodeBody(BaseModel):
    code: Optional[str] = None
    isOpen: Optional[bool] = None
    isLocked: Optional[bool] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    cutoffDate: Optional[str] = None

    _validate_dates = field_validator("startDate", "endDate", "cutoffDate")(_validate_date_string)

    @field_validator("code")
    @classmethod
    def _trim_code(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("code must not be empty")
        return v


# Closing a project code blocks new uploads/forms against it; locking it is a
# separate, more permanent freeze that only blocks non-admin activity — see
# `project_code_service`'s own doc comments. Every field here is applied
# independently — any of them can be sent alone or together.
@router.patch("/project-codes/{id}")
def update_project_code(id: str, body: UpdateProjectCodeBody, db: Session = Depends(get_db)) -> dict:
    data = body.model_dump(exclude_unset=True)

    updated = None
    if "code" in data:
        updated = project_code_service.set_project_code_value(db, id, data["code"])
    if "isOpen" in data:
        updated = project_code_service.set_project_code_open(db, id, data["isOpen"])
    if "isLocked" in data:
        updated = project_code_service.set_project_code_locked(db, id, data["isLocked"])
    date_range_keys = {"startDate", "endDate", "cutoffDate"}
    if date_range_keys & data.keys():
        updated = project_code_service.set_project_code_date_range(
            db, id, {k: data[k] for k in date_range_keys if k in data}
        )
    if updated is None:
        raise HTTPException(status_code=404, detail="project code not found")
    return _serialize_project_code(updated)


# --- Subsidiaries -------------------------------------------------------------


@router.get("/subsidiaries")
def list_subsidiaries(db: Session = Depends(get_db)) -> list[dict]:
    return [_serialize_subsidiary(s) for s in subsidiary_service.list_subsidiaries(db)]


class CreateSubsidiaryBody(BaseModel):
    name: str = Field(min_length=1)

    @field_validator("name")
    @classmethod
    def _trim_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must not be empty")
        return v


@router.post("/subsidiaries", status_code=status.HTTP_201_CREATED)
def create_subsidiary(body: CreateSubsidiaryBody, db: Session = Depends(get_db)) -> dict:
    created = subsidiary_service.create_subsidiary(db, body.name)
    return _serialize_subsidiary(created)


class UpdateSubsidiaryBody(BaseModel):
    isActive: Optional[bool] = None
    notificationEmail1: OptionalEmail = None
    notificationEmail2: OptionalEmail = None


@router.patch("/subsidiaries/{id}")
def update_subsidiary(id: str, body: UpdateSubsidiaryBody, db: Session = Depends(get_db)) -> dict:
    data = body.model_dump(exclude_unset=True)

    updated = None
    if "isActive" in data:
        updated = subsidiary_service.set_subsidiary_active(db, id, data["isActive"])
    email_keys = {"notificationEmail1", "notificationEmail2"}
    if email_keys & data.keys():
        updated = subsidiary_service.set_subsidiary_notification_emails(
            db, id, {k: data[k] for k in email_keys if k in data}
        )
    if updated is None:
        raise HTTPException(status_code=404, detail="subsidiary not found")
    return _serialize_subsidiary(updated)


@router.delete("/subsidiaries/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subsidiary(id: str, db: Session = Depends(get_db)) -> None:
    deleted = subsidiary_service.delete_subsidiary(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="subsidiary not found")


# --- Subsidiary-project blocks -----------------------------------------------


@router.get("/subsidiary-project-blocks")
def list_subsidiary_project_blocks(db: Session = Depends(get_db)) -> list[dict]:
    return [_serialize_block(b) for b in subsidiary_project_block_service.list_subsidiary_project_blocks(db)]


class CreateSubsidiaryProjectBlockBody(BaseModel):
    subsidiaryName: str = Field(min_length=1)
    projectCode: str = Field(min_length=1)

    @field_validator("subsidiaryName", "projectCode")
    @classmethod
    def _trim(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be empty")
        return v


@router.post("/subsidiary-project-blocks", status_code=status.HTTP_201_CREATED)
def create_subsidiary_project_block(body: CreateSubsidiaryProjectBlockBody, db: Session = Depends(get_db)) -> dict:
    created = subsidiary_project_block_service.create_subsidiary_project_block(
        db, body.subsidiaryName, body.projectCode
    )
    return _serialize_block(created)


@router.delete("/subsidiary-project-blocks/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subsidiary_project_block(id: str, db: Session = Depends(get_db)) -> None:
    deleted = subsidiary_project_block_service.delete_subsidiary_project_block(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="block not found")


# --- Subsidiary locales -------------------------------------------------------


@router.get("/subsidiary-locales")
def list_all_subsidiary_locales(db: Session = Depends(get_db)) -> list[dict]:
    return [_serialize_locale(loc) for loc in subsidiary_locale_service.list_all_subsidiary_locales(db)]


LOCALE_CODE_RE = re.compile(r"^[a-zA-Z]{2,3}_[A-Z]{2}$")


class CreateSubsidiaryLocaleBody(BaseModel):
    subsidiaryName: str = Field(min_length=1)
    code: str
    langSubtag: str = Field(min_length=2, max_length=3)
    isRtl: bool
    label: str = Field(min_length=1)
    isFallback: bool

    @field_validator("subsidiaryName", "label")
    @classmethod
    def _trim_required(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be empty")
        return v

    @field_validator("code", "langSubtag")
    @classmethod
    def _trim(cls, v: str) -> str:
        return v.strip()

    @field_validator("code")
    @classmethod
    def _validate_code(cls, v: str) -> str:
        if not LOCALE_CODE_RE.match(v):
            raise ValueError('Use the format "<lang>_<COUNTRY>", e.g. "ar_AE"')
        return v


@router.post("/subsidiary-locales", status_code=status.HTTP_201_CREATED)
def add_subsidiary_locale(body: CreateSubsidiaryLocaleBody, db: Session = Depends(get_db)) -> dict:
    created = subsidiary_locale_service.add_subsidiary_locale(
        db,
        CreateSubsidiaryLocaleInput(
            subsidiaryName=body.subsidiaryName,
            code=body.code,
            langSubtag=body.langSubtag,
            isRtl=body.isRtl,
            label=body.label,
            isFallback=body.isFallback,
        ),
    )
    return _serialize_locale(created)


@router.delete("/subsidiary-locales/{id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_subsidiary_locale(id: str, db: Session = Depends(get_db)) -> None:
    deleted = subsidiary_locale_service.remove_subsidiary_locale(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="locale not found")


# --- Users ---------------------------------------------------------------------


@router.get("/users")
def list_users(db: Session = Depends(get_db)) -> list[dict]:
    return [_serialize_user_full(u) for u in auth_service.list_users(db)]


class CreateUserBody(BaseModel):
    username: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=8)
    role: Literal["admin", "standard", "superadmin"]
    subsidiaryId: Optional[str] = Field(default=None, min_length=1)

    @model_validator(mode="after")
    def _standard_requires_subsidiary(self) -> "CreateUserBody":
        if self.role == "standard" and not self.subsidiaryId:
            raise ValueError("Subsidiary is required for a standard user")
        return self


# There is no self-service signup — admins provision every account through
# this endpoint. A plain "admin" may only provision "standard" users; only a
# "superadmin" may provision another "admin" or "superadmin".
@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user(body: CreateUserBody, db: Session = Depends(get_db), auth: dict = Depends(require_admin)) -> dict:
    if auth.get("role") != "superadmin" and body.role != "standard":
        raise HTTPException(status_code=403, detail="only a superadmin may provision an admin or superadmin account")
    user = auth_service.create_user(db, body.username, str(body.email), body.password, body.role, body.subsidiaryId)
    # Echoes back the email the admin just typed rather than decrypting
    # `user.email` — same value, one fewer DKMS round trip.
    return {"id": user.id, "username": user.username, "email": str(body.email), "role": user.role, "subsidiaryId": user.subsidiaryId}


class UpdateUserActiveBody(BaseModel):
    isActive: bool


# Disabling an account blocks new logins immediately; it does not touch
# anything that account has already uploaded/submitted. Same role-based
# restriction as account creation, plus: nobody may disable their own
# account.
@router.patch("/users/{id}")
def update_user_active(
    id: str, body: UpdateUserActiveBody, db: Session = Depends(get_db), auth: dict = Depends(require_admin)
) -> dict:
    if id == auth.get("sub"):
        raise HTTPException(status_code=403, detail="you cannot disable your own account")

    target = auth_service.find_user_by_id(db, id)
    if target is None:
        raise HTTPException(status_code=404, detail="user not found")
    if auth.get("role") != "superadmin" and target.role != "standard":
        raise HTTPException(status_code=403, detail="only a superadmin may enable/disable an admin or superadmin account")

    updated = auth_service.set_user_active(db, id, body.isActive)
    assert updated is not None
    return {
        "id": updated.id,
        "username": updated.username,
        "email": dkms_client.decrypt_or_none(updated.email),
        "role": updated.role,
        "subsidiaryId": updated.subsidiaryId,
        "isActive": updated.isActive,
    }


# Hard delete — only possible when the account has no dependent records
# anywhere in the app's history (created forms, contributions, QA runs,
# Question Master exports, AI assistant activity, ...). A user who's ever
# done any of that can only be deactivated (PATCH .../users/:id above),
# never deleted — see auth_service.delete_user. Same self-account and
# role-based restrictions as update_user_active.
@router.delete("/users/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(id: str, db: Session = Depends(get_db), auth: dict = Depends(require_admin)) -> None:
    if id == auth.get("sub"):
        raise HTTPException(status_code=403, detail="you cannot delete your own account")

    target = auth_service.find_user_by_id(db, id)
    if target is None:
        raise HTTPException(status_code=404, detail="user not found")
    if auth.get("role") != "superadmin" and target.role != "standard":
        raise HTTPException(status_code=403, detail="only a superadmin may delete an admin or superadmin account")

    outcome = auth_service.delete_user(db, id)
    if outcome == "not_found":
        raise HTTPException(status_code=404, detail="user not found")
    if outcome == "has_records":
        raise HTTPException(
            status_code=409,
            detail=(
                "This user cannot be deleted because they already have records in the system "
                "(created forms, contributions, or other activity). Deactivate the account instead."
            ),
        )


class UpdateUserProfileBody(BaseModel):
    username: Optional[str] = Field(default=None, min_length=1)
    email: Optional[EmailStr] = None
    role: Optional[Literal["admin", "standard", "superadmin"]] = None
    subsidiaryId: Optional[str] = Field(default=None, min_length=1)
    firstName: Optional[str] = Field(default=None, max_length=100)
    lastName: Optional[str] = Field(default=None, max_length=100)

    @field_validator("username")
    @classmethod
    def _trim_username(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v is not None else v

    @field_validator("firstName", "lastName")
    @classmethod
    def _trim_names(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v is not None else v


# Full account-details edit — same admin-may-manage-standard-users,
# superadmin-may-manage-anyone split as set_user_active/account creation,
# applied twice: (1) the target's own *current* role, and (2) the
# *requested* role (a plain admin may never grant admin/superadmin here).
@router.patch("/users/{id}/profile")
def update_user_profile(
    id: str, body: UpdateUserProfileBody, db: Session = Depends(get_db), auth: dict = Depends(require_admin)
) -> dict:
    target = auth_service.find_user_by_id(db, id)
    if target is None:
        raise HTTPException(status_code=404, detail="user not found")

    if auth.get("role") != "superadmin":
        if target.role != "standard":
            raise HTTPException(status_code=403, detail="only a superadmin may update an admin or superadmin account")
        if body.role is not None and body.role != "standard":
            raise HTTPException(status_code=403, detail="only a superadmin may grant an admin or superadmin role")

    data = body.model_dump(exclude_unset=True)
    updated = auth_service.update_user(db, id, data)
    if updated is None:
        raise HTTPException(status_code=404, detail="user not found")
    return _serialize_user_full(updated)


class UpdateNotificationEmailBody(BaseModel):
    notificationEmail: OptionalEmail = None
    notificationEmail2: OptionalEmail = None


# A superadmin may set anyone's notificationEmail(s). A plain admin may set
# their own, any other admin's, and any standard/subsidiary-scoped user's —
# but not a superadmin's.
@router.patch("/users/{id}/notification-email")
def update_user_notification_email(
    id: str, body: UpdateNotificationEmailBody, db: Session = Depends(get_db), auth: dict = Depends(require_admin)
) -> dict:
    target = auth_service.find_user_by_id(db, id)
    if target is None:
        raise HTTPException(status_code=404, detail="user not found")

    is_self = target.id == auth.get("sub")
    can_manage = (
        auth.get("role") == "superadmin"
        or is_self
        or (auth.get("role") == "admin" and target.role in ("admin", "standard"))
    )
    if not can_manage:
        raise HTTPException(status_code=403, detail="You are not allowed to update this user's notification email")

    data = body.model_dump(exclude_unset=True)
    updated = auth_service.set_user_notification_emails(db, id, data)
    if updated is None:
        raise HTTPException(status_code=404, detail="user not found")
    return _serialize_user_full(updated)


# --- SMTP settings -------------------------------------------------------------


class SmtpSettingsBody(BaseModel):
    host: str = Field(min_length=1)
    port: int = Field(ge=1, le=65535)
    secure: bool
    user: Optional[str] = None
    password: Optional[str] = None
    from_: Optional[str] = Field(default=None, alias="from")

    model_config = {"populate_by_name": True}


@router.get("/smtp-settings")
def get_smtp_settings(db: Session = Depends(get_db)) -> dict:
    return smtp_settings_service.get_smtp_settings_for_display(db)


@router.patch("/smtp-settings")
def patch_smtp_settings(body: SmtpSettingsBody, db: Session = Depends(get_db)) -> dict:
    smtp_settings_service.save_smtp_settings(
        db,
        SmtpSettingsInput(
            host=body.host,
            port=body.port,
            secure=body.secure,
            user=(body.user.strip() or None) if body.user else None,
            password=body.password,
            from_=(body.from_.strip() or None) if body.from_ else None,
        ),
    )
    return smtp_settings_service.get_smtp_settings_for_display(db)


@router.post("/smtp-settings/test")
def test_smtp_settings(db: Session = Depends(get_db), auth: dict = Depends(require_admin)) -> dict:
    user = auth_service.find_user_by_id(db, auth["sub"])
    if user is None:
        raise HTTPException(status_code=404, detail="user not found")
    recipient = dkms_client.decrypt_or_none(user.email)
    if not recipient:
        raise HTTPException(status_code=502, detail="Could not resolve your email address")
    result = email_service.send_test_email(db, recipient)
    if not result.ok:
        raise HTTPException(status_code=502, detail=result.error)
    return {"ok": True, "sentTo": recipient}


# --- DKMS settings -----------------------------------------------------------
# The base URL/task id the whole app's PII encryption depends on (see
# app.security.dkms_client) — admin-managed here the same way SMTP/FabriX/
# Groq/SFTP are, so a redeploy or environment change doesn't require editing
# env vars and restarting the process. Nothing here is a secret (no API key —
# DKMS auth today is just baseUrl + taskId), so unlike the others there's no
# write-only field to hide on GET.


class DkmsSettingsBody(BaseModel):
    baseUrl: str = Field(min_length=1)
    taskId: str = Field(min_length=1)
    timeoutSeconds: Optional[int] = Field(default=None, ge=1, le=120)
    piiTagEmail: Optional[str] = None
    piiTagFirstName: Optional[str] = None
    piiTagLastName: Optional[str] = None

    @field_validator("baseUrl", "taskId")
    @classmethod
    def _trim_required(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be empty")
        return v


@router.get("/dkms-settings")
def get_dkms_settings(db: Session = Depends(get_db)) -> dict:
    return dkms_settings_service.get_dkms_settings_for_display(db)


@router.patch("/dkms-settings")
def patch_dkms_settings(body: DkmsSettingsBody, db: Session = Depends(get_db)) -> dict:
    dkms_settings_service.save_dkms_settings(
        db,
        DkmsSettingsInput(
            baseUrl=body.baseUrl,
            taskId=body.taskId,
            timeoutSeconds=body.timeoutSeconds,
            piiTagEmail=(body.piiTagEmail.strip() or None) if body.piiTagEmail else None,
            piiTagFirstName=(body.piiTagFirstName.strip() or None) if body.piiTagFirstName else None,
            piiTagLastName=(body.piiTagLastName.strip() or None) if body.piiTagLastName else None,
        ),
    )
    return dkms_settings_service.get_dkms_settings_for_display(db)


# --- FabriX settings -------------------------------------------------------------


class FabrixSettingsBody(BaseModel):
    baseUrl: str = Field(min_length=1)
    clientHeader: Optional[str] = None
    openApiToken: Optional[str] = None
    userEmail: Optional[str] = None
    enabled: Optional[bool] = None


@router.get("/fabrix-settings")
def get_fabrix_settings(db: Session = Depends(get_db)) -> dict:
    return fabrix_settings_service.get_fabrix_settings_for_display(db)


@router.patch("/fabrix-settings")
def patch_fabrix_settings(body: FabrixSettingsBody, db: Session = Depends(get_db)) -> dict:
    fabrix_settings_service.save_fabrix_settings(
        db,
        FabrixSettingsInput(
            baseUrl=body.baseUrl,
            clientHeader=body.clientHeader,
            openApiToken=body.openApiToken,
            userEmail=body.userEmail,
            enabled=body.enabled,
        ),
    )
    return fabrix_settings_service.get_fabrix_settings_for_display(db)


@router.post("/fabrix-settings/test")
async def test_fabrix_settings(db: Session = Depends(get_db)) -> dict:
    fabrix_settings = fabrix_settings_service.get_fabrix_settings_for_display(db)
    if not fabrix_settings["baseUrl"] or fabrix_settings["enabledModelCount"] == 0:
        raise HTTPException(
            status_code=400, detail={"ok": False, "error": "FabriXAI base URL and at least one enabled model must be configured first"}
        )
    result = await send_fabrix_message({"messages": [{"role": "user", "content": "Reply with the single word OK."}]}, db)
    if not result["ok"]:
        return {"ok": False, "error": result["error"]}
    return {"ok": True}


@router.get("/fabrix-models")
def list_fabrix_models(db: Session = Depends(get_db)) -> list[dict]:
    return [_serialize_fabrix_model(m) for m in fabrix_models_service.list_fabrix_models(db)]


class CreateFabrixModelBody(BaseModel):
    name: str = Field(min_length=1)
    modelId: str = Field(min_length=1)

    @field_validator("name", "modelId")
    @classmethod
    def _trim(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be empty")
        return v


@router.post("/fabrix-models", status_code=status.HTTP_201_CREATED)
def create_fabrix_model(body: CreateFabrixModelBody, db: Session = Depends(get_db)) -> dict:
    created = fabrix_models_service.create_fabrix_model(db, CreateFabrixModelInput(name=body.name, modelId=body.modelId))
    return _serialize_fabrix_model(created)


class UpdateFabrixModelBody(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    modelId: Optional[str] = Field(default=None, min_length=1)
    isEnabled: Optional[bool] = None


@router.patch("/fabrix-models/{id}")
def update_fabrix_model(id: str, body: UpdateFabrixModelBody, db: Session = Depends(get_db)) -> dict:
    updated = fabrix_models_service.update_fabrix_model(db, id, body.model_dump(exclude_unset=True))
    if updated is None:
        raise HTTPException(status_code=404, detail="fabrix model not found")
    return _serialize_fabrix_model(updated)


class MoveFabrixModelBody(BaseModel):
    direction: Literal["up", "down"]


@router.post("/fabrix-models/{id}/move")
def move_fabrix_model(id: str, body: MoveFabrixModelBody, db: Session = Depends(get_db)) -> dict:
    moved = fabrix_models_service.move_fabrix_model(db, id, body.direction)
    if moved is None:
        raise HTTPException(status_code=404, detail="fabrix model not found")
    return _serialize_fabrix_model(moved)


@router.delete("/fabrix-models/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fabrix_model(id: str, db: Session = Depends(get_db)) -> None:
    deleted = fabrix_models_service.delete_fabrix_model(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="fabrix model not found")


# --- Groq settings -----------------------------------------------------------
# The fallback AI-assistant provider tier, used automatically whenever
# FabriX is disabled or unreachable (see aiProviderService.py). Enabling/
# disabling either tier is exactly what decides "which API should use" —
# there's no separate priority setting, since FabriX is always tried first
# when both are enabled.


class GroqSettingsBody(BaseModel):
    model: str = Field(min_length=1)
    apiKey: Optional[str] = None
    enabled: Optional[bool] = None


@router.get("/groq-settings")
def get_groq_settings(db: Session = Depends(get_db)) -> dict:
    return groq_settings_service.get_groq_settings_for_display(db)


@router.patch("/groq-settings")
def patch_groq_settings(body: GroqSettingsBody, db: Session = Depends(get_db)) -> dict:
    groq_settings_service.save_groq_settings(
        db, GroqSettingsInput(model=body.model, apiKey=body.apiKey, enabled=body.enabled)
    )
    return groq_settings_service.get_groq_settings_for_display(db)


@router.post("/groq-settings/test")
async def test_groq_settings(db: Session = Depends(get_db)) -> dict:
    settings = groq_settings_service.get_groq_settings_for_display(db)
    if not settings["hasApiKey"]:
        raise HTTPException(status_code=400, detail={"ok": False, "error": "A Groq API key must be configured first"})
    result = await send_groq_message({"messages": [{"role": "user", "content": "Reply with a short greeting."}]}, db)
    return {"ok": result["ok"], "error": None if result["ok"] else result["error"]}


# --- SFTP deployment settings -----------------------------------------------------


class SftpTargetBody(BaseModel):
    host: str = Field(min_length=1)
    port: Optional[int] = Field(default=None, ge=1, le=65535)
    username: str = Field(min_length=1)
    privateKeyPath: str = Field(min_length=1)
    remotePath: str = Field(min_length=1)

    @field_validator("host", "username", "privateKeyPath", "remotePath")
    @classmethod
    def _trim(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be empty")
        return v


@router.get("/deployment-settings")
def get_deployment_settings(db: Session = Depends(get_db)) -> dict:
    return _serialize_sftp_settings(sftp_settings_service.get_sftp_deployment_settings(db))


@router.patch("/deployment-settings/{environment}")
def patch_deployment_settings(environment: str, body: SftpTargetBody, db: Session = Depends(get_db)) -> dict:
    if environment not in ("staging", "production"):
        raise HTTPException(status_code=400, detail="environment must be 'staging' or 'production'")
    sftp_settings_service.save_sftp_target(
        db,
        environment,  # type: ignore[arg-type]
        SftpTargetConfig(
            host=body.host,
            port=body.port or 22,
            username=body.username,
            privateKeyPath=body.privateKeyPath,
            remotePath=body.remotePath,
        ),
    )
    return _serialize_sftp_settings(sftp_settings_service.get_sftp_deployment_settings(db))


class SetActiveSftpEnvironmentBody(BaseModel):
    environment: Literal["staging", "production"]


@router.post("/deployment-settings/active")
def post_active_deployment_environment(body: SetActiveSftpEnvironmentBody, db: Session = Depends(get_db)) -> dict:
    sftp_settings_service.set_active_sftp_environment(db, body.environment)
    return _serialize_sftp_settings(sftp_settings_service.get_sftp_deployment_settings(db))


# --- QA runs ---------------------------------------------------------------
# A Playwright QA run against one generated variant of a pending
# contribution or an ad-hoc form awaiting review (see `qa_run_service.py`).
# The actual browser automation runs in the background (no job queue, just a
# fire-and-forget background thread in this same process — see
# `qa_run_service.run_qa_job`'s own doc comment for why that's an acceptable
# tradeoff here). The frontend polls GET /qa-runs/:id until status leaves
# "pending"/"running".


class CreateQaRunBody(BaseModel):
    contributionId: Optional[str] = Field(default=None, min_length=1)
    formId: Optional[str] = Field(default=None, min_length=1)
    variant: Literal["ff", "oc"]

    @model_validator(mode="after")
    def _exactly_one_owner(self) -> "CreateQaRunBody":
        if (self.contributionId is not None) == (self.formId is not None):
            raise ValueError("Exactly one of contributionId or formId is required")
        return self


@router.post("/qa-runs", status_code=status.HTTP_201_CREATED)
def create_qa_run(body: CreateQaRunBody, db: Session = Depends(get_db), auth: dict = Depends(require_admin)) -> dict:
    variant: QaRunVariant = body.variant
    result = (
        qa_run_service.create_contribution_qa_run(db, body.contributionId, variant, auth["sub"])
        if body.contributionId
        else qa_run_service.create_adhoc_review_qa_run(db, body.formId, variant, auth["sub"])
    )

    if result.outcome == "not_found":
        raise HTTPException(status_code=404, detail="form or pending contribution not found")
    if result.outcome == "no_files":
        raise HTTPException(status_code=409, detail="no generated output for that variant yet")
    if result.outcome == "invalid":
        validation: ValidationResult = result.validation
        raise HTTPException(
            status_code=422,
            detail={"error": "this form has blocking validation errors — fix them before running QA", "validation": validation.model_dump()},
        )
    return _serialize_qa_run(result.qaRun)


# Every QA run ever triggered for one Configuration form (?formId= — covers
# both contribution-based and ad-hoc pending-review runs, since both set
# QaRun.formId), newest first.
@router.get("/qa-runs")
def list_qa_runs(formId: Optional[str] = None, db: Session = Depends(get_db)) -> list[dict]:
    if not formId:
        raise HTTPException(status_code=400, detail="formId query param is required")
    return [_serialize_qa_run(r) for r in qa_run_service.list_qa_runs_for_form(db, formId)]


# One run's full detail — status/counts plus every individual test case
# result (name/status/fieldId/message), what the "which fields should be
# fixed" view in the admin dashboard reads.
@router.get("/qa-runs/{id}")
def get_qa_run_detail_route(id: str, db: Session = Depends(get_db)) -> dict:
    detail = qa_run_service.get_qa_run_detail(db, id)
    if detail is None:
        raise HTTPException(status_code=404, detail="QA run not found")
    return {"run": _serialize_qa_run(detail.run), "results": [_serialize_qa_test_case_result(r) for r in detail.results]}


# The same run, as a standalone downloadable HTML report — see
# qa_run_service.build_qa_report_download / _write_qa_report.
@router.get("/qa-runs/{id}/download")
def download_qa_report(id: str, db: Session = Depends(get_db)) -> Response:
    result = qa_run_service.build_qa_report_download(db, id)
    if result.outcome == "not_found":
        raise HTTPException(status_code=404, detail="QA run not found")
    if result.outcome == "not_ready":
        raise HTTPException(status_code=409, detail="this QA run has no report yet — it may still be running, or it errored before completing")
    return Response(
        content=result.html,
        media_type="text/html",
        headers={"Content-Disposition": f'attachment; filename="qa-report-{id}.html"'},
    )


def _serialize_qa_run(run) -> dict:
    return {
        "id": run.id,
        "uploadId": run.uploadId,
        "formId": run.formId,
        "contributionId": run.contributionId,
        "variant": run.variant,
        "status": run.status,
        "triggeredByUserId": run.triggeredByUserId,
        "totalTests": run.totalTests,
        "passedTests": run.passedTests,
        "failedTests": run.failedTests,
        "errorMessage": run.errorMessage,
        "reportPath": run.reportPath,
        "createdAt": run.createdAt,
        "startedAt": run.startedAt,
        "completedAt": run.completedAt,
    }


def _serialize_qa_test_case_result(row) -> dict:
    return {
        "id": row.id,
        "qaRunId": row.qaRunId,
        "category": row.category,
        "name": row.name,
        "status": row.status,
        "fieldId": row.fieldId,
        "message": row.message,
        "createdAt": row.createdAt,
    }


# --- Question Master -----------------------------------------------------------


# Every active-subsidiary Form under a project code, plus whether each has been
# published yet — lets the Question Master page show who isn't ready before an admin
# clicks Generate. See question_master_service.get_readiness.
@router.get("/question-master/readiness")
def get_question_master_readiness(projectCode: Optional[str] = None, db: Session = Depends(get_db)) -> list[dict]:
    if not projectCode:
        raise HTTPException(status_code=400, detail="projectCode query param is required")
    return question_master_service.get_readiness(db, projectCode)


class GenerateQuestionMasterBody(BaseModel):
    projectCode: str = Field(min_length=1)
    division: Optional[str] = Field(default=None, max_length=50)

    @field_validator("projectCode")
    @classmethod
    def _trim_project_code(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("projectCode must not be empty")
        return v

    @field_validator("division")
    @classmethod
    def _trim_division(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v is not None else v


# Compiles every published form under the given project code into a new, versioned
# Question Master .xlsx. See question_master_service.generate_question_master.
@router.post("/question-master/generate", status_code=status.HTTP_201_CREATED)
def post_generate_question_master(
    body: GenerateQuestionMasterBody, db: Session = Depends(get_db), auth: dict = Depends(require_admin)
) -> dict:
    result = question_master_service.generate_question_master(
        db, body.projectCode, body.division or "", auth.get("sub")
    )
    if result.outcome == "project_not_found":
        raise HTTPException(status_code=404, detail=f'Unknown project code "{body.projectCode}"')
    if result.outcome == "not_locked":
        raise HTTPException(status_code=409, detail="This project code must be locked before generating a Question Master")
    return _serialize_question_master_version(result.version)


# Every Question Master version generated for a project code, newest first.
@router.get("/question-master/versions")
def list_question_master_versions(projectCode: Optional[str] = None, db: Session = Depends(get_db)) -> list[dict]:
    if not projectCode:
        raise HTTPException(status_code=400, detail="projectCode query param is required")
    versions = question_master_service.list_versions(db, projectCode)
    return [_serialize_question_master_version(v) for v in versions]


@router.get("/question-master/versions/{id}/download")
def download_question_master_version(id: str, db: Session = Depends(get_db)) -> Response:
    result = question_master_service.get_version_file(db, id)
    if result.outcome == "not_found":
        raise HTTPException(status_code=404, detail="Question Master version not found")
    return Response(
        content=result.data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{result.file_name}"'},
    )


# --- Dashboard -----------------------------------------------------------------


@router.get("/dashboard-summary")
def get_dashboard_summary(db: Session = Depends(get_db)) -> dict:
    return dashboard_service.get_admin_dashboard_summary(db)
