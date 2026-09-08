"""Python port of packages/shared/tests/codegen/escaping.test.ts."""

from __future__ import annotations

import json

from app.form_pipeline.codegen.escaping import escape_html, safe_json_for_script

_U2028 = " "
_U2029 = " "


def test_escapes_the_five_html_special_characters():
    assert escape_html("""<img src=x onerror="alert('xss')">&""") == "&lt;img src=x onerror=&quot;alert(&#39;xss&#39;)&quot;&gt;&amp;"


def test_leaves_ordinary_text_including_non_latin_scripts_untouched():
    assert escape_html("הטלפון שלי כרגע הוא") == "הטלפון שלי כרגע הוא"


def test_never_emits_a_raw_closing_script_sequence_any_casing():
    payloads = ["</script><script>alert(1)</script>", "</SCRIPT>", "</ScRiPt "]
    for payload in payloads:
        out = safe_json_for_script({"text": payload})
        assert "</script" not in out.lower()


def test_escapes_line_and_paragraph_separators():
    out = safe_json_for_script({"text": f"line one{_U2028}line two{_U2029}line three"})
    assert _U2028 not in out
    assert _U2029 not in out
    assert "\\u2028" in out
    assert "\\u2029" in out


def test_round_trips_through_json_loads_to_the_original_value():
    value = {"a": 'quote " backslash \\ newline \n tab \t', "b": ["<script>", "normal"]}
    out = safe_json_for_script(value)
    assert json.loads(out) == value


def test_produces_output_that_is_valid_js_source_when_embedded_in_a_script_body():
    # Python has no JS engine to eval against, but the whole point of the
    # </script> escaping is that it doesn't change what JSON.parse (or, here,
    # json.loads) recovers — confirm round-tripping still holds for exactly
    # the payloads the escaping exists to defang.
    value = {"malicious": '";alert(1);//', "tag": "</script>"}
    out = safe_json_for_script(value)
    assert json.loads(out) == value
    assert "</script" not in out.lower()
