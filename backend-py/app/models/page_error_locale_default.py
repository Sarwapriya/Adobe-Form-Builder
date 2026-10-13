"""Admin-managed, locale-keyed default copy for the generated form's "page
error" block (`page_error[locale].hrErr` in the master data JS file — the
content shown if the page fails to load/initialize correctly). Previously
left blank by FormDefinition's own per-form `pageError` field (no builder UI
ever set it), so admins were hand-editing the generated file after every
publish to fill in the real regional copy. Injected automatically at publish
time instead — see form_builder_service.publish_form. Purely locale-keyed
(not subsidiary-keyed): the content is the same for every form at a given
locale regardless of which subsidiary that locale happens to belong to."""

from __future__ import annotations

from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import Mapped

from app.models.base import Base, datetimeoffset_now, nvarchar, uuid_pk


class PageErrorLocaleDefault(Base):
    __tablename__ = "PageErrorLocaleDefaults"
    __table_args__ = (UniqueConstraint("localeCode", name="UQ_PageErrorLocaleDefaults_localeCode"),)

    id: Mapped[str] = uuid_pk()
    localeCode: Mapped[str] = nvarchar(20)
    heading: Mapped[str] = nvarchar(500)
    subHeading: Mapped[str] = nvarchar(1000)
    subHeadingUrl: Mapped[str] = nvarchar(1000)
    subHeadingUrlText: Mapped[str] = nvarchar(200)
    createdAt = datetimeoffset_now()
