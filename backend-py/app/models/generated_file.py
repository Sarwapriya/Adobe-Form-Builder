"""Port of `backend/src/entities/GeneratedFile.ts`.

One generated output file, owned by a `FormVersion` (`uploadId` is a leftover
nullable column from the removed Excel-upload feature — never populated by
any surviving code path; `formVersionId` is the real owner now).
"""

from __future__ import annotations

from typing import Literal, Optional

from sqlalchemy.orm import Mapped

from app.models.base import Base, datetimeoffset_now, datetimeoffset_nullable, nvarchar, uuid_col, uuid_pk

GeneratedFileType = Literal["html", "js", "css", "data-js"]


class GeneratedFile(Base):
    __tablename__ = "GeneratedFiles"

    id: Mapped[str] = uuid_pk()
    uploadId: Mapped[Optional[str]] = uuid_col(nullable=True)
    formVersionId: Mapped[Optional[str]] = uuid_col(nullable=True)
    fileName: Mapped[str] = nvarchar(255)
    filePath: Mapped[str] = nvarchar(2000)
    fileType: Mapped[GeneratedFileType] = nvarchar(20)
    createdAt = datetimeoffset_now()
    # Null until an admin hand-edits this file's on-disk content from the
    # Edit Files window (form_builder_service.update_generated_file_content)
    # — every other reader (preview_service, build_form_zip, deploy_form)
    # keeps reading the same file path regardless, so an edit needs no
    # further wiring anywhere else.
    editedAt: Mapped[Optional[object]] = datetimeoffset_nullable()
    editedByUserId: Mapped[Optional[str]] = uuid_col(nullable=True)
