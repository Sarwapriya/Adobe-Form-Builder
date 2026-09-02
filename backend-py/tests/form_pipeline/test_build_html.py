"""Partial Python port of packages/shared/tests/codegen/buildHtml.test.ts.

The TS original drives a real `DOMParser`/CSS-selector engine (jsdom); Python
has neither available here, so this port uses a minimal `html.parser`-based
helper (see `_index_by_id` below) for id/attribute-shaped assertions, plus
substring checks for the rest. This covers the same structural claims as the
original without needing a DOM engine — the byte-identical snapshot test
(test_generate_snapshot.py) already pins the exact HTML output beyond what's
reasonable to re-assert here.
"""

from __future__ import annotations

from html.parser import HTMLParser
from typing import Optional

from app.form_pipeline.codegen.file_names import resolve_file_names
from app.form_pipeline.codegen.html.build_ff_html import build_ff_html
from app.form_pipeline.codegen.html.build_oc_html import build_oc_html
from app.form_pipeline.codegen.types import AnalyticsConfig, default_builder_config

from .fixtures import sample_form_definition


class _Node:
    __slots__ = ("tag", "attrs")

    def __init__(self, tag: str, attrs: dict[str, Optional[str]]):
        self.tag = tag
        self.attrs = attrs


class _IdIndexer(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.by_id: dict[str, _Node] = {}
        self.html_attrs: dict[str, Optional[str]] = {}
        self.class_count: dict[str, int] = {}

    def _handle(self, tag: str, attrs: list[tuple[str, Optional[str]]]) -> None:
        attrs_dict = dict(attrs)
        if tag == "html":
            self.html_attrs = attrs_dict
        node = _Node(tag, attrs_dict)
        node_id = attrs_dict.get("id")
        if node_id:
            self.by_id[node_id] = node
        for cls in (attrs_dict.get("class") or "").split():
            self.class_count[cls] = self.class_count.get(cls, 0) + 1

    def handle_starttag(self, tag, attrs):
        self._handle(tag, attrs)

    def handle_startendtag(self, tag, attrs):
        self._handle(tag, attrs)


def _index(html: str) -> _IdIndexer:
    parser = _IdIndexer()
    parser.feed(html)
    return parser


def _build_ff(form=None, config=None):
    form = form or sample_form_definition()
    config = config or default_builder_config()
    return build_ff_html(form, config, resolve_file_names(form, config))


def _build_oc(form=None, config=None):
    form = form or sample_form_definition()
    config = config or default_builder_config()
    return build_oc_html(form, config, resolve_file_names(form, config))


def test_ff_html_produces_expected_structure_and_rtl_attributes():
    form = sample_form_definition()
    config = default_builder_config()
    file = build_ff_html(form, config, resolve_file_names(form, config))
    assert file.path == "TEST-EN_FF.html"

    idx = _index(file.contents)
    assert idx.html_attrs.get("lang") == "en"
    assert idx.html_attrs.get("dir") == "ltr"

    # Profile fields present per fixture (email + submitButton only).
    assert "email" in idx.by_id
    assert "firstName" not in idx.by_id
    assert "callingCode" not in idx.by_id

    # 3 questions, one per control type.
    assert idx.class_count.get("form_check_module", 0) == 3
    assert "Q1" in idx.by_id and idx.by_id["Q1"].tag == "div"
    assert "Q1A1" in idx.by_id
    assert idx.by_id["Q1A1"].attrs.get("value") == "A1"

    # Every submittable element is marked data-pt-api="y".
    assert idx.by_id["email"].attrs.get("data-pt-api") == "y"
    assert idx.by_id["Q1A1"].attrs.get("data-pt-api") == "y"

    # No Parsley/required attributes on question inputs.
    assert "data-parsley-required" not in idx.by_id["Q1A1"].attrs
    assert "required" not in idx.by_id["Q1A1"].attrs

    # No privacy checkbox / Terms and Conditions link rendered (unconfigured).
    assert "privacyPolicy" not in idx.by_id
    assert "termsAndConditionsLink" not in idx.by_id


def test_ff_html_references_resolved_file_names():
    form = sample_form_definition()
    config = default_builder_config()
    file_names = resolve_file_names(form, config)
    file = build_ff_html(form, config, file_names)
    assert f'href="{file_names.css}"' in file.contents
    assert f'src="{file_names.dataJs}"' in file.contents
    assert f'src="{file_names.ffJs}"' in file.contents


def test_never_leaks_raw_html_special_characters_from_question_answer_text():
    file = _build_ff()
    assert "<script>alert(1)</script>" not in file.contents
    assert "maliciousCode" not in file.contents


def test_sets_dir_rtl_and_lang_when_default_locale_is_rtl():
    form = sample_form_definition()
    form.meta.defaultLocale = "ar_AE"
    file = _build_ff(form)
    idx = _index(file.contents)
    assert idx.html_attrs.get("lang") == "ar"
    assert idx.html_attrs.get("dir") == "rtl"


def test_always_includes_reference_static_head_skeleton():
    file = _build_ff()
    assert "<title>Samsung</title>" in file.contents
    assert "https://res6.mena2p.crm.samsung.com/res/tracking/Favicon.png" in file.contents
    assert "samsungSS_fonts_2026.css" in file.contents


def test_renders_terms_and_conditions_link_in_both_variants_only_when_configured():
    form = sample_form_definition()
    form.fields.termsAndConditions = {
        "textByLocale": {"en_GB": "* Terms and conditions apply."},
        "urlByLocale": {"en_GB": "https://example.com/terms.pdf"},
    }
    ff_idx = _index(_build_ff(form).contents)
    ff_link = ff_idx.by_id.get("termsAndConditionsLink")
    assert ff_link is not None
    assert ff_link.attrs.get("href") == "#"  # populated at runtime, not baked in

    oc_idx = _index(_build_oc(form).contents)
    assert "termsAndConditionsLink" in oc_idx.by_id


def test_adobe_launch_tag_only_present_when_analytics_explicitly_enabled():
    without_analytics = _build_ff()
    assert "assets.adobedtm.com" not in without_analytics.contents

    with_analytics_config = default_builder_config().model_copy(
        update={"analytics": AnalyticsConfig(enabled=True, reportSuiteID="rs", imsOrgID="org", datastreamID="ds")}
    )
    with_analytics = _build_ff(config=with_analytics_config)
    assert "assets.adobedtm.com" in with_analytics.contents


def test_filters_question_modules_independently_per_variant():
    form = sample_form_definition()
    form.questions[0].visibleInVariants = ["ff"]
    form.questions[1].visibleInVariants = ["oc"]
    # Q3 stays unset — must still appear in both variants.
    config = default_builder_config()
    file_names = resolve_file_names(form, config)

    ff_idx = _index(build_ff_html(form, config, file_names).contents)
    assert "Q1" in ff_idx.by_id
    assert "Q2" not in ff_idx.by_id
    assert "Q3" in ff_idx.by_id

    oc_idx = _index(build_oc_html(form, config, file_names).contents)
    assert "Q1" not in oc_idx.by_id
    assert "Q2" in oc_idx.by_id
    assert "Q3" in oc_idx.by_id


def test_oc_html_omits_name_email_and_privacy_uses_floating_submit_bar():
    form = sample_form_definition()
    form.fields.callingCode = {"labelByLocale": {"en_GB": "Mobile No."}, "dropdownFirstEntryByLocale": {}}
    form.fields.privacyPolicy = {"textByLocale": {"en_GB": "..."}, "linkUrlByLocale": {"en_GB": "https://x"}}
    file = _build_oc(form)
    assert file.path == "TEST-EN_OC.html"
    idx = _index(file.contents)

    assert "email" not in idx.by_id
    assert "firstName" not in idx.by_id
    assert "callingCode" in idx.by_id
    assert "privacyPolicy" not in idx.by_id
    assert idx.by_id.get("formBottomBar") is not None
    assert idx.class_count.get("form_bottom_group", 0) == 0
    assert idx.class_count.get("container_oc", 0) == 1
