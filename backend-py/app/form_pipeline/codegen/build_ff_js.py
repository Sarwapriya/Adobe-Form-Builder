"""Port of packages/shared/src/codegen/js/buildFfJs.ts.

`{prefix}_FF.js` is the reference's `SGE-EN_F2H26_FF.js`, byte-identical — no
per-form logic here.
"""

from __future__ import annotations

from .file_names import FileNames
from .reference_ff_js import REFERENCE_FF_JS
from .types import GeneratedFile


def build_ff_js(file_names: FileNames) -> GeneratedFile:
    return GeneratedFile(path=file_names.ffJs, contents=REFERENCE_FF_JS)
