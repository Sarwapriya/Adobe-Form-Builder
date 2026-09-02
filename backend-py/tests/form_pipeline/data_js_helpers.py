"""Test-only helper to turn a generated data.js file's content back into plain
Python data, mirroring what packages/shared/tests/codegen/buildDataJs.test.ts's
own `evalData()` does by running the generated JS in a real JS engine (`new
Function(...)`) — Python has no JS engine available, but `build_data_js.py`
emits nothing but a sequence of `const NAME = <JSON>;` declarations (see
`safe_json_for_script`), so each one is recoverable with `json.loads` alone.
"""

from __future__ import annotations

import json
import re
from typing import Any

_DECL_RE = re.compile(r"^const (\w+) = ", re.MULTILINE)


def eval_data(contents: str) -> dict[str, Any]:
    matches = list(_DECL_RE.finditer(contents))
    result: dict[str, Any] = {}
    for i, m in enumerate(matches):
        name = m.group(1)
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(contents)
        # Each declaration's own JSON text ends with ";\n\n" (or ";\n" for the
        # last one) — strip that trailing statement/blank-line noise before
        # decoding back to a Python value.
        json_text = contents[start:end].rstrip().removesuffix(";")
        result[name] = json.loads(json_text)
    return result
