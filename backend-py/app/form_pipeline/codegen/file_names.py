"""Port of packages/shared/src/codegen/fileNames.ts.

Single source of truth for generated output file names, so the HTML's
`<link>`/`<script src>` references, the zip's actual file paths, and the live
preview's inline-substitution lookups can never drift apart.
"""

from __future__ import annotations

import re

from pydantic import BaseModel

from ..form.definition import FormDefinition
from .types import BuilderConfig

_SANITIZE_RE = re.compile(r"[^a-zA-Z0-9_-]+")
_TRIM_DASH_RE = re.compile(r"^-+|-+$")


class FileNames(BaseModel):
    # The bare `{subsidiary}-{LANG}` (or override) prefix all other names derive from.
    prefix: str
    css: str
    dataJs: str
    ffJs: str
    ocJs: str
    ffHtml: str
    ocHtml: str


def _sanitize(s: str) -> str:
    replaced = _SANITIZE_RE.sub("-", s)
    return _TRIM_DASH_RE.sub("", replaced)


def _resolve_prefix(form: FormDefinition, config: BuilderConfig) -> str:
    override = (config.fileNamePrefix or "").strip()
    if override:
        return _sanitize(override)

    default_locale_info = next((l for l in form.locales if l.code == form.meta.defaultLocale), None)
    lang = (default_locale_info.langSubtag if default_locale_info else "en").upper()
    subsidiary = form.meta.subsidiary.strip()
    return _sanitize(f"{subsidiary}-{lang}" if subsidiary else lang)


def resolve_file_names(form: FormDefinition, config: BuilderConfig) -> FileNames:
    prefix = _resolve_prefix(form, config)

    return FileNames(
        prefix=prefix,
        css=f"{prefix}.css",
        dataJs=f"{prefix}.js",
        ffJs=f"{prefix}_FF.js",
        ocJs=f"{prefix}_OC.js",
        ffHtml=f"{prefix}_FF.html",
        ocHtml=f"{prefix}_OC.html",
    )
