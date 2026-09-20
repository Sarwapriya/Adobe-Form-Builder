"""Critical byte-identical parity test.

Asserts that `generate_solution(sample_form_definition(), default_builder_config())`
produces content byte-for-byte identical to the real, checked-in Vitest
snapshot at packages/shared/tests/codegen/__snapshots__/generate.test.ts.snap
— the TypeScript pipeline's own recorded output for the same fixture (see
packages/shared/tests/codegen/generate.test.ts and ./fixtures.py).

This is the single most important test in the whole port: later phases (form
builder publish, QA runs, Question Master export) depend on this Python
pipeline producing exactly what the existing Node backend produces today.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from app.form_pipeline.codegen.file_names import language_file_names, resolve_file_names
from app.form_pipeline.codegen.generate import generate_solution
from app.form_pipeline.codegen.types import default_builder_config

from .fixtures import sample_form_definition
from .snap_parser import parse_snap_file

_REPO_ROOT = Path(__file__).resolve().parents[3]
_SNAP_PATH = _REPO_ROOT / "packages" / "shared" / "tests" / "codegen" / "__snapshots__" / "generate.test.ts.snap"


@pytest.fixture(scope="module")
def snapshot_entries() -> dict[str, str]:
    assert _SNAP_PATH.is_file(), f"expected the real TS snapshot at {_SNAP_PATH}"
    text = _SNAP_PATH.read_text(encoding="utf-8")
    entries = parse_snap_file(text)
    assert len(entries) == 4, f"expected 4 snapshot entries, parsed {len(entries)}: {list(entries)}"
    return entries


@pytest.fixture(scope="module")
def generated_files() -> dict[str, str]:
    form = sample_form_definition()
    config = default_builder_config()
    files = generate_solution(form, config)
    return {f.path: f.contents for f in files}


@pytest.fixture(scope="module")
def file_names(generated_files: dict[str, str]):
    form = sample_form_definition()
    config = default_builder_config()
    return resolve_file_names(form, config)


def test_ff_html_matches_snapshot_byte_for_byte(generated_files, file_names, snapshot_entries):
    expected = snapshot_entries["generateSolution > matches the reference fixture snapshot (ff.html) 1"]
    actual = generated_files[file_names.ffHtml]
    assert actual == expected


def test_data_js_matches_snapshot_byte_for_byte(generated_files, file_names, snapshot_entries):
    expected = snapshot_entries["generateSolution > matches the reference fixture snapshot (data.js) 1"]
    actual = generated_files[file_names.dataJs]
    assert actual == expected


def test_style_css_head_and_tail_match_snapshot_byte_for_byte(generated_files, file_names, snapshot_entries):
    actual_css = generated_files[file_names.css]
    expected_head = snapshot_entries["generateSolution > matches the reference fixture snapshot (style.css head/tail) 1"]
    expected_tail = snapshot_entries["generateSolution > matches the reference fixture snapshot (style.css head/tail) 2"]
    assert actual_css[:200] == expected_head
    assert actual_css[-600:] == expected_tail


# The sample form has two languages (English default + Arabic), so every count below
# is `2·languages·variants + languages + 1` (one HTML + one behavior JS per language
# per variant, one stylesheet per language, one shared data file).


def test_ff_only_config_produces_per_language_ff_files_plus_one_data_file(file_names, generated_files):
    assert len(generated_files) == 7
    assert sorted(generated_files.keys()) == sorted(
        [file_names.dataJs] + [n for l in file_names.languages for n in (l.css, l.ffJs, l.ffHtml)]
    )


def test_both_variants_config_produces_exactly_eleven_files():
    form = sample_form_definition()
    config = default_builder_config()
    config = config.model_copy(update={"variants": ["ff", "oc"]})
    file_names = resolve_file_names(form, config)
    files = generate_solution(form, config)
    paths = sorted(f.path for f in files)
    expected = sorted(
        [file_names.dataJs] + [n for l in file_names.languages for n in (l.css, l.ffJs, l.ocJs, l.ffHtml, l.ocHtml)]
    )
    assert len(paths) == 11
    assert len(set(paths)) == 11
    assert paths == expected


def test_oc_only_config_produces_per_language_oc_files_plus_one_data_file():
    form = sample_form_definition()
    config = default_builder_config().model_copy(update={"variants": ["oc"]})
    file_names = resolve_file_names(form, config)
    files = generate_solution(form, config)
    paths = sorted(f.path for f in files)
    expected = sorted([file_names.dataJs] + [n for l in file_names.languages for n in (l.css, l.ocJs, l.ocHtml)])
    assert len(paths) == 7
    assert paths == expected


def test_single_language_form_produces_four_files():
    form = sample_form_definition()
    form.locales = [l for l in form.locales if l.code == "en_GB"]
    files = generate_solution(form, default_builder_config())
    assert sorted(f.path for f in files) == sorted(["EN.css", "TEST-EN_FF.html", "TEST-EN_FF.js", "TEST.js"])


def test_data_js_keys_every_locale(generated_files, file_names):
    data_js = generated_files[file_names.dataJs]
    assert '"en_GB"' in data_js
    assert '"ar_AE"' in data_js
    # ...and every language's HTML links that same shared data file.
    for language in file_names.languages:
        assert f'<script src="{file_names.dataJs}"></script>' in generated_files[language.ffHtml]


def test_each_language_html_seeds_its_own_lang_dir_and_links_its_own_css_and_js(generated_files, file_names):
    en = language_file_names(file_names, "en_GB")
    en_html = generated_files[en.ffHtml]
    assert '<html lang="en" dir="ltr">' in en_html
    assert f'<link rel="stylesheet" href="{en.css}">' in en_html
    assert f'<script src="{en.ffJs}"></script>' in en_html

    ar = language_file_names(file_names, "ar_AE")
    ar_html = generated_files[ar.ffHtml]
    assert '<html lang="ar" dir="rtl">' in ar_html
    assert f'<link rel="stylesheet" href="{ar.css}">' in ar_html
    assert f'<script src="{ar.ffJs}"></script>' in ar_html
    assert en.css not in ar_html
    assert en.ffJs not in ar_html


def test_each_language_behavior_js_pins_that_language_and_still_reads_lang_param(generated_files, file_names):
    for language in file_names.languages:
        ff_js = generated_files[language.ffJs]
        assert f'param["fallbackLanguage"] = "{language.locale}";' in ff_js
        assert 'frameUrlParam.get("lang")' in ff_js
        assert "fields[language]" in ff_js


def test_every_language_stylesheet_carries_the_same_full_stylesheet(generated_files, file_names):
    first, second = (generated_files[l.css] for l in file_names.languages)
    assert first == second
    assert '[dir="rtl"]' in first
