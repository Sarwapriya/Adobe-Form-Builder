"""Port of packages/shared/src/codegen/fileNames.ts.

Single source of truth for generated output file names, so the HTML's
`<link>`/`<script src>` references, the zip's actual file paths, and the live
preview's inline-substitution lookups can never drift apart.

Naming convention (`<Sub>` = the subsidiary, `<lang>` = the upper-cased language
subtag such as `EN`/`AR`, `<projectCode>` = the form's project code):

- HTML / behavior JS: `<Sub>-<lang>_<projectCode>_<FF|OC>.html` / `.js`  (per language, per variant)
- main data JS:       `<Sub>_<projectCode>.js`  (one per subsidiary + project code)
- CSS:                `<lang>-<projectCode>.css` (one per language + project code)

Whenever the form has no project code (yet), its segment is simply omitted, e.g.
`SESAR-EN_FF.html` / `EN.css`.
"""

from __future__ import annotations

import re
from typing import Optional

from pydantic import BaseModel

from ..form.definition import FormDefinition
from .types import BuilderConfig

_SANITIZE_RE = re.compile(r"[^a-zA-Z0-9_-]+")
_TRIM_DASH_RE = re.compile(r"^-+|-+$")


class LanguageFileNames(BaseModel):
    """One language's set of generated files — a form produces one per locale."""

    # The locale this set of files serves, e.g. "ar_SA".
    locale: str
    # The language token used in this language's file names, e.g. "AR".
    lang: str
    css: str
    ffHtml: str
    ocHtml: str
    ffJs: str
    ocJs: str


class FileNames(LanguageFileNames):
    """The top-level css/ffHtml/ocHtml/ffJs/ocJs are the **default locale's**
    files (so single-language call sites read naturally); every language's
    files — including the default's — are in `languages`. `dataJs` is the one
    main data file, shared by every language."""

    # `<Sub>_<projectCode>.js` — every language's HTML reads this same data file.
    dataJs: str
    # One entry per form locale, in the form's `locales` order.
    languages: list[LanguageFileNames]


def _sanitize(s: str) -> str:
    replaced = _SANITIZE_RE.sub("-", s)
    return _TRIM_DASH_RE.sub("", replaced)


def _resolve_subsidiary(form: FormDefinition, config: BuilderConfig) -> str:
    """The `<Sub>` part of every name. `fileNamePrefix` (a BuilderConfig override) replaces it."""
    override = (config.fileNamePrefix or "").strip()
    if override:
        return _sanitize(override)
    return _sanitize(form.meta.subsidiary.strip())


def _resolve_lang_tokens(locales: list[tuple[str, str]]) -> list[str]:
    """The language token for each `(code, langSubtag)` locale: the upper-cased
    language subtag (`EN`, `AR`). Two locales sharing a language (e.g. `en_GB` +
    `en_US`) would collide, so those fall back to their full code (`EN-GB` / `EN-US`)."""
    subtags = [(subtag or "en").upper() for _, subtag in locales]
    tokens: list[str] = []
    for i, (code, _) in enumerate(locales):
        collides = subtags.count(subtags[i]) > 1
        tokens.append(_sanitize(code.replace("_", "-").upper() if collides else subtags[i]))
    return tokens


def resolve_file_names(form: FormDefinition, config: BuilderConfig) -> FileNames:
    sub = _resolve_subsidiary(form, config)
    project_code = _sanitize((config.projectCode or "").strip())

    # Always include the default locale, even if `locales` somehow omits it, so
    # there is always a default-language file set.
    locales = [(l.code, l.langSubtag) for l in form.locales]
    if not any(code == form.meta.defaultLocale for code, _ in locales):
        locales.insert(0, (form.meta.defaultLocale, form.meta.defaultLocale.split("_")[0]))
    tokens = _resolve_lang_tokens(locales)

    languages: list[LanguageFileNames] = []
    for (code, _), lang in zip(locales, tokens):
        html_base = f"{f'{sub}-{lang}' if sub else lang}{f'_{project_code}' if project_code else ''}"
        languages.append(
            LanguageFileNames(
                locale=code,
                lang=lang,
                css=f"{lang}{f'-{project_code}' if project_code else ''}.css",
                ffHtml=f"{html_base}_FF.html",
                ocHtml=f"{html_base}_OC.html",
                ffJs=f"{html_base}_FF.js",
                ocJs=f"{html_base}_OC.js",
            )
        )

    default_language = next((l for l in languages if l.locale == form.meta.defaultLocale), languages[0])
    data_js = f"{'_'.join(p for p in (sub, project_code) if p) or 'data'}.js"

    return FileNames(**default_language.model_dump(), dataJs=data_js, languages=languages)


def language_file_names(file_names: FileNames, locale: Optional[str] = None) -> LanguageFileNames:
    """The file set for `locale`, falling back to the default locale's when it has none."""
    return next((l for l in file_names.languages if l.locale == locale), file_names)
