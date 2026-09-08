"""Minimal parser for Vitest's checked-in `.snap` snapshot file format.

A `.snap` file is (effectively) a small JS module: for each snapshot it
contains a line like

    exports[`<test name> 1`] = `<template literal content>`;

where both the key and the value are JS template literals (backtick
strings). Per Jest/Vitest's own pretty-format snapshot serializer
(`escapeBacktickString`), the *only* characters ever escaped inside such a
template literal are backslash (`\\`), backtick (`` ` ``), and the two-
character sequence `${` — every other character, including real newlines
and quotes, is written out completely literally. This parser exploits
exactly that restricted escaping rule (not general JS parsing) to recover
the exact original string values, so the snapshot byte-comparison test can
assert against the real checked-in `.snap` file's content rather than a
hand-copied guess.
"""

from __future__ import annotations


def _read_backtick_string(s: str, start: int) -> tuple[str, int]:
    r"""`s[start]` must be the opening backtick. Returns (value, index just past
    the closing backtick)."""
    assert s[start] == "`", f"expected backtick at {start}, got {s[start]!r}"
    i = start + 1
    out: list[str] = []
    while True:
        c = s[i]
        if c == "\\":
            nxt = s[i + 1]
            if nxt in ("`", "\\", "$"):
                out.append(nxt)
                i += 2
                continue
            # Not one of the three escaped characters the serializer ever
            # produces — treat literally (defensive; shouldn't happen).
            out.append(c)
            i += 1
            continue
        if c == "`":
            return "".join(out), i + 1
        out.append(c)
        i += 1


def _unwrap_string_snapshot(value: str) -> str:
    """Reverses Jest/Vitest's `printString`+`addExtraLineBreaks` wrapping that a
    *string* snapshot value (as opposed to an object/array snapshot) goes
    through before being written to the `.snap` file, on top of the backtick
    template-literal escaping `_read_backtick_string` already reversed.

    Empirically (confirmed against this repo's own checked-in .snap file: e.g.
    the `data.js`/`ff.html` snapshots' internal `"en_GB"`/`lang="en"` double
    quotes appear completely unescaped, and a real single backslash in a regex
    pattern like `\\.` appears doubled — i.e. only template-literal-escaped —
    rather than additionally quote/backslash-escaped) Vitest serializes a plain
    string snapshot with `escapeString: false`: `printString` wraps the value
    in one literal leading/trailing `"` with NO internal escaping, and
    `addExtraLineBreaks` additionally wraps *that* in one leading/trailing
    real newline whenever the value contains a newline. So the exact original
    string is recovered by stripping only that outer quote (and, when
    present, the newline just outside it) — never by un-escaping anything
    inside.
    """
    if value.startswith('\n"') and value.endswith('"\n'):
        return value[2:-2]
    if value.startswith('"') and value.endswith('"'):
        return value[1:-1]
    raise ValueError(f"Unrecognized snapshot string wrapping: {value[:20]!r} ... {value[-20:]!r}")


def parse_snap_file(text: str) -> dict[str, str]:
    """Returns {snapshot key: original string value} for every
    `exports[\`...\`] = \`...\`;` entry in a Vitest `.snap` file's content —
    i.e. the actual `received` string each `toMatchSnapshot()` call was given
    (see `_unwrap_string_snapshot`'s doc comment for why this needs one more
    unwrapping step beyond plain backtick-literal decoding)."""
    result: dict[str, str] = {}
    marker = "exports["
    i = 0
    while True:
        idx = text.find(marker, i)
        if idx == -1:
            break
        key_start = idx + len(marker)
        assert text[key_start] == "`"
        key, after_key = _read_backtick_string(text, key_start)
        # Expect `] = ` (with possible whitespace variations) then a backtick.
        j = after_key
        while text[j] != "`":
            j += 1
        value, after_value = _read_backtick_string(text, j)
        result[key] = _unwrap_string_snapshot(value)
        i = after_value
    return result
