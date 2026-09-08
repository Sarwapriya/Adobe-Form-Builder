"""Python port of packages/shared/tests/codegen/buildStyleCss.test.ts."""

from __future__ import annotations

import re

from app.form_pipeline.codegen.build_style_css import build_style_css
from app.form_pipeline.codegen.file_names import resolve_file_names
from app.form_pipeline.codegen.types import default_builder_config

from .fixtures import sample_form_definition


def _build_file():
    form = sample_form_definition()
    config = default_builder_config()
    return build_style_css(resolve_file_names(form, config))


def test_produces_a_stylesheet_with_the_references_core_class_names_intact():
    file = _build_file()
    assert file.path == "TEST-EN.css"
    for cls in [
        ".form_top_group",
        ".form_text_bx",
        ".form_check_group",
        ".form_check_module",
        ".radio_group",
        ".radio_wrap",
        ".form_check_list_wrap",
        ".form_check_list",
        ".star",
        ".form_bottom_group",
        ".form_bottom_bar",
        "#overlay",
        ".loader",
        ".popup",
        ".popup--alert",
        ".cta",
    ]:
        assert cls in file.contents


def test_contains_no_dangling_asset_references():
    file = _build_file()
    assert "etc.clientlibs" not in file.contents
    assert "cancel.png" not in file.contents
    assert "checked.png" not in file.contents


def test_adds_real_rtl_support():
    file = _build_file()
    assert '[dir="rtl"]' in file.contents


def test_has_balanced_braces():
    file = _build_file()
    opens = len(re.findall(r"{", file.contents))
    closes = len(re.findall(r"}", file.contents))
    assert opens == closes
    assert opens > 100
