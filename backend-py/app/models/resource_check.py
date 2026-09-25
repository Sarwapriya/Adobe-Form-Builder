"""Post-deployment availability checks of a published form's files on the
Adobe Campaign frontal servers (`fq.ResourceChecks` / `fq.ResourceCheckResults`).

One `ResourceCheck` row per check run: scheduled automatically a configurable
delay after a successful SFTP deploy (`trigger="scheduled"`), re-scheduled
once more if that fails (`trigger="recheck"`), or started from the form page's
"Check now" (`trigger="manual"`). Each run stores one `ResourceCheckResult`
per (file, server) URL. See app/services/resource_check_service.py.
"""

from __future__ import annotations

from typing import Literal, Optional

from sqlalchemy import Boolean, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import (
    Base,
    datetimeoffset_now,
    datetimeoffset_nullable,
    datetimeoffset_required,
    nvarchar,
    nvarchar_max,
    uuid_col,
    uuid_pk,
)

ResourceCheckTrigger = Literal["scheduled", "recheck", "manual"]
ResourceCheckStatus = Literal["scheduled", "running", "passed", "failed", "error"]


class ResourceCheck(Base):
    __tablename__ = "ResourceChecks"

    id: Mapped[str] = uuid_pk()
    formId: Mapped[str] = uuid_col()
    formVersionId: Mapped[str] = uuid_col()
    trigger: Mapped[ResourceCheckTrigger] = nvarchar(20)
    status: Mapped[ResourceCheckStatus] = nvarchar(20, default="scheduled")
    scheduledFor = datetimeoffset_required()
    startedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
    completedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
    # JSON arrays, captured when the check is created so a later publish or a
    # settings change can't alter what this run means.
    fileNames: Mapped[str] = nvarchar_max()
    hosts: Mapped[str] = nvarchar_max()
    totalUrls: Mapped[int] = mapped_column(Integer, default=0)
    okUrls: Mapped[int] = mapped_column(Integer, default=0)
    failedUrls: Mapped[int] = mapped_column(Integer, default=0)
    triggeredByUserId: Mapped[Optional[str]] = uuid_col(nullable=True)
    errorMessage: Mapped[Optional[str]] = nvarchar(2000, nullable=True)
    notifiedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
    createdAt = datetimeoffset_now()


class ResourceCheckResult(Base):
    __tablename__ = "ResourceCheckResults"

    id: Mapped[str] = uuid_pk()
    checkId: Mapped[str] = uuid_col()
    fileName: Mapped[str] = nvarchar(260)
    host: Mapped[str] = nvarchar(255)
    url: Mapped[str] = nvarchar(1000)
    statusCode: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ok: Mapped[bool] = mapped_column(Boolean, default=False)
    elapsedMs: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    error: Mapped[Optional[str]] = nvarchar(500, nullable=True)
