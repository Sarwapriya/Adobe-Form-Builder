"""Admin-managed reference table of each subsidiary's Google reCAPTCHA v2
site key (one key per subsidiary — reCAPTCHA site keys are domain-scoped,
not language-scoped, unlike SubsidiaryPrivacyLink's subsidiary+locale pair).
Lets a form's builder UI toggle reCAPTCHA on without a user having to type a
site key by hand. Row presence is the whole record; there is nothing else to
soft-delete here, same as SubsidiaryPrivacyLink."""

from __future__ import annotations

from sqlalchemy.orm import Mapped

from app.models.base import Base, datetimeoffset_now, nvarchar, uuid_pk


class SubsidiaryRecaptchaConfig(Base):
    __tablename__ = "SubsidiaryRecaptchaConfigs"

    id: Mapped[str] = uuid_pk()
    subsidiaryName: Mapped[str] = nvarchar(100, unique=True)
    siteKey: Mapped[str] = nvarchar(200)
    createdAt = datetimeoffset_now()
