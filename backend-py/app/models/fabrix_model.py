"""Port of `backend/src/entities/FabrixModel.ts`."""

from __future__ import annotations

from sqlalchemy import Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, datetimeoffset_now, nvarchar, uuid_pk


class FabrixModel(Base):
    __tablename__ = "FabrixModels"

    id: Mapped[str] = uuid_pk()
    name: Mapped[str] = nvarchar(100)
    modelId: Mapped[str] = nvarchar(100)
    isEnabled: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    sortOrder: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    createdAt = datetimeoffset_now()
