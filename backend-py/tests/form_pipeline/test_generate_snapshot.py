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

from app.form_pipeline.codegen.file_names import resolve_file_names
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


def test_ff_only_config_produces_exactly_four_files(file_names, generated_files):
    assert sorted(generated_files.keys()) == sorted([file_names.css, file_names.dataJs, file_names.ffJs, file_names.ffHtml])


def test_both_variants_config_produces_exactly_six_files_no_per_locale_extras():
    form = sample_form_definition()
    config = default_builder_config()
    config = config.model_copy(update={"variants": ["ff", "oc"]})
    file_names = resolve_file_names(form, config)
    files = generate_solution(form, config)
    paths = sorted(f.path for f in files)
    expected = sorted([file_names.css, file_names.dataJs, file_names.ffJs, file_names.ocJs, file_names.ffHtml, file_names.ocHtml])
    assert paths == expected


def test_oc_only_config_produces_exactly_four_files():
    form = sample_form_definition()
    config = default_builder_config().model_copy(update={"variants": ["oc"]})
    file_names = resolve_file_names(form, config)
    files = generate_solution(form, config)
    paths = sorted(f.path for f in files)
    expected = sorted([file_names.css, file_names.dataJs, file_names.ocJs, file_names.ocHtml])
    assert paths == expected


def test_data_js_keys_every_locale(generated_files, file_names):
    data_js = generated_files[file_names.dataJs]
    assert '"en_GB"' in data_js
    assert '"ar_AE"' in data_js


def test_shared_html_seeds_lang_and_dir_from_default_locale(generated_files, file_names):
    ff_html = generated_files[file_names.ffHtml]
    assert '<html lang="en" dir="ltr">' in ff_html
    assert f'<link rel="stylesheet" href="{file_names.css}">' in ff_html
    assert f'<script src="{file_names.dataJs}"></script>' in ff_html
    assert f'<script src="{file_names.ffJs}"></script>' in ff_html

    ff_js = generated_files[file_names.ffJs]
    assert 'frameUrlParam.get("lang")' in ff_js
    assert "fields[language]" in ff_js
