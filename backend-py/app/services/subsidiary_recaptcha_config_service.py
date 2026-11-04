"""Admin-managed subsidiary -> Google reCAPTCHA site key lookup (Configuration
> Access & Locales) — see `models/subsidiary_recaptcha_config.py`'s own doc
comment for why this exists. Small reference table: list/upsert/delete only,
no soft delete (row presence is the whole record, same as
`SubsidiaryPrivacyLink`)."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.subsidiary_recaptcha_config import SubsidiaryRecaptchaConfig


def list_recaptcha_configs(db: Session) -> list[SubsidiaryRecaptchaConfig]:
    """Every row, admin management view."""
    return list(db.execute(select(SubsidiaryRecaptchaConfig).order_by(SubsidiaryRecaptchaConfig.subsidiaryName)).scalars().all())


def get_site_key_for_subsidiary(db: Session, subsidiary_name: str) -> Optional[str]:
    """The configured site key for one subsidiary, or None if it has none —
    what `form_builder_service._resolve_recaptcha_site_key` resolves onto
    `BuilderConfig.reCaptchaSiteKey` at generation time."""
    row = db.execute(
        select(SubsidiaryRecaptchaConfig).where(SubsidiaryRecaptchaConfig.subsidiaryName == subsidiary_name)
    ).scalar_one_or_none()
    return row.siteKey if row is not None else None


def upsert_recaptcha_config(db: Session, subsidiary_name: str, site_key: str) -> SubsidiaryRecaptchaConfig:
    """Creates or replaces the site key for one subsidiary."""
    existing = db.execute(
        select(SubsidiaryRecaptchaConfig).where(SubsidiaryRecaptchaConfig.subsidiaryName == subsidiary_name)
    ).scalar_one_or_none()
    if existing is not None:
        existing.siteKey = site_key
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    created = SubsidiaryRecaptchaConfig(subsidiaryName=subsidiary_name, siteKey=site_key)
    db.add(created)
    db.commit()
    db.refresh(created)
    return created


def delete_recaptcha_config(db: Session, id: str) -> bool:
    existing = db.get(SubsidiaryRecaptchaConfig, id)
    if existing is None:
        return False
    db.delete(existing)
    db.commit()
    return True
