"""Port of packages/shared/src/codegen/js/buildFfJs.ts.

`<Sub>-<lang>_<projectCode>_FF.js` is the reference's `SGE-EN_F2H26_FF.js`,
byte-identical — no per-form logic — preceded only by the one-line
`language_pin` that makes this language the page's default. One file per
language (the form's default language when `locale` is omitted).
"""

from __future__ import annotations

from typing import Optional

from .file_names import FileNames, language_file_names
from .language_pin import language_pin
from .reference_ff_js import REFERENCE_FF_JS
from .types import GeneratedFile


def build_ff_js(file_names: FileNames, locale: Optional[str] = None) -> GeneratedFile:
    files = language_file_names(file_names, locale)
    return GeneratedFile(path=files.ffJs, contents=language_pin(files.locale) + REFERENCE_FF_JS)
