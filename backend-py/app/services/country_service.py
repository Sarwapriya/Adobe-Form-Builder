"""Admin-managed picklist of countries (`fq.Countries`) that subsidiaries are
mapped to. No authorization logic here — the router decides who may call
the write functions, matching `subsidiary_privacy_link_service.py`'s
convention."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.errors import ConflictError
from app.models.country import Country


def _now() -> datetime:
    return datetime.now(timezone.utc)


def list_active_countries(db: Session) -> list[Country]:
    return list(
        db.execute(
            select(Country).where(Country.isActive == True).order_by(Country.countryName.asc())  # noqa: E712
        ).scalars().all()
    )


def list_all_countries(db: Session) -> list[Country]:
    return list(db.execute(select(Country).order_by(Country.countryName.asc())).scalars().all())


def get_countries_by_ids(db: Session, ids: list[str]) -> list[Country]:
    if not ids:
        return []
    return list(db.execute(select(Country).where(Country.id.in_(ids))).scalars().all())


def create_country(db: Session, iso_code: str, country_name: str, flag_asset_path: Optional[str] = None) -> Country:
    iso_code = iso_code.strip().upper()
    country_name = country_name.strip()

    existing = db.execute(
        select(Country).where(func.upper(Country.isoCode) == iso_code)
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError(f'Country "{iso_code}" already exists')

    created = Country(isoCode=iso_code, countryName=country_name, flagAssetPath=flag_asset_path)
    db.add(created)
    db.commit()
    db.refresh(created)
    return created


def set_country_active(db: Session, id: str, is_active: bool) -> Optional[Country]:
    existing = db.get(Country, id)
    if existing is None:
        return None
    existing.isActive = is_active
    existing.updatedAt = _now()
    db.add(existing)
    db.commit()
    db.refresh(existing)
    return existing
