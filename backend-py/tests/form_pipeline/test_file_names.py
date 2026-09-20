"""Pins the generated-file naming convention (mirror of
packages/shared/tests/codegen/fileNames.test.ts):

    HTML / behavior JS:  <Sub>-<lang>_<projectCode>_<FF|OC>.html / .js  (per language, per variant)
    main data JS:        <Sub>_<projectCode>.js                           (per subsidiary + project code)
    CSS:                 <lang>-<projectCode>.css                         (per language + project code)

with the project-code segment omitted while the form has no project code.
"""

from __future__ import annotations

from app.form_pipeline.codegen.file_names import language_file_names, resolve_file_names
from app.form_pipeline.codegen.generate import generate_solution
from app.form_pipeline.codegen.types import default_builder_config

from .fixtures import sample_form_definition


def _with_code(**extra):
    return default_builder_config().model_copy(update={"projectCode": "F2H26", "variants": ["ff", "oc"], **extra})


def test_names_every_file_per_the_convention_when_the_form_has_a_project_code():
    names = resolve_file_names(sample_form_definition(), _with_code())  # subsidiary "TEST", en_GB + ar_AE

    assert names.dataJs == "TEST_F2H26.js"
    assert [l.model_dump() for l in names.languages] == [
        {
            "locale": "en_GB",
            "lang": "EN",
            "css": "EN-F2H26.css",
            "ffHtml": "TEST-EN_F2H26_FF.html",
            "ocHtml": "TEST-EN_F2H26_OC.html",
            "ffJs": "TEST-EN_F2H26_FF.js",
            "ocJs": "TEST-EN_F2H26_OC.js",
        },
        {
            "locale": "ar_AE",
            "lang": "AR",
            "css": "AR-F2H26.css",
            "ffHtml": "TEST-AR_F2H26_FF.html",
            "ocHtml": "TEST-AR_F2H26_OC.html",
            "ffJs": "TEST-AR_F2H26_FF.js",
            "ocJs": "TEST-AR_F2H26_OC.js",
        },
    ]


def test_generates_exactly_those_file_names():
    files = generate_solution(sample_form_definition(), _with_code())
    assert sorted(f.path for f in files) == sorted(
        [
            "TEST_F2H26.js",
            "EN-F2H26.css",
            "AR-F2H26.css",
            "TEST-EN_F2H26_FF.html",
            "TEST-AR_F2H26_FF.html",
            "TEST-EN_F2H26_OC.html",
            "TEST-AR_F2H26_OC.html",
            "TEST-EN_F2H26_FF.js",
            "TEST-AR_F2H26_FF.js",
            "TEST-EN_F2H26_OC.js",
            "TEST-AR_F2H26_OC.js",
        ]
    )


def test_omits_the_project_code_segment_while_the_form_has_none():
    names = resolve_file_names(sample_form_definition(), default_builder_config())
    assert names.dataJs == "TEST.js"
    assert [l.css for l in names.languages] == ["EN.css", "AR.css"]
    assert [l.ffHtml for l in names.languages] == ["TEST-EN_FF.html", "TEST-AR_FF.html"]
    assert [l.ocJs for l in names.languages] == ["TEST-EN_OC.js", "TEST-AR_OC.js"]


def test_blank_project_code_is_treated_as_absent():
    config = default_builder_config().model_copy(update={"projectCode": "   "})
    assert resolve_file_names(sample_form_definition(), config).dataJs == "TEST.js"


def test_top_level_names_are_the_default_locales_set():
    names = resolve_file_names(sample_form_definition(), _with_code())
    assert names.locale == "en_GB"
    assert names.ffHtml == "TEST-EN_F2H26_FF.html"
    assert names.css == "EN-F2H26.css"
    assert names.ffHtml == language_file_names(names, "en_GB").ffHtml


def test_default_set_follows_the_default_locale_not_locale_order():
    form = sample_form_definition()
    form.meta.defaultLocale = "ar_AE"
    names = resolve_file_names(form, _with_code())
    assert names.locale == "ar_AE"
    assert names.ffHtml == "TEST-AR_F2H26_FF.html"


def test_language_file_names_falls_back_to_the_default_locale_for_an_unknown_locale():
    names = resolve_file_names(sample_form_definition(), _with_code())
    assert language_file_names(names, "ar_AE").ffHtml == "TEST-AR_F2H26_FF.html"
    assert language_file_names(names, "xx_XX").ffHtml == "TEST-EN_F2H26_FF.html"
    assert language_file_names(names).ffHtml == "TEST-EN_F2H26_FF.html"


def test_sanitizes_unsafe_characters_in_the_project_code_and_subsidiary():
    form = sample_form_definition()
    form.meta.subsidiary = "SE SAR/1"
    names = resolve_file_names(form, default_builder_config().model_copy(update={"projectCode": "F2H 26/x"}))
    assert names.dataJs == "SE-SAR-1_F2H-26-x.js"
    assert names.ffHtml == "SE-SAR-1-EN_F2H-26-x_FF.html"
    assert names.css == "EN-F2H-26-x.css"


def test_file_name_prefix_overrides_only_the_sub_part():
    config = default_builder_config().model_copy(update={"fileNamePrefix": "SESAR", "projectCode": "F2H26"})
    names = resolve_file_names(sample_form_definition(), config)
    assert names.dataJs == "SESAR_F2H26.js"
    assert names.ffHtml == "SESAR-EN_F2H26_FF.html"
    assert names.css == "EN-F2H26.css"


def test_drops_the_sub_segment_when_there_is_no_subsidiary_at_all():
    form = sample_form_definition()
    form.meta.subsidiary = ""
    with_code = default_builder_config().model_copy(update={"projectCode": "F2H26"})
    assert resolve_file_names(form, with_code).ffHtml == "EN_F2H26_FF.html"
    assert resolve_file_names(form, with_code).dataJs == "F2H26.js"
    assert resolve_file_names(form, default_builder_config()).dataJs == "data.js"


def test_disambiguates_two_locales_of_the_same_language_with_the_full_country_code():
    form = sample_form_definition()
    en_gb, ar_ae = form.locales[0], form.locales[1]
    en_us = en_gb.model_copy(update={"code": "en_US", "sourceColumn": "builder", "label": "English (US)"})
    form.locales = [en_gb, en_us, ar_ae]
    names = resolve_file_names(form, default_builder_config().model_copy(update={"projectCode": "F2H26"}))
    assert [l.lang for l in names.languages] == ["EN-GB", "EN-US", "AR"]
    assert [l.ffHtml for l in names.languages] == [
        "TEST-EN-GB_F2H26_FF.html",
        "TEST-EN-US_F2H26_FF.html",
        "TEST-AR_F2H26_FF.html",
    ]
    assert [l.css for l in names.languages] == ["EN-GB-F2H26.css", "EN-US-F2H26.css", "AR-F2H26.css"]
    assert len({l.ffHtml for l in names.languages}) == 3
