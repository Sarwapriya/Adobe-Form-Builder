"""Port of packages/shared/src/codegen/js/escaping.ts.

The XSS/injection-safety boundary for codegen: every value that ultimately
came from user/uploaded input is untrusted input flowing into generated
HTML/JS source.
"""

from __future__ import annotations

import json
import re
from typing import Any

_LINE_SEPARATOR = " "
_PARAGRAPH_SEPARATOR = " "
_SCRIPT_CLOSE_RE = re.compile(r"</(script)", re.IGNORECASE)


def escape_html(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def safe_json_for_script(value: Any) -> str:
    """Serializes a value (typically the plain dicts/lists built by build_data_js.py)
    as JSON text safe to embed directly inside a generated `<script>` block.

    Mirrors TS's `JSON.stringify(value, null, 2)` (2-space indent, non-ASCII left
    as literal UTF-8 rather than \\u-escaped — hence `ensure_ascii=False`) plus the
    same two post-processing steps:
     - U+2028/U+2029 (LINE/PARAGRAPH SEPARATOR): valid unescaped in JSON strings, but
       an illegal, string-terminating character inside a raw JS string literal.
     - "</script" (in any casing): closes the enclosing <script> tag during HTML
       parsing, which happens before the JS is ever parsed.
    """
    text = json.dumps(value, indent=2, ensure_ascii=False)
    text = text.replace(_LINE_SEPARATOR, "\\u2028").replace(_PARAGRAPH_SEPARATOR, "\\u2029")
    text = _SCRIPT_CLOSE_RE.sub(r"<\\/\1", text)
    return text
