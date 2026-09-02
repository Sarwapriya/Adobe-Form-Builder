"""Port of `backend/src/services/previewService.ts`."""

from __future__ import annotations

from typing import Literal, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.form_pipeline import FileNames
from app.form_pipeline.codegen.types import GeneratedFile as SharedGeneratedFile
from app.models.form import Form
from app.models.generated_file import GeneratedFile as GeneratedFileEntity
from app.services.file_service import absolute_file_path
from app.services.generation_service import classify_file_type

PreviewVariant = Literal["ff", "oc"]
PreviewOutcome = Literal["not_found", "no_files", "ok"]


def _read_generated_file(file: GeneratedFileEntity) -> str:
    with open(absolute_file_path(file.filePath), "r", encoding="utf-8", newline="") as f:
        return f.read()


def _inline_link(html: str, file: Optional[GeneratedFileEntity], contents: str) -> str:
    """Replaces a `<link>` tag referencing `file` with an inline equivalent
    carrying `contents` — a no-op if `file` is `None`."""
    if file is None:
        return html
    return html.replace(f'<link rel="stylesheet" href="{file.fileName}">', f"<style>{contents}</style>")


def _inline_script(html: str, file: Optional[GeneratedFileEntity], contents: str) -> str:
    if file is None:
        return html
    return html.replace(f'<script src="{file.fileName}"></script>', f"<script>{contents}</script>")


def inline_generated_files(
    files: list[SharedGeneratedFile], file_names: FileNames, variant: PreviewVariant
) -> Optional[str]:
    """Same self-contained-HTML inlining as `build_form_version_preview`
    below, but sourced directly from an in-memory `generate_solution()`
    output rather than on-disk GeneratedFiles rows — for QA runs against
    content that has no GeneratedFiles rows to read yet (a pending
    subsidiary contribution merged onto a form's current draft, or an
    ad-hoc form's own draft while it awaits admin review). Returns `None` if
    the requested variant's HTML wasn't in `files`."""
    suffix = "_FF" if variant == "ff" else "_OC"
    html_file = next(
        (f for f in files if classify_file_type(f.path, file_names) == "html" and f.path.endswith(f"{suffix}.html")),
        None,
    )
    if html_file is None:
        return None

    css_file = next((f for f in files if classify_file_type(f.path, file_names) == "css"), None)
    data_js_file = next((f for f in files if classify_file_type(f.path, file_names) == "data-js"), None)
    js_file = next(
        (f for f in files if classify_file_type(f.path, file_names) == "js" and f.path.endswith(f"{suffix}.js")),
        None,
    )

    html = html_file.contents
    if css_file is not None:
        html = html.replace(f'<link rel="stylesheet" href="{css_file.path}">', f"<style>{css_file.contents}</style>")
    if data_js_file is not None:
        html = html.replace(f'<script src="{data_js_file.path}"></script>', f"<script>{data_js_file.contents}</script>")
    if js_file is not None:
        html = html.replace(f'<script src="{js_file.path}"></script>', f"<script>{js_file.contents}</script>")
    return html


def build_form_version_preview(
    db: Session, form_id: str, variant: PreviewVariant, strict: bool = False
) -> dict:
    """Builds a single self-contained HTML document for a Form's *published*
    FormVersion. Only ever serves a currently-published form
    (`status == "published"`) — an unpublished form's previously-generated
    files stay on disk but become unreachable here, reversible by
    re-publishing.

    Returns `{"outcome": ..., "html": ...}` — `html` present only when
    `outcome == "ok"`.
    """
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None or form.status != "published" or not form.publishedVersionId:
        return {"outcome": "not_found"}

    files = list(
        db.execute(
            select(GeneratedFileEntity).where(GeneratedFileEntity.formVersionId == form.publishedVersionId)
        ).scalars()
    )
    if not files:
        return {"outcome": "no_files"}

    def suffix_for(v: PreviewVariant) -> str:
        return "_FF" if v == "ff" else "_OC"

    def find_html(v: PreviewVariant) -> Optional[GeneratedFileEntity]:
        return next((f for f in files if f.fileType == "html" and f.fileName.endswith(f"{suffix_for(v)}.html")), None)

    requested_html = find_html(variant)
    fallback_variant: PreviewVariant = "oc" if variant == "ff" else "ff"
    html_file = requested_html if requested_html is not None else (None if strict else find_html(fallback_variant))
    resolved_variant = variant if requested_html is not None else fallback_variant
    if html_file is None:
        return {"outcome": "no_files"}

    suffix = suffix_for(resolved_variant)
    js_file = next((f for f in files if f.fileType == "js" and f.fileName.endswith(f"{suffix}.js")), None)
    css_file = next((f for f in files if f.fileType == "css"), None)
    data_js_file = next((f for f in files if f.fileType == "data-js"), None)

    html = _read_generated_file(html_file)
    css = _read_generated_file(css_file) if css_file is not None else ""
    data_js = _read_generated_file(data_js_file) if data_js_file is not None else ""
    behavior_js = _read_generated_file(js_file) if js_file is not None else ""

    inlined = _inline_script(
        _inline_script(_inline_link(html, css_file, css), data_js_file, data_js), js_file, behavior_js
    )

    return {"outcome": "ok", "html": inlined}
