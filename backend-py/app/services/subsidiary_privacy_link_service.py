"""Admin-managed subsidiary+locale -> Privacy Policy URL lookup (Configuration
> Access & Locales) — see `models/subsidiary_privacy_link.py`'s own doc
comment for why this exists. Small reference table: list/upsert/delete only,
no soft delete (row presence is the whole record, same as
`SubsidiaryProjectBlock`)."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.subsidiary_privacy_link import SubsidiaryPrivacyLink


def list_privacy_links(db: Session) -> list[SubsidiaryPrivacyLink]:
    """Every row, admin management view."""
    return list(
        db.execute(select(SubsidiaryPrivacyLink).order_by(SubsidiaryPrivacyLink.subsidiaryName, SubsidiaryPrivacyLink.localeCode)).scalars().all()
    )


def get_privacy_links_for_subsidiary(db: Session, subsidiary_name: str) -> dict[str, str]:
    """`{localeCode: url}` for one subsidiary — what the form builder looks
    up to auto-fill the Privacy Policy consent's Link URL."""
    rows = db.execute(
        select(SubsidiaryPrivacyLink).where(SubsidiaryPrivacyLink.subsidiaryName == subsidiary_name)
    ).scalars().all()
    return {r.localeCode: r.url for r in rows}


def upsert_privacy_link(db: Session, subsidiary_name: str, locale_code: str, url: str) -> SubsidiaryPrivacyLink:
    """Creates or replaces the URL for one (subsidiary, locale) pair."""
    existing = db.execute(
        select(SubsidiaryPrivacyLink).where(
            SubsidiaryPrivacyLink.subsidiaryName == subsidiary_name,
            SubsidiaryPrivacyLink.localeCode == locale_code,
        )
    ).scalar_one_or_none()
    if existing is not None:
        existing.url = url
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    created = SubsidiaryPrivacyLink(subsidiaryName=subsidiary_name, localeCode=locale_code, url=url)
    db.add(created)
    db.commit()
    db.refresh(created)
    return created


def delete_privacy_link(db: Session, id: str) -> bool:
    existing = db.get(SubsidiaryPrivacyLink, id)
    if existing is None:
        return False
    db.delete(existing)
    db.commit()
    return True
