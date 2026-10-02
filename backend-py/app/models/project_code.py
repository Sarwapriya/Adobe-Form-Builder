"""Port of `backend/src/entities/ProjectCode.ts`."""

from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean, Date
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, datetimeoffset_now, nvarchar, uuid_pk


class ProjectCode(Base):
    __tablename__ = "ProjectCodes"

    id: Mapped[str] = uuid_pk()
    code: Mapped[str] = nvarchar(100, unique=True)
    isOpen: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    isLocked: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    # "adhoc" (default — open to subsidiary self-service campaigns, same
    # behavior every project code had before this column existed) or
    # "handRaiser" (reserved for HR Form Initiator/admin-authored campaigns —
    # a non-admin can't attach a new campaign to one, see
    # project_code_service.assert_project_code_open's exclude_hand_raiser).
    category: Mapped[str] = nvarchar(20, default="adhoc")
    startDate: Mapped[Optional[object]] = mapped_column(Date, nullable=True, default=None)
    endDate: Mapped[Optional[object]] = mapped_column(Date, nullable=True, default=None)
    cutoffDate: Mapped[Optional[object]] = mapped_column(Date, nullable=True, default=None)
    createdAt = datetimeoffset_now()
