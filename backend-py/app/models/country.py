"""Admin-managed picklist of countries (`fq.Countries`), each with a real ISO
3166-1 alpha-2 code and a locally bundled flag SVG asset — the source data a
`Subsidiary` is mapped to via `SubsidiaryCountry`, and what the dynamic
circular logo generator (`subsidiary_logo_service.py`) draws flags from.

`flagAssetPath` is a path relative to the backend's static mount (e.g.
"flags/ae.svg", served at `/static/flags/ae.svg`), not a DB blob — flags are
committed, build-time assets (see `backend-py/app/static/flags/`), never
user-uploaded at runtime."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, datetimeoffset_now, nvarchar, uuid_pk


class Country(Base):
    __tablename__ = "Countries"

    id: Mapped[str] = uuid_pk()
    isoCode: Mapped[str] = nvarchar(2, unique=True)
    countryName: Mapped[str] = nvarchar(100)
    flagAssetPath: Mapped[Optional[str]] = nvarchar(255, nullable=True)
    isActive: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    createdAt = datetimeoffset_now()
    updatedAt = datetimeoffset_now()
