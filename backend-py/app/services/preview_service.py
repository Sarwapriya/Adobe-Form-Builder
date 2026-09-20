"""Port of `backend/src/services/previewService.ts`."""

from __future__ import annotations

from typing import Iterable, Literal, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.form_pipeline import BuilderConfig, FileNames, FormDefinition, language_file_names, resolve_file_names
from app.form_pipeline.codegen.types import GeneratedFile as SharedGeneratedFile
from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.generated_file import GeneratedFile as GeneratedFileEntity
from app.services.file_service import absolute_file_path

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
    files: list[SharedGeneratedFile],
    file_names: FileNames,
    variant: PreviewVariant,
    locale: Optional[str] = None,
) -> Optional[str]:
    """Same self-contained-HTML inlining as `build_form_version_preview`
    below, but sourced directly from an in-memory `generate_solution()`
    output rather than on-disk GeneratedFiles rows — for QA runs against
    content that has no GeneratedFiles rows to read yet (a pending
    subsidiary contribution merged onto a form's current draft, or an
    ad-hoc form's own draft while it awaits admin review). Inlines the page
    for `locale` (the form's default language when omitted). Returns `None`
    if the requested variant's HTML wasn't in `files`."""
    language = language_file_names(file_names, locale)
    by_path = {f.path: f for f in files}

    html_file = by_path.get(language.ffHtml if variant == "ff" else language.ocHtml)
    if html_file is None:
        return None

    css_file = by_path.get(language.css)
    data_js_file = by_path.get(file_names.dataJs)
    js_file = by_path.get(language.ffJs if variant == "ff" else language.ocJs)

    html = html_file.contents
    if css_file is not None:
        html = html.replace(f'<link rel="stylesheet" href="{css_file.path}">', f"<style>{css_file.contents}</style>")
    if data_js_file is not None:
        html = html.replace(f'<script src="{data_js_file.path}"></script>', f"<script>{data_js_file.contents}</script>")
    if js_file is not None:
        html = html.replace(f'<script src="{js_file.path}"></script>', f"<script>{js_file.contents}</script>")
    return html


def _published_file_names(version: Optional[FormVersion]) -> Optional[FileNames]:
    """Recomputes the file names a published version was generated with, from
    its own stored definition + config (publish records the config it actually
    generated with, project code included — see form_builder_service.publish_form).
    `None` if they can't be parsed."""
    if version is None:
        return None
    try:
        definition = FormDefinition.model_validate_json(version.definition)
        config = BuilderConfig.model_validate_json(version.config)
    except Exception:  # noqa: BLE001 - a stored row that no longer parses just falls back to file scanning
        return None
    return resolve_file_names(definition, config)


def _referenced_file(
    html: str, candidates: Iterable[GeneratedFileEntity], attr: Literal["href", "src"]
) -> Optional[GeneratedFileEntity]:
    """The candidate the page actually links (`href="<name>"` / `src="<name>"`)
    — robust to however that file happens to be named. Falls back to the first
    candidate by name so a page that somehow references none still renders."""
    ordered = sorted(candidates, key=lambda f: f.fileName)
    for f in ordered:
        if f'{attr}="{f.fileName}"' in html:
            return f
    return ordered[0] if ordered else None


def _find_page(
    files: list[GeneratedFileEntity], names: Optional[FileNames], variant: PreviewVariant
) -> Optional[GeneratedFileEntity]:
    """The default language's page for `variant` among a published version's stored
    files, or `None` if it has none."""
    if names is not None:
        expected = names.ffHtml if variant == "ff" else names.ocHtml
        hit = next((f for f in files if f.fileName == expected and f.fileType == "html"), None)
        if hit is not None:
            return hit
    # A version published before per-language files existed has exactly one page per variant
    # under the old name (which the recomputed names above won't match) — pick
    # deterministically among whatever pages exist.
    suffix = "_FF" if variant == "ff" else "_OC"
    pages = sorted(
        (f for f in files if f.fileType == "html" and f.fileName.endswith(f"{suffix}.html")),
        key=lambda f: f.fileName,
    )
    return pages[0] if pages else None


def _companion_files(
    html_file: GeneratedFileEntity, html: str, files: list[GeneratedFileEntity]
) -> tuple[Optional[GeneratedFileEntity], Optional[GeneratedFileEntity], Optional[GeneratedFileEntity]]:
    """`(behavior JS, stylesheet, data file)` for a page. The behavior JS shares the page's
    base name (`X_FF.html` <-> `X_FF.js`); the stylesheet and data file are whichever ones the
    page itself links."""
    js_name = html_file.fileName[: -len(".html")] + ".js"
    js_file = next((f for f in files if f.fileName == js_name), None)
    css_file = _referenced_file(html, (f for f in files if f.fileType == "css"), "href")
    data_js_file = _referenced_file(html, (f for f in files if f.fileType == "data-js"), "src")
    return js_file, css_file, data_js_file


def build_form_version_preview(
    db: Session, form_id: str, variant: PreviewVariant, strict: bool = False
) -> dict:
    """Builds a single self-contained HTML document for a Form's *published*
    FormVersion — its default language's page (a form now has one page per
    language, see file_names.py). Only ever serves a currently-published form
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

    names = _published_file_names(db.get(FormVersion, form.publishedVersionId))

    requested_html = _find_page(files, names, variant)
    fallback_variant: PreviewVariant = "oc" if variant == "ff" else "ff"
    html_file = requested_html if requested_html is not None else (None if strict else _find_page(files, names, fallback_variant))
    if html_file is None:
        return {"outcome": "no_files"}

    html = _read_generated_file(html_file)
    js_file, css_file, data_js_file = _companion_files(html_file, html, files)

    css = _read_generated_file(css_file) if css_file is not None else ""
    data_js = _read_generated_file(data_js_file) if data_js_file is not None else ""
    behavior_js = _read_generated_file(js_file) if js_file is not None else ""

    inlined = _inline_script(
        _inline_script(_inline_link(html, css_file, css), data_js_file, data_js), js_file, behavior_js
    )

    return {"outcome": "ok", "html": inlined}
