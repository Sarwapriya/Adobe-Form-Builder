"""Admin-managed, locale-keyed default copy for the generated form's "page
error" block (Configuration > Access & Locales). Small reference table:
list/upsert/delete only, no soft delete (row presence is the whole record,
same as SubsidiaryPrivacyLink/SubsidiaryProjectBlock)."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.page_error_locale_default import PageErrorLocaleDefault


def list_page_error_locale_defaults(db: Session) -> list[PageErrorLocaleDefault]:
    return list(db.execute(select(PageErrorLocaleDefault).order_by(PageErrorLocaleDefault.localeCode)).scalars().all())


def get_page_error_locale_defaults_map(db: Session) -> dict[str, PageErrorLocaleDefault]:
    """`{localeCode: row}` — what publish_form looks up to auto-fill a
    form's page_error block for each of its locales."""
    rows = list_page_error_locale_defaults(db)
    return {r.localeCode: r for r in rows}


def upsert_page_error_locale_default(
    db: Session, locale_code: str, heading: str, sub_heading: str, sub_heading_url: str, sub_heading_url_text: str
) -> PageErrorLocaleDefault:
    """Creates or replaces the default copy for one locale."""
    existing = db.execute(
        select(PageErrorLocaleDefault).where(PageErrorLocaleDefault.localeCode == locale_code)
    ).scalar_one_or_none()
    if existing is not None:
        existing.heading = heading
        existing.subHeading = sub_heading
        existing.subHeadingUrl = sub_heading_url
        existing.subHeadingUrlText = sub_heading_url_text
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    created = PageErrorLocaleDefault(
        localeCode=locale_code,
        heading=heading,
        subHeading=sub_heading,
        subHeadingUrl=sub_heading_url,
        subHeadingUrlText=sub_heading_url_text,
    )
    db.add(created)
    db.commit()
    db.refresh(created)
    return created


def delete_page_error_locale_default(db: Session, id: str) -> bool:
    existing = db.get(PageErrorLocaleDefault, id)
    if existing is None:
        return False
    db.delete(existing)
    db.commit()
    return True
