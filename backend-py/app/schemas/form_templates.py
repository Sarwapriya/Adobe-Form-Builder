"""Pydantic request-body models for `app/routers/templates.py` — same
`definition`/`config` reuse-the-form_pipeline-models convention
`app/schemas/form_builder.py` already uses (see that file's own doc
comment)."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

from app.form_pipeline import BuilderConfig, FormDefinition

TemplateScopeInput = Literal["USER", "SUBSIDIARY", "GLOBAL"]


def _trim_required(v: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError("must not be empty")
    return v


def _trim_optional(v: Optional[str]) -> Optional[str]:
    if v is None:
        return None
    v = v.strip()
    if not v:
        raise ValueError("must not be empty")
    return v


class CreateTemplateBody(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    category: Optional[str] = Field(default=None, max_length=100)
    # Server-resolved against the caller's actual role/subsidiary in the
    # router — never trusted outright (a standard user can't request GLOBAL
    # or a foreign subsidiary; see templates.py's `_resolve_scope`).
    scope: TemplateScopeInput = "USER"
    targetSubsidiaryName: Optional[str] = None
    definition: FormDefinition
    config: BuilderConfig

    _v_name = field_validator("name")(classmethod(lambda cls, v: _trim_required(v)))
    _v_description = field_validator("description")(classmethod(lambda cls, v: _trim_optional(v)))
    _v_category = field_validator("category")(classmethod(lambda cls, v: _trim_optional(v)))
    _v_target_subsidiary = field_validator("targetSubsidiaryName")(classmethod(lambda cls, v: _trim_optional(v)))


class UpdateTemplateBody(BaseModel):
    """Metadata-only — see `form_template_service.update_template`'s own
    doc comment for why content isn't re-saveable here."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    category: Optional[str] = Field(default=None, max_length=100)
    scope: Optional[TemplateScopeInput] = None
    targetSubsidiaryName: Optional[str] = None

    _v_name = field_validator("name")(classmethod(lambda cls, v: _trim_optional(v)))
    _v_description = field_validator("description")(classmethod(lambda cls, v: _trim_optional(v)))
    _v_category = field_validator("category")(classmethod(lambda cls, v: _trim_optional(v)))
    _v_target_subsidiary = field_validator("targetSubsidiaryName")(classmethod(lambda cls, v: _trim_optional(v)))
