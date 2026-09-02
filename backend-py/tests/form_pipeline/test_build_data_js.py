"""Python port of packages/shared/tests/codegen/buildDataJs.test.ts.

The original TS test evaluates the generated data.js file with a real JS
engine (`new Function(...)`); Python has none available, so `eval_data()`
(see ./data_js_helpers.py) recovers the same plain data by JSON-decoding
each `const NAME = <JSON>;` declaration instead — safe here because
`safe_json_for_script`'s only departures from plain `JSON.stringify` output
are the U+2028/U+2029 and `</script` escapes, none of which this fixture's
content triggers.
"""

from __future__ import annotations

from app.form_pipeline.codegen.build_data_js import build_data_js
from app.form_pipeline.codegen.file_names import resolve_file_names
from app.form_pipeline.codegen.types import ChannelConfig, default_builder_config

from .data_js_helpers import eval_data
from .fixtures import sample_form_definition


def _build_file(config=None):
    form = sample_form_definition()
    config = config or default_builder_config()
    return build_data_js(form, config, resolve_file_names(form, config))


def test_produces_a_data_file_declaring_the_reference_bare_const_names():
    file = _build_file()
    assert file.path == "TEST-EN.js"
    for name in (
        "page_error",
        "fields",
        "questions",
        "answers",
        "validation_messages",
        "country_subsidiary",
        "subsidiary_detail",
        "param",
    ):
        assert f"const {name} = " in file.contents

    data = eval_data(file.contents)
    assert data["questions"]["en_GB"]["Q1"]["heading"] == "I am currently using"
    assert data["questions"]["ar_AE"]["Q1"]["heading"] == "أنا أستخدم حاليًا"
    assert data["answers"]["en_GB"]["Q1"]["A1"] == "Galaxy"


def test_never_emits_a_raw_closing_script_sequence():
    file = _build_file()
    assert "</script>alert" not in file.contents.lower()


def test_preserves_xss_payload_text_losslessly():
    file = _build_file()
    data = eval_data(file.contents)
    assert data["questions"]["en_GB"]["Q2"]["heading"] == "Which do you like? <script>alert(1)</script>"
    assert data["answers"]["en_GB"]["Q2"]["A1"] == '"; maliciousCode(); //'


def test_falls_back_to_default_locale_for_missing_text():
    file = _build_file()
    data = eval_data(file.contents)
    assert data["questions"]["ar_AE"]["Q2"]["heading"] == "Which do you like? <script>alert(1)</script>"
    assert data["fields"]["ar_AE"]["submitButton"] == "إرسال"


def test_omits_profile_fields_never_present_in_the_source():
    file = _build_file()
    data = eval_data(file.contents)
    assert data["fields"]["en_GB"]["label"]["email"] == "E-mail"
    assert data["fields"]["en_GB"]["label"]["firstName"] == ""


def test_leaves_api_endpoint_blank_and_analytics_disabled_by_default():
    file = _build_file()
    data = eval_data(file.contents)
    assert data["param"]["apiEndpoint"] == ""
    assert data["param"]["analytics"]["enabled"] is False


def test_embeds_full_country_subsidiary_and_subsidiary_detail_tables():
    file = _build_file()
    data = eval_data(file.contents)
    assert data["country_subsidiary"]["AE"] == "SGE"
    assert isinstance(data["subsidiary_detail"]["SGE"], list)
    assert any(c["countryCode"] == "AE" for c in data["subsidiary_detail"]["SGE"])


def test_projects_terms_and_conditions_text_url_per_locale():
    empty_file = _build_file()
    empty_data = eval_data(empty_file.contents)
    assert empty_data["fields"]["en_GB"]["termsAndConditions"] == ""
    assert empty_data["fields"]["en_GB"]["termsAndConditionsLink"]["url"] == ""

    form = sample_form_definition()
    form.fields.termsAndConditions = {
        "textByLocale": {"en_GB": "* Terms and conditions apply."},
        "urlByLocale": {"en_GB": "https://example.com/terms.pdf"},
    }
    config = default_builder_config()
    file = build_data_js(form, config, resolve_file_names(form, config))
    data = eval_data(file.contents)
    assert data["fields"]["en_GB"]["termsAndConditions"] == "* Terms and conditions apply."
    assert data["fields"]["en_GB"]["termsAndConditionsLink"]["url"] == "https://example.com/terms.pdf"
    # Falls back to the default locale, same as every other localized field.
    assert data["fields"]["ar_AE"]["termsAndConditions"] == "* Terms and conditions apply."


def test_projects_same_campaign_heading_subheading_to_both_variants_without_ff_override():
    form = sample_form_definition()
    form.fields.headingBeforeBreakByLocale = {"en_GB": "Register now"}
    form.fields.campaignSubheadingByLocale = {"en_GB": "Limited time offer"}
    config = default_builder_config()
    file = build_data_js(form, config, resolve_file_names(form, config))
    data = eval_data(file.contents)

    assert data["fields"]["en_GB"]["headingBeforeBreakFF"] == "Register now"
    assert data["fields"]["en_GB"]["headingBeforeBreak"] == "Register now"
    assert data["fields"]["en_GB"]["campaignSubheadingFF"] == "Limited time offer"
    assert data["fields"]["en_GB"]["campaignSubheading"] == "Limited time offer"


def test_uses_ff_override_while_leaving_oc_on_base_text():
    form = sample_form_definition()
    form.fields.headingBeforeBreakByLocale = {"en_GB": "One-Click heading"}
    form.fields.headingBeforeBreakFFByLocale = {"en_GB": "Full Form heading"}
    form.fields.campaignSubheadingByLocale = {"en_GB": "One-Click subheading"}
    form.fields.campaignSubheadingFFByLocale = {"en_GB": "Full Form subheading"}
    config = default_builder_config()
    file = build_data_js(form, config, resolve_file_names(form, config))
    data = eval_data(file.contents)

    assert data["fields"]["en_GB"]["headingBeforeBreakFF"] == "Full Form heading"
    assert data["fields"]["en_GB"]["headingBeforeBreak"] == "One-Click heading"
    assert data["fields"]["en_GB"]["campaignSubheadingFF"] == "Full Form subheading"
    assert data["fields"]["en_GB"]["campaignSubheading"] == "One-Click subheading"


def test_threads_builder_config_into_param():
    config = default_builder_config().model_copy(
        update={
            "project": "F2H26",
            "channel": ChannelConfig(fullForm="COM", oneClick="EMAIL"),
            "channelDetail": ChannelConfig(fullForm="COMD", oneClick="EMAILD"),
            "source": ChannelConfig(fullForm="full_form", oneClick="one_click"),
            "voucherRequired": "Y",
        }
    )
    file = _build_file(config)
    data = eval_data(file.contents)
    assert data["param"]["project"] == "F2H26"
    assert data["param"]["channel"] == {"fullForm": "COM", "oneClick": "EMAIL"}
    assert data["param"]["channelDetail"] == {"fullForm": "COMD", "oneClick": "EMAILD"}
    assert data["param"]["source"] == {"fullForm": "full_form", "oneClick": "one_click"}
    assert data["param"]["voucherRequired"] == "Y"


def test_emits_auto_populate_params_only_for_eligible_and_enabled_questions():
    empty_file = _build_file()
    assert eval_data(empty_file.contents)["auto_populate_params"] == {}

    form = sample_form_definition()
    # Q1 (radio, order 1): eligible + enabled -> included as "q01".
    form.questions[0].autoPopulateEligible = True
    form.questions[0].autoPopulateEnabled = True
    # Q2 (checkbox, order 2): eligible but not enabled -> excluded.
    form.questions[1].autoPopulateEligible = True
    config = default_builder_config()
    file = build_data_js(form, config, resolve_file_names(form, config))
    data = eval_data(file.contents)
    assert data["auto_populate_params"] == {"q01": "Q1"}


def test_excludes_text_type_question_even_if_both_flags_set():
    form = sample_form_definition()
    # Q3 (controlType "text", order 3).
    form.questions[2].autoPopulateEligible = True
    form.questions[2].autoPopulateEnabled = True
    config = default_builder_config()
    file = build_data_js(form, config, resolve_file_names(form, config))
    data = eval_data(file.contents)
    assert data["auto_populate_params"] == {}
