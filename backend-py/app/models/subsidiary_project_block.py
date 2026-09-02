"""Port of `backend/src/entities/SubsidiaryProjectBlock.ts`."""

from __future__ import annotations

from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import Mapped

from app.models.base import Base, datetimeoffset_now, nvarchar, uuid_pk


class SubsidiaryProjectBlock(Base):
    __tablename__ = "SubsidiaryProjectBlocks"
    __table_args__ = (
        UniqueConstraint("subsidiaryName", "projectCode", name="UQ_SubsidiaryProjectBlocks_pair"),
    )

    id: Mapped[str] = uuid_pk()
    subsidiaryName: Mapped[str] = nvarchar(100)
    projectCode: Mapped[str] = nvarchar(100)
    createdAt = datetimeoffset_now()
