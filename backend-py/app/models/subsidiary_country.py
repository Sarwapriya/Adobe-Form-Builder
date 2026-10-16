"""Many-to-many join between `Subsidiary` and `Country` (`fq.SubsidiaryCountries`)
— which countries a subsidiary's forms/logo cover, admin-managed via
`subsidiary_service.set_subsidiary_countries`. Unlike `SubsidiaryProjectBlock`/
`SubsidiaryPrivacyLink` (which snapshot a subsidiary *name* as a loose text
reference), this is a genuine junction table keyed by id, matching the
product spec's own `SubsidiaryId`/`CountryId` shape — still no DB-level
`FOREIGN KEY` constraint though, consistent with every other table in this
schema (`uuid_col`'s own doc comment); integrity is enforced by the unique
pair constraint below plus application-level validation in the service
layer, not a cross-table FK."""

from __future__ import annotations

from sqlalchemy import Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, datetimeoffset_now, uuid_col, uuid_pk


class SubsidiaryCountry(Base):
    __tablename__ = "SubsidiaryCountries"
    __table_args__ = (
        UniqueConstraint("subsidiaryId", "countryId", name="UQ_SubsidiaryCountries_pair"),
    )

    id: Mapped[str] = uuid_pk()
    subsidiaryId: Mapped[str] = uuid_col()
    countryId: Mapped[str] = uuid_col()
    sortOrder: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    createdAt = datetimeoffset_now()
    updatedAt = datetimeoffset_now()
