"""Port of packages/shared/src/codegen/js/buildOcJs.ts.

`{prefix}_OC.js` is the reference's `SGE-EN_F2H26_OC.js`, byte-identical — no
per-form logic here.
"""

from __future__ import annotations

from .file_names import FileNames
from .reference_oc_js import REFERENCE_OC_JS
from .types import GeneratedFile


def build_oc_js(file_names: FileNames) -> GeneratedFile:
    return GeneratedFile(path=file_names.ocJs, contents=REFERENCE_OC_JS)
