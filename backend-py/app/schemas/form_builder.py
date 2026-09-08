"""Pydantic request-body models for the form-builder routers — port of the
Zod schemas inline in `backend/src/routes/formBuilder.router.ts` and
`backend/src/routes/subsidiaryForms.router.ts`.

`definition`/`config`/`content` fields reuse the `form_pipeline` Pydantic
models directly (`FormDefinition`/`BuilderConfig`/`ContributionContent`)
rather than hand-re-deriving `formDefinitionZod.ts`/`contributionZod.ts` a
second time — those models already encode the exact same shape (see each
model's own doc comment in `app/form_pipeline/form/definition.py` /
`contribution.py`) and are Pydantic's own construction-time validation, the
same role the Node source's Zod schemas play.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.form_pipeline import BuilderConfig, ContributionContent, FormDefinition, QuestionDefinition


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


class CreateFormBody(BaseModel):
    name: str = Field(min_length=1)
    subsidiaryId: str = Field(min_length=1)
    projectCode: Optional[str] = None
    copyFromFormId: Optional[str] = None

    _v_name = field_validator("name")(classmethod(lambda cls, v: _trim_required(v)))
    _v_subsidiary = field_validator("subsidiaryId")(classmethod(lambda cls, v: _trim_required(v)))
    _v_project_code = field_validator("projectCode")(classmethod(lambda cls, v: _trim_optional(v)))
    _v_copy_from = field_validator("copyFromFormId")(classmethod(lambda cls, v: _trim_optional(v)))


class CreateFormWithQuestionsBody(BaseModel):
    name: str = Field(min_length=1)
    subsidiaryId: str = Field(min_length=1)
    projectCode: Optional[str] = None
    questions: list[QuestionDefinition]

    _v_name = field_validator("name")(classmethod(lambda cls, v: _trim_required(v)))
    _v_subsidiary = field_validator("subsidiaryId")(classmethod(lambda cls, v: _trim_required(v)))
    _v_project_code = field_validator("projectCode")(classmethod(lambda cls, v: _trim_optional(v)))


class CreateAdHocFormBody(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    copyFromFormId: Optional[str] = None

    _v_name = field_validator("name")(classmethod(lambda cls, v: _trim_required(v)))
    _v_copy_from = field_validator("copyFromFormId")(classmethod(lambda cls, v: _trim_optional(v)))


class CreateAdHocFormWithQuestionsBody(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    questions: list[QuestionDefinition]

    _v_name = field_validator("name")(classmethod(lambda cls, v: _trim_required(v)))


class DraftUpdateBody(BaseModel):
    """Deliberately lenient on `config`, mirroring the Node route's own
    comment: the only field this route actually depends on downstream is
    `variants` (enforced non-empty here); everything else just needs to
    round-trip through JSON intact — `BuilderConfig`'s `extra="ignore"`
    config handles that."""

    definition: FormDefinition
    config: BuilderConfig

    @field_validator("config")
    @classmethod
    def _variants_non_empty(cls, v: BuilderConfig) -> BuilderConfig:
        if not v.variants:
            raise ValueError("variants must be a non-empty array")
        return v


class ApproveAdHocBody(BaseModel):
    projectCode: str = Field(min_length=1)

    _v_project_code = field_validator("projectCode")(classmethod(lambda cls, v: _trim_required(v)))


class ReviewNoteBody(BaseModel):
    """Shared shape for reject-ad-hoc / approve-contribution /
    reject-contribution — all `{ reviewNote?: string (trimmed, <=2000) }`."""

    reviewNote: Optional[str] = Field(default=None, max_length=2000)

    _v_review_note = field_validator("reviewNote")(classmethod(lambda cls, v: v.strip() if v is not None else v))


class ContributionBody(BaseModel):
    """Shared shape for submit-contribution / save-contribution-draft — both
    `{ content: ContributionContent, note?: string (trimmed, <=2000) }`."""

    content: ContributionContent
    note: Optional[str] = Field(default=None, max_length=2000)

    _v_note = field_validator("note")(classmethod(lambda cls, v: v.strip() if v is not None else v))
