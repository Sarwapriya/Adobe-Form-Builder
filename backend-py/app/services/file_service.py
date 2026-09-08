"""Port of the FormVersion-generated-output half of `backend/src/services/
fileService.ts`, plus the Question-Master file helpers (`questionMasterDir`,
`saveQuestionMasterFile`) and the QA-report path helper (`formQaStorageDir`).
"""

from __future__ import annotations

import os
from dataclasses import dataclass

from app.config import settings
from app.form_pipeline import GeneratedFile
from app.utils.sanitize import sanitize_subsidiary_id


def get_upload_dir() -> str:
    return settings.UPLOAD_DIR


def absolute_file_path(relative_path: str) -> str:
    return os.path.join(get_upload_dir(), relative_path)


def form_version_generated_dir(subsidiary_id: str, form_version_id: str) -> str:
    """Directory (relative to UPLOAD_DIR) holding one FormVersion's generated
    solution files, keyed by the FormVersion's own id (not the parent Form's)
    since a publish clones a fresh draft version and each published version
    keeps its own independent output on disk."""
    return os.path.join(sanitize_subsidiary_id(subsidiary_id), "forms", form_version_id, "generated")


@dataclass
class SavedGeneratedFile:
    fileName: str
    relativePath: str


def save_form_version_generated_files(
    subsidiary_id: str, form_version_id: str, files: list[GeneratedFile]
) -> list[SavedGeneratedFile]:
    """Writes every generated solution file to one FormVersion's generated/
    directory."""
    generated_dir = form_version_generated_dir(subsidiary_id, form_version_id)
    absolute_dir = absolute_file_path(generated_dir)
    os.makedirs(absolute_dir, exist_ok=True)

    saved: list[SavedGeneratedFile] = []
    for file in files:
        relative_path = os.path.join(generated_dir, file.path)
        with open(absolute_file_path(relative_path), "w", encoding="utf-8", newline="") as f:
            f.write(file.contents)
        saved.append(SavedGeneratedFile(fileName=file.path, relativePath=relative_path))
    return saved


def form_qa_storage_dir(subsidiary_id: str, form_id: str) -> str:
    """Directory (relative to UPLOAD_DIR) holding a QA run's downloadable
    HTML report for one Configuration form — keyed by the Form's own id
    (not a FormVersion's), since a QA run against a pending contribution or
    an ad-hoc draft never produces a FormVersion/GeneratedFiles row to key
    off of in the first place."""
    return os.path.join(sanitize_subsidiary_id(subsidiary_id), "forms", form_id, "qa")


def question_master_dir(project_code: str, id: str) -> str:
    """Directory (relative to UPLOAD_DIR) holding one Question Master version's
    generated .xlsx — keyed by the QuestionMasterVersion row's own id, not its
    version number, since the version number is only known once the locked
    transaction that assigns it commits, but the id can be minted upfront (see
    question_master_service.generate_question_master). Nested under the
    (sanitized) project code purely for human-browsable organization on disk.
    Reuses sanitize_subsidiary_id as a generic path-segment sanitizer — a
    project code is just as free-text/attacker-influenceable as a
    subsidiaryId route param, and the same safe character set applies."""
    return os.path.join("question-master", sanitize_subsidiary_id(project_code), id)


def save_question_master_file(project_code: str, id: str, data: bytes) -> str:
    """Writes one Question Master version's .xlsx bytes to disk. Returns the
    path relative to UPLOAD_DIR, as stored in QuestionMasterVersions.filePath."""
    relative_path = os.path.join(question_master_dir(project_code, id), "question-master.xlsx")
    absolute_path = absolute_file_path(relative_path)
    os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
    with open(absolute_path, "wb") as f:
        f.write(data)
    return relative_path
