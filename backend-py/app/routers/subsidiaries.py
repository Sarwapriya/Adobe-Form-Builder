"""Port of `backend/src/routes/subsidiary.router.ts`.

Mounted at `/api/v1/subsidiaries` (see `app/main.py`), requires `require_auth`
only — admin-only management (create/disable/delete, seeing inactive ones)
lives under `/api/v1/admin/subsidiaries` (`app/routers/admin.py`) instead.
"""

from __future__ import annotations

from pathlib import Path
from typing import Annotated, Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, BeforeValidator, EmailStr
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.security.deps import require_auth
from app.services import country_service, subsidiary_logo_service, subsidiary_service

router = APIRouter(dependencies=[Depends(require_auth)])

# No auth dependency, deliberately — this backs a plain <img src> in the
# browser (SubsidiaryLogo.tsx), which can't attach an Authorization header
# the way apiClient.ts's fetch wrapper does, so every request here arrives
# unauthenticated. Safe to leave open: a generated logo is just a circular
# flag-composite SVG built from public country data, same sensitivity level
# as the already-unauthenticated /api/v1/static/... mount the "upload"
# logos are served from.
public_router = APIRouter()

FLAG_DIR = Path(__file__).resolve().parent.parent / "static" / "flags"
UPLOAD_DIR = Path(settings.UPLOAD_DIR)


def _empty_to_none(v: Any) -> Any:
    return None if v == "" else v


OptionalEmail = Annotated[Optional[EmailStr], BeforeValidator(_empty_to_none)]


def _serialize_country(c) -> dict:
    return {
        "id": c.id,
        "isoCode": c.isoCode,
        "countryName": c.countryName,
        "flagUrl": c.flagAssetPath,
        "isActive": c.isActive,
    }


def _serialize_subsidiary(s, db: Session) -> dict:
    countries = subsidiary_service.list_countries_for_subsidiary(db, s.id)
    if s.logoSource == "generated":
        logo_url = f"/api/v1/subsidiaries/{s.id}/logo?v={s.logoVersion or ''}"
    elif s.logoAssetPath:
        logo_url = s.logoAssetPath
    else:
        logo_url = None
    return {
        "id": s.id,
        "name": s.name,
        "isActive": s.isActive,
        "notificationEmail1": s.notificationEmail1,
        "notificationEmail2": s.notificationEmail2,
        "createdAt": s.createdAt,
        "logoUrl": logo_url,
        "logoAlt": subsidiary_logo_service.build_alt_text([c.countryName for c in countries]),
        "countries": [_serialize_country(c) for c in countries],
    }


# Every authenticated user (not just admins) needs this to populate the
# upload/user-creation forms' "Subsidiary" dropdowns — a disabled subsidiary
# shouldn't even appear as an option.
@router.get("")
def list_active_subsidiaries(db: Session = Depends(get_db)) -> list[dict]:
    return [_serialize_subsidiary(s, db) for s in subsidiary_service.list_active_subsidiaries(db)]


# Harmless to expose to any authenticated user — needed by the admin
# country-assignment multi-select, and by anything else that wants to show a
# country's flag/name from just its id.
@router.get("/countries")
def list_countries(db: Session = Depends(get_db)) -> list[dict]:
    return [_serialize_country(c) for c in country_service.list_active_countries(db)]


# Streams a "generated" subsidiary's circular flag-composite SVG badge,
# regenerating it on the fly if the on-disk file is missing (e.g. a fresh
# container with no persisted UPLOAD_DIR volume) — generation is a pure,
# deterministic function of the subsidiary's current country assignment, so
# losing the file is self-healing, not data loss. A subsidiary whose
# logoSource is "upload" has no row here; the frontend never calls this for
# one (see _serialize_subsidiary's logoUrl).
@public_router.get("/{id}/logo")
def get_subsidiary_logo(id: str, db: Session = Depends(get_db)) -> FileResponse:
    subsidiary = subsidiary_service.find_subsidiary_by_id(db, id)
    if subsidiary is None or subsidiary.logoSource != "generated":
        raise HTTPException(status_code=404, detail="Generated logo not found")

    countries = subsidiary_service.list_countries_for_subsidiary(db, id)
    if not countries:
        raise HTTPException(status_code=404, detail="Subsidiary has no assigned countries")
    iso_codes = [c.isoCode for c in countries]

    if not subsidiary.logoAssetPath or subsidiary_logo_service.compute_logo_hash(iso_codes) != subsidiary.logoVersion:
        subsidiary = subsidiary_logo_service.regenerate_subsidiary_logo(
            db, subsidiary, iso_codes, upload_dir=UPLOAD_DIR, flag_dir=FLAG_DIR
        )

    absolute_path = UPLOAD_DIR / subsidiary.logoAssetPath
    if not absolute_path.exists():
        subsidiary = subsidiary_logo_service.regenerate_subsidiary_logo(
            db, subsidiary, iso_codes, upload_dir=UPLOAD_DIR, flag_dir=FLAG_DIR
        )
        absolute_path = UPLOAD_DIR / subsidiary.logoAssetPath

    return FileResponse(
        absolute_path,
        media_type="image/svg+xml",
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


# Lets a subsidiary-scoped standard user see their *own* subsidiary's two
# extra notification-email addresses without needing admin access.
# `auth["subsidiaryId"]` is the subsidiary's *name*, not its id.
@router.get("/mine")
def get_my_subsidiary(db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> dict:
    subsidiary_name = auth.get("subsidiaryId")
    if not subsidiary_name:
        raise HTTPException(status_code=400, detail="Your account isn't scoped to a subsidiary")
    subsidiary = subsidiary_service.find_subsidiary_by_name(db, subsidiary_name)
    if subsidiary is None:
        raise HTTPException(status_code=404, detail="Subsidiary not found")
    return _serialize_subsidiary(subsidiary, db)


class UpdateMineNotificationEmailBody(BaseModel):
    notificationEmail1: OptionalEmail = None
    notificationEmail2: OptionalEmail = None


@router.patch("/mine/notification-email")
def update_my_subsidiary_notification_email(
    body: UpdateMineNotificationEmailBody, db: Session = Depends(get_db), auth: dict = Depends(require_auth)
) -> dict:
    subsidiary_name = auth.get("subsidiaryId")
    if not subsidiary_name:
        raise HTTPException(status_code=400, detail="Your account isn't scoped to a subsidiary")
    subsidiary = subsidiary_service.find_subsidiary_by_name(db, subsidiary_name)
    if subsidiary is None:
        raise HTTPException(status_code=404, detail="Subsidiary not found")

    data = body.model_dump(exclude_unset=True)
    updated = subsidiary_service.set_subsidiary_notification_emails(db, subsidiary.id, data)
    assert updated is not None
    return _serialize_subsidiary(updated, db)
