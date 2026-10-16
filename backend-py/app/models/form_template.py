"""A reusable, saved form-builder configuration (`fq.FormTemplates`) that a
new campaign can be started from instead of a blank form — see
`app/services/form_template_service.py` and `app/routers/templates.py`.

Stores the full `FormDefinition`/`BuilderConfig` as JSON text, the same shape
`FormVersion.definition`/`.config` and `AIFormProposal.proposalJson` already
use for "the entire builder configuration" rather than normalizing questions/
answers into rows.

`scope` ("USER"|"SUBSIDIARY"|"GLOBAL") controls who can *see/use* a template;
`createdByUserId` is who *owns* it (only the owner or a superadmin may edit/
delete it, regardless of scope — see the router for that check). `subsidiaryName`
is a text snapshot of a subsidiary's name, the same loose-reference convention
`SubsidiaryPrivacyLink`/`SubsidiaryProjectBlock` already use (not a foreign key) —
set for every standard user's template (their own subsidiary, for display/
audit) and for an admin's SUBSIDIARY-scoped template (the chosen target); left
`None` for GLOBAL and personal USER-scoped templates.

Soft-deleted via `isDeleted`, same convention as every other "Delete" in this
app — a template that's been deleted never shows up in a list, but a form
already created from it is untouched (it only ever copied the content, never
referenced the template row afterwards)."""

from __future__ import annotations

from typing import Literal, Optional

from sqlalchemy import Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import (
    Base,
    datetimeoffset_now,
    nvarchar,
    nvarchar_max,
    uuid_col,
    uuid_pk,
)

TemplateScope = Literal["USER", "SUBSIDIARY", "GLOBAL"]


class FormTemplate(Base):
    __tablename__ = "FormTemplates"

    id: Mapped[str] = uuid_pk()
    name: Mapped[str] = nvarchar(200)
    description: Mapped[Optional[str]] = nvarchar(2000, nullable=True)
    category: Mapped[Optional[str]] = nvarchar(100, nullable=True)
    definitionJson: Mapped[str] = nvarchar_max()
    configJson: Mapped[str] = nvarchar_max()
    scope: Mapped[TemplateScope] = nvarchar(20, default="USER")
    subsidiaryName: Mapped[Optional[str]] = nvarchar(100, nullable=True)
    # Loose reference, not an enforced foreign key — same convention every
    # other *UserId column in this codebase already uses (see uuid_col's own
    # doc comment).
    createdByUserId: Mapped[str] = uuid_col()
    updatedByUserId: Mapped[Optional[str]] = uuid_col(nullable=True)
    createdAt = datetimeoffset_now()
    updatedAt = datetimeoffset_now()
    isDeleted: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
