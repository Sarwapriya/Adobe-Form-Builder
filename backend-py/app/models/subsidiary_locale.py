"""Port of `backend/src/entities/SubsidiaryLocale.ts`."""

from __future__ import annotations

from sqlalchemy import Boolean, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, datetimeoffset_now, nvarchar, uuid_pk


class SubsidiaryLocale(Base):
    __tablename__ = "SubsidiaryLocales"
    __table_args__ = (
        UniqueConstraint("subsidiaryName", "code", name="UQ_SubsidiaryLocales_pair"),
    )

    id: Mapped[str] = uuid_pk()
    subsidiaryName: Mapped[str] = nvarchar(100)
    code: Mapped[str] = nvarchar(20)
    langSubtag: Mapped[str] = nvarchar(10)
    isRtl: Mapped[bool] = mapped_column(Boolean)
    label: Mapped[str] = nvarchar(100)
    isFallback: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    sortOrder: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    createdAt = datetimeoffset_now()
