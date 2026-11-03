"""Three-way merge for the shared data file (`<Sub>_<projectCode>.js`), the
one generated file `html_structure_patch.py` deliberately leaves alone (see
its own module doc comment — "data.js is never part of this, it's always
safely regenerated fresh"). That assumption was wrong: an admin absolutely
can and does hand-edit data.js (any value with no builder UI yet, or just to
check something), and until now that hand-edit was wiped by the *very next*
Save Draft/Publish — not just a structural change, any change at all, since
data.js was always written fresh unconditionally.

This is possible because `build_data_js.py`'s whole output is just a
sequence of `const NAME = <JSON>;` statements (see its own module doc
comment) — plain, deeply-nested dicts/lists of strings/numbers/booleans, no
executable logic — so "what changed" is a pure data diff, not an HTML-shape
problem. Given:
  - `old`  — data.js regenerated from the definition the file was last
             *fully* correct against (before any hand-edit),
  - `hand` — what's actually on disk right now (the hand-edit, if any),
  - `new`  — data.js regenerated from the definition about to be published/
             saved,
`merge_data_js` produces the file `new` would have been, except every leaf
the admin changed by hand (and the design side left alone) keeps the hand's
value instead. A leaf *both* sides changed is a genuine conflict — returns
`None` rather than guess, so the caller falls back to treating this file the
same as an unmergeable hand-edited HTML file (confirm before resetting, at
Publish; silently keep regenerating fresh, at the continuous Save-Draft sync,
since that path has no confirmation step to fall back to).
"""

from __future__ import annotations

import json
import re
from typing import Any, Optional

_CONST_RE = re.compile(r"const\s+(\w+)\s*=\s*")

# Mirrors build_data_js.py's own `parts` list order — used only to produce a
# deterministic, readable file; functionally the reader scripts access these
# by name, never by position, so getting this slightly out of sync would
# never break anything, just reorder the file.
_CANONICAL_ORDER = [
    "page_error",
    "fields",
    "questions",
    "answers",
    "validation_messages",
    "country_subsidiary",
    "subsidiary_detail",
    "param",
    "auto_populate_params",
]

_MISSING = object()


def parse_data_js(content: str) -> Optional[dict[str, Any]]:
    """Parses a `const NAME = <JSON>;` sequence back into `{name: value}`.
    Returns None the moment anything doesn't match that shape — a hand-edit
    that introduced genuine JS syntax (comments, trailing commas, unquoted
    keys, ...) rather than staying valid JSON inside the braces is exactly
    the kind of thing this module must not guess about."""
    result: dict[str, Any] = {}
    pos = 0
    decoder = json.JSONDecoder()
    found_any = False
    while True:
        match = _CONST_RE.search(content, pos)
        if match is None:
            break
        found_any = True
        try:
            value, end = decoder.raw_decode(content, match.end())
        except json.JSONDecodeError:
            return None
        result[match.group(1)] = value
        pos = end
    return result if found_any else None


def serialize_data_js(parts: dict[str, Any]) -> str:
    """Inverse of `parse_data_js` — must stay byte-compatible with what
    `build_data_js.py` itself would emit for the *shape* of the output
    (same `const NAME = <JSON>;` statements), via the same
    `safe_json_for_script` escaping rules, reimplemented here rather than
    imported to keep this module free of any codegen import cycle risk;
    the two are simple enough (indent=2, non-ASCII literal, U+2028/2029 and
    `</script` escaped) that duplication risk is low and caught immediately
    by this module's own round-trip tests."""
    ordered_names = [n for n in _CANONICAL_ORDER if n in parts] + sorted(n for n in parts if n not in _CANONICAL_ORDER)
    statements = []
    for name in ordered_names:
        text = json.dumps(parts[name], indent=2, ensure_ascii=False)
        text = text.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
        text = re.sub(r"</(script)", r"<\\/\1", text, flags=re.IGNORECASE)
        statements.append(f"const {name} = {text};")
    return "\n\n".join(statements) + "\n"


def merge_three_way(old: Any, hand: Any, new: Any) -> tuple[Any, bool]:
    """Returns `(merged_value, conflicted)`. `conflicted` is True the moment
    both sides changed the exact same leaf to different values (or changed
    whether a key exists at all) — the caller treats any conflict anywhere
    in the tree as a reason to fall back rather than silently pick a side."""
    if hand == old:
        return new, False
    if new == old:
        return hand, False
    if hand == new:
        return new, False  # both sides coincidentally changed it to the same value
    if isinstance(old, dict) and isinstance(hand, dict) and isinstance(new, dict):
        merged: dict[str, Any] = {}
        conflicted = False
        all_keys = list(dict.fromkeys([*new.keys(), *hand.keys(), *old.keys()]))
        for key in all_keys:
            o = old.get(key, _MISSING)
            h = hand.get(key, _MISSING)
            n = new.get(key, _MISSING)
            if h == o:
                if n is not _MISSING:
                    merged[key] = n
                continue
            if n == o:
                if h is not _MISSING:
                    merged[key] = h
                continue
            if h == n:
                if n is not _MISSING:
                    merged[key] = n
                continue
            value, sub_conflicted = merge_three_way(o, h, n)
            if sub_conflicted:
                conflicted = True
            if value is not _MISSING:
                merged[key] = value
        return merged, conflicted
    # Both sides changed a plain value (or a list, or disagree on type) —
    # can't merge further without guessing which one wins.
    return new, True


def merge_data_js(old_content: str, hand_content: str, new_content: str) -> Optional[str]:
    """Top-level orchestration: parses all three, 3-way-merges them, and
    reserializes. Returns None (fall back to the caller's existing
    unmergeable-file handling) the moment any of the three fails to parse,
    or the merge produces any conflict anywhere in the tree."""
    old_parts = parse_data_js(old_content)
    hand_parts = parse_data_js(hand_content)
    new_parts = parse_data_js(new_content)
    if old_parts is None or hand_parts is None or new_parts is None:
        return None
    merged, conflicted = merge_three_way(old_parts, hand_parts, new_parts)
    if conflicted or not isinstance(merged, dict):
        return None
    return serialize_data_js(merged)
