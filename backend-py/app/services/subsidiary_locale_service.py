"""Port of `backend/src/services/subsidiaryLocaleService.ts`."""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from app.errors import ConflictError
from app.models.subsidiary_locale import SubsidiaryLocale


def list_all_subsidiary_locales(db: Session) -> list[SubsidiaryLocale]:
    """Every master locale row, every subsidiary — the admin management
    view."""
    return list(
        db.execute(
            select(SubsidiaryLocale).order_by(
                SubsidiaryLocale.subsidiaryName.asc(), SubsidiaryLocale.sortOrder.asc()
            )
        ).scalars().all()
    )


def list_subsidiary_locales(db: Session, subsidiary_name: str) -> list[SubsidiaryLocale]:
    """One subsidiary's own allowed locale list, fallback first."""
    return list(
        db.execute(
            select(SubsidiaryLocale)
            .where(SubsidiaryLocale.subsidiaryName == subsidiary_name)
            .order_by(SubsidiaryLocale.isFallback.desc(), SubsidiaryLocale.sortOrder.asc())
        ).scalars().all()
    )


@dataclass
class CreateSubsidiaryLocaleInput:
    subsidiaryName: str
    code: str
    langSubtag: str
    isRtl: bool
    label: str
    isFallback: bool


def add_subsidiary_locale(db: Session, input: CreateSubsidiaryLocaleInput) -> SubsidiaryLocale:
    """Adds one locale to a subsidiary's master list. Rejects an
    exact-duplicate code for that subsidiary with a `ConflictError`. When
    `isFallback` is true, first clears any other fallback for this
    subsidiary — exactly one row per subsidiary is the designated
    fallback (enforced here, not the DB)."""
    existing = db.execute(
        select(SubsidiaryLocale).where(
            SubsidiaryLocale.subsidiaryName == input.subsidiaryName, SubsidiaryLocale.code == input.code
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError(f'"{input.code}" is already on {input.subsidiaryName}\'s locale list')

    if input.isFallback:
        db.execute(
            update(SubsidiaryLocale)
            .where(SubsidiaryLocale.subsidiaryName == input.subsidiaryName)
            .values(isFallback=False)
        )

    count = db.execute(
        select(func.count()).select_from(SubsidiaryLocale).where(
            SubsidiaryLocale.subsidiaryName == input.subsidiaryName
        )
    ).scalar_one()

    created = SubsidiaryLocale(
        subsidiaryName=input.subsidiaryName,
        code=input.code,
        langSubtag=input.langSubtag,
        isRtl=input.isRtl,
        label=input.label,
        isFallback=input.isFallback,
        sortOrder=count,
    )
    db.add(created)
    db.commit()
    db.refresh(created)
    return created


def remove_subsidiary_locale(db: Session, id: str) -> bool:
    """Removes one locale from a subsidiary's master list. Returns `False`
    if it didn't exist — callers map that to a 404."""
    result = db.execute(delete(SubsidiaryLocale).where(SubsidiaryLocale.id == id))
    db.commit()
    return (result.rowcount or 0) > 0
