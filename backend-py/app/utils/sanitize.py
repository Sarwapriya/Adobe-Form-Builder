"""Port of `backend/src/utils/sanitizeSubsidiaryId.ts` +
`backend/src/utils/sanitizeFileName.ts`."""

from __future__ import annotations

import os
import re

_SUBSIDIARY_UNSAFE_RE = re.compile(r"[^A-Za-z0-9_-]")
_STEM_UNSAFE_RE = re.compile(r"[^A-Za-z0-9._-]")
_EXT_UNSAFE_RE = re.compile(r"[^A-Za-z0-9.]")


def sanitize_subsidiary_id(subsidiary_id: str) -> str:
    """Restricts a subsidiaryId route param to a safe path-segment character
    set before it's used to build a directory under UPLOAD_DIR. Raises if
    nothing safe remains, since an empty/unsafe id must not silently collapse
    to a shared or root directory."""
    safe = _SUBSIDIARY_UNSAFE_RE.sub("", subsidiary_id)
    if not safe:
        raise ValueError(f'Invalid subsidiaryId: "{subsidiary_id}"')
    return safe


def sanitize_file_name(original_name: str) -> str:
    """Restricts an arbitrary (possibly attacker-influenced) file name to a
    safe character set before it's used on disk."""
    base = os.path.basename(original_name)
    stem, ext = os.path.splitext(base)

    safe_stem = _STEM_UNSAFE_RE.sub("_", stem) or "file"
    safe_ext = _EXT_UNSAFE_RE.sub("", ext)

    return f"{safe_stem}{safe_ext}"
