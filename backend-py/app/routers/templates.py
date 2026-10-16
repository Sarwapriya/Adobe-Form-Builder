"""Reusable form-builder templates — list/get/create/update/delete, any
authenticated user (not admin-only, unlike most of `app/routers/admin.py`:
a subsidiary user owns and manages their own templates too). Mounted at
`/api/v1/templates` (see `app/main.py`).

Every role/ownership/scope-escalation decision lives here, never in
`form_template_service.py` — same convention `subsidiary_privacy_link_service.py`
already established (services take already-decided plain values; routers
decide them from the caller's JWT claims)."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.form_template import FormTemplate, TemplateScope
from app.models.user import User, is_admin_role
from app.schemas.form_templates import CreateTemplateBody, UpdateTemplateBody
from app.security.deps import require_auth
from app.services import form_template_service, subsidiary_service

router = APIRouter(dependencies=[Depends(require_auth)])


def _lookup_username(db: Session, user_id: str) -> Optional[str]:
    user = db.get(User, user_id)
    return user.username if user else None


def _lookup_usernames(db: Session, user_ids: set[str]) -> dict[str, str]:
    if not user_ids:
        return {}
    rows = db.execute(select(User).where(User.id.in_(user_ids))).scalars().all()
    return {u.id: u.username for u in rows}


def _resolve_scope(
    auth: dict, db: Session, requested_scope: str, requested_subsidiary_name: Optional[str]
) -> tuple[TemplateScope, Optional[str]]:
    """Turns a client-requested scope/subsidiary into the scope/subsidiary
    that actually gets persisted, never trusting the client outright:

    - A non-admin may only end up at `USER` or `SUBSIDIARY`-with-their-own-
      subsidiary — an explicit `GLOBAL` request, or a `SUBSIDIARY` request
      naming a *different* subsidiary, is rejected (403), not silently
      downgraded, so a forged request fails loudly rather than appearing to
      half-succeed. `subsidiaryName` is always their own regardless of the
      final scope (for display/audit on a USER-scoped template too).
    - An admin/superadmin's `SUBSIDIARY` scope requires a real, active
      subsidiary name (`subsidiary_service.assert_subsidiary_active` raises
      `NotFoundError`/`SubsidiaryInactiveError`, both already mapped to an
      HTTP status by `app/main.py`'s `AppError` handler); `GLOBAL`/`USER`
      need no subsidiary.
    """
    is_admin = is_admin_role(auth.get("role", ""))
    own_subsidiary = auth.get("subsidiaryId")

    if not is_admin:
        if requested_scope == "GLOBAL":
            raise HTTPException(status_code=403, detail="Only an Admin or Super Admin may create a global template")
        if requested_scope == "SUBSIDIARY" and requested_subsidiary_name and requested_subsidiary_name != own_subsidiary:
            raise HTTPException(status_code=403, detail="You may only assign a template to your own subsidiary")
        if requested_scope == "SUBSIDIARY" and own_subsidiary:
            return "SUBSIDIARY", own_subsidiary
        return "USER", own_subsidiary

    if requested_scope == "SUBSIDIARY":
        if not requested_subsidiary_name:
            raise HTTPException(status_code=400, detail="targetSubsidiaryName is required for a subsidiary-scoped template")
        subsidiary_service.assert_subsidiary_active(db, requested_subsidiary_name)
        return "SUBSIDIARY", requested_subsidiary_name
    if requested_scope == "GLOBAL":
        return "GLOBAL", None
    return "USER", None


def _visible_or_404(db: Session, auth: dict, template_id: str) -> FormTemplate:
    is_admin = is_admin_role(auth.get("role", ""))
    row = form_template_service.get_template_if_visible(
        db, template_id, is_admin=is_admin, subsidiary_name=auth.get("subsidiaryId"), user_id=auth["sub"]
    )
    if row is None:
        raise HTTPException(status_code=404, detail="template not found")
    return row


def _assert_can_manage(auth: dict, row: FormTemplate) -> None:
    """Only the owner, or a superadmin, may edit/delete — a plain admin
    gets no special rights over another user's template, even though they
    can see and use it (`_visible_or_404` already let them this far, so a
    403 here doesn't leak anything new)."""
    if row.createdByUserId == auth["sub"]:
        return
    if auth.get("role") == "superadmin":
        return
    raise HTTPException(status_code=403, detail="Only the template's owner or a Super Admin may modify it")


@router.get("")
def list_templates(
    search: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    auth: dict = Depends(require_auth),
) -> list[dict]:
    is_admin = is_admin_role(auth.get("role", ""))
    rows = form_template_service.list_visible_templates(
        db,
        is_admin=is_admin,
        subsidiary_name=auth.get("subsidiaryId"),
        user_id=auth["sub"],
        search=search,
        category=category,
    )
    usernames = _lookup_usernames(db, {r.createdByUserId for r in rows})
    return [form_template_service.serialize_summary(r, created_by_username=usernames.get(r.createdByUserId)) for r in rows]


@router.get("/{id}")
def get_template(id: str, db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> dict:
    row = _visible_or_404(db, auth, id)
    return form_template_service.serialize_detail(row, created_by_username=_lookup_username(db, row.createdByUserId))


@router.post("", status_code=status.HTTP_201_CREATED)
def create_template(body: CreateTemplateBody, db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> dict:
    scope, subsidiary_name = _resolve_scope(auth, db, body.scope, body.targetSubsidiaryName)
    row = form_template_service.create_template(
        db,
        name=body.name,
        description=body.description,
        category=body.category,
        scope=scope,
        subsidiary_name=subsidiary_name,
        definition=body.definition,
        config=body.config,
        created_by_user_id=auth["sub"],
    )
    return form_template_service.serialize_summary(row, created_by_username=_lookup_username(db, auth["sub"]))


@router.put("/{id}")
def update_template(
    id: str, body: UpdateTemplateBody, db: Session = Depends(get_db), auth: dict = Depends(require_auth)
) -> dict:
    row = _visible_or_404(db, auth, id)
    _assert_can_manage(auth, row)

    data = body.model_dump(exclude_unset=True)
    scope_value: Optional[str] = None
    subsidiary_value: Optional[str] = None
    subsidiary_set = False
    if "scope" in data or "targetSubsidiaryName" in data:
        requested_scope = data.get("scope", row.scope)
        requested_subsidiary = data.get("targetSubsidiaryName", row.subsidiaryName)
        scope_value, subsidiary_value = _resolve_scope(auth, db, requested_scope, requested_subsidiary)
        subsidiary_set = True

    updated = form_template_service.update_template(
        db,
        id,
        name=data.get("name"),
        description=data.get("description"),
        category=data.get("category"),
        scope=scope_value,
        subsidiary_name=subsidiary_value,
        subsidiary_name_set=subsidiary_set,
        updated_by_user_id=auth["sub"],
    )
    assert updated is not None
    return form_template_service.serialize_summary(updated, created_by_username=_lookup_username(db, updated.createdByUserId))


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(id: str, db: Session = Depends(get_db), auth: dict = Depends(require_auth)) -> None:
    row = _visible_or_404(db, auth, id)
    _assert_can_manage(auth, row)
    form_template_service.delete_template(db, id)
