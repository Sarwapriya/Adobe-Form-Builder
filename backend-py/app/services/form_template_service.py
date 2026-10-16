"""Reusable form-builder configurations a new campaign can be started from
(`fq.FormTemplates`) — see `app/models/form_template.py`'s own doc comment
for the storage shape and `app/routers/templates.py` for the authorization
rules this module deliberately does NOT enforce.

No role/ownership checks live here, by this codebase's own established
convention (see `subsidiary_privacy_link_service.py`): every function below
takes already-decided plain values (which rows are visible to this caller,
what scope/subsidiary to persist) and the router is the single place that
decides those values from the caller's role."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.form_pipeline import BuilderConfig, FormDefinition
from app.models.form_template import FormTemplate, TemplateScope


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _visibility_clause(*, is_admin: bool, subsidiary_name: Optional[str], user_id: str):
    if is_admin:
        return None
    clauses = [
        FormTemplate.scope == "GLOBAL",
        FormTemplate.createdByUserId == user_id,
    ]
    if subsidiary_name:
        clauses.append((FormTemplate.scope == "SUBSIDIARY") & (FormTemplate.subsidiaryName == subsidiary_name))
    return or_(*clauses)


def list_visible_templates(
    db: Session,
    *,
    is_admin: bool,
    subsidiary_name: Optional[str],
    user_id: str,
    search: Optional[str] = None,
    category: Optional[str] = None,
) -> list[FormTemplate]:
    stmt = select(FormTemplate).where(FormTemplate.isDeleted == False)  # noqa: E712
    visibility = _visibility_clause(is_admin=is_admin, subsidiary_name=subsidiary_name, user_id=user_id)
    if visibility is not None:
        stmt = stmt.where(visibility)
    if search:
        stmt = stmt.where(FormTemplate.name.like(f"%{search}%"))
    if category:
        stmt = stmt.where(FormTemplate.category == category)
    return list(db.execute(stmt.order_by(FormTemplate.updatedAt.desc())).scalars().all())


def get_template_if_visible(
    db: Session,
    template_id: str,
    *,
    is_admin: bool,
    subsidiary_name: Optional[str],
    user_id: str,
) -> Optional[FormTemplate]:
    """`None` identically whether the id doesn't exist, is soft-deleted, or
    simply isn't visible to this caller — so a router 404 built on top of
    this never leaks which case occurred (same idiom as
    `ai_proposal_service._owned_proposal`/`form_builder_service.find_owned_adhoc_form`)."""
    row = db.get(FormTemplate, template_id)
    if row is None or row.isDeleted:
        return None
    if is_admin:
        return row
    if row.scope == "GLOBAL":
        return row
    if row.createdByUserId == user_id:
        return row
    if row.scope == "SUBSIDIARY" and subsidiary_name and row.subsidiaryName == subsidiary_name:
        return row
    return None


def create_template(
    db: Session,
    *,
    name: str,
    description: Optional[str],
    category: Optional[str],
    scope: TemplateScope,
    subsidiary_name: Optional[str],
    definition: FormDefinition,
    config: BuilderConfig,
    created_by_user_id: str,
) -> FormTemplate:
    row = FormTemplate(
        name=name,
        description=description,
        category=category,
        definitionJson=definition.model_dump_json(),
        configJson=config.model_dump_json(),
        scope=scope,
        subsidiaryName=subsidiary_name,
        createdByUserId=created_by_user_id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_template(
    db: Session,
    template_id: str,
    *,
    name: Optional[str] = None,
    description: Optional[str] = None,
    category: Optional[str] = None,
    scope: Optional[TemplateScope] = None,
    subsidiary_name: Optional[str] = None,
    subsidiary_name_set: bool = False,
    updated_by_user_id: str,
) -> Optional[FormTemplate]:
    """Metadata-only update (name/description/category/scope/subsidiaryName)
    — re-saving a template's content isn't supported this round (see the
    Template Management plan's "Design decisions"); that's done by using the
    template to start a new form and saving that as a new template instead.
    `subsidiary_name_set` distinguishes "clear it" (explicit `None`, e.g. a
    scope change away from SUBSIDIARY) from "leave it as-is" (omitted)."""
    row = db.get(FormTemplate, template_id)
    if row is None or row.isDeleted:
        return None
    if name is not None:
        row.name = name
    if description is not None:
        row.description = description
    if category is not None:
        row.category = category
    if scope is not None:
        row.scope = scope
    if subsidiary_name_set:
        row.subsidiaryName = subsidiary_name
    row.updatedByUserId = updated_by_user_id
    row.updatedAt = _now()
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def delete_template(db: Session, template_id: str) -> bool:
    row = db.get(FormTemplate, template_id)
    if row is None or row.isDeleted:
        return False
    row.isDeleted = True
    row.updatedAt = _now()
    db.add(row)
    db.commit()
    return True


def serialize_summary(row: FormTemplate, *, created_by_username: Optional[str] = None) -> dict[str, Any]:
    return {
        "id": row.id,
        "name": row.name,
        "description": row.description,
        "category": row.category,
        "scope": row.scope,
        "subsidiaryName": row.subsidiaryName,
        "createdByUserId": row.createdByUserId,
        "createdByUsername": created_by_username,
        "createdAt": row.createdAt,
        "updatedAt": row.updatedAt,
    }


def serialize_detail(row: FormTemplate, *, created_by_username: Optional[str] = None) -> dict[str, Any]:
    return {
        **serialize_summary(row, created_by_username=created_by_username),
        "definition": FormDefinition.model_validate_json(row.definitionJson),
        "config": BuilderConfig.model_validate_json(row.configJson),
    }
