"""Port of `backend/src/entities/OtherAiModel.ts`."""

from __future__ import annotations

from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, datetimeoffset_now, nvarchar, uuid_pk


class OtherAiModel(Base):
    __tablename__ = "OtherAiModels"

    id: Mapped[str] = uuid_pk()
    name: Mapped[str] = nvarchar(100)
    modelId: Mapped[str] = nvarchar(100)
    sortOrder: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    createdAt = datetimeoffset_now()
