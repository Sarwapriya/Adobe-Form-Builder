"""Port of `backend/src/services/generationService.ts` (just the surviving
`classifyFileType` helper — the Excel-upload half of the original file was
removed from the Node codebase)."""

from __future__ import annotations

from typing import Literal

from app.form_pipeline import FileNames

GeneratedFileType = Literal["html", "js", "css", "data-js"]


def classify_file_type(path: str, file_names: FileNames) -> GeneratedFileType:
    """Maps a generated file's path to the GeneratedFiles.fileType column
    value, by comparing against the exact names `resolve_file_names` computed
    for this form — more robust than guessing from the file extension alone,
    since both the data file and the per-language behavior scripts all end in
    '.js'. There is one stylesheet and one HTML/behavior-JS set per language,
    so any of the languages' names counts."""
    if any(path == language.css for language in file_names.languages):
        return "css"
    if path == file_names.dataJs:
        return "data-js"
    return "html" if path.endswith(".html") else "js"
