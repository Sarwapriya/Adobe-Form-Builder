"""Python port of packages/shared/tests/form/formDefinitionValidator.test.ts."""

from __future__ import annotations

from typing import Any

from app.form_pipeline.form.definition import FormDefinition
from app.form_pipeline.form.validator import validate_form_definition


def _base_form(**overrides: Any) -> FormDefinition:
    data: dict[str, Any] = {
        "meta": {"subsidiary": "TEST", "sourceFileName": "", "defaultLocale": "en_GB"},
        "locales": [{"code": "en_GB", "langSubtag": "en", "isRtl": False, "sourceColumn": "en_GB", "label": "English"}],
        "questions": [
            {
                "id": "Q1",
                "order": 1,
                "controlType": "radio",
                "headingByLocale": {"en_GB": "Pick one"},
                "subheadingByLocale": {},
                "required": True,
                "answers": [{"id": "A1", "order": 1, "textByLocale": {"en_GB": "Yes"}}],
            }
        ],
        "fields": {"submitButton": {"labelByLocale": {"en_GB": "Submit"}}},
        "validationMessages": {},
        "pageError": {},
        "thankYou": {},
    }
    data.update(overrides)
    return FormDefinition.model_validate(data)


def test_passes_a_well_formed_form_with_no_errors():
    result = validate_form_definition(_base_form())
    assert result.errors == []


def test_errors_when_there_are_no_questions():
    result = validate_form_definition(_base_form(questions=[]))
    assert any("at least one question" in e.message for e in result.errors)


def test_errors_on_duplicate_question_ids():
    form = _base_form(
        questions=[
            {"id": "Q1", "order": 1, "controlType": "text", "headingByLocale": {"en_GB": "A"}, "subheadingByLocale": {}, "required": False, "answers": []},
            {"id": "Q1", "order": 2, "controlType": "text", "headingByLocale": {"en_GB": "B"}, "subheadingByLocale": {}, "required": False, "answers": []},
        ]
    )
    result = validate_form_definition(form)
    assert any("used more than once" in e.message for e in result.errors)


def test_errors_on_non_sequential_question_order():
    form = _base_form(
        questions=[
            {"id": "Q1", "order": 1, "controlType": "text", "headingByLocale": {"en_GB": "A"}, "subheadingByLocale": {}, "required": False, "answers": []},
            {"id": "Q2", "order": 3, "controlType": "text", "headingByLocale": {"en_GB": "B"}, "subheadingByLocale": {}, "required": False, "answers": []},
        ]
    )
    result = validate_form_definition(form)
    assert any("sequential" in e.message for e in result.errors)


def test_errors_when_a_choice_question_has_no_answers():
    form = _base_form(
        questions=[
            {
                "id": "Q1",
                "order": 1,
                "controlType": "dropdown",
                "headingByLocale": {"en_GB": "Pick one"},
                "subheadingByLocale": {},
                "required": True,
                "answers": [],
            }
        ]
    )
    result = validate_form_definition(form)
    assert any("has no options" in e.message for e in result.errors)


def test_errors_when_the_submit_button_has_no_label_for_the_default_locale():
    form = _base_form(fields={"submitButton": {"labelByLocale": {}}})
    result = validate_form_definition(form)
    assert any("submit button" in e.message for e in result.errors)


def test_errors_when_a_mobile_number_field_has_no_countries():
    form = _base_form(
        fields={
            "submitButton": {"labelByLocale": {"en_GB": "Submit"}},
            "mobileNumber": {"labelByLocale": {"en_GB": "Mobile"}, "dropdownFirstEntryByLocale": {}, "countries": []},
        }
    )
    result = validate_form_definition(form)
    assert any("no countries configured" in e.message for e in result.errors)


def test_errors_when_a_mobile_number_field_references_an_unrecognized_country():
    form = _base_form(
        fields={
            "submitButton": {"labelByLocale": {"en_GB": "Submit"}},
            "mobileNumber": {"labelByLocale": {"en_GB": "Mobile"}, "dropdownFirstEntryByLocale": {}, "countries": ["ZZ"]},
        }
    )
    result = validate_form_definition(form)
    assert any('unrecognized country code "ZZ"' in e.message for e in result.errors)


def test_accepts_a_mobile_number_field_with_recognized_countries():
    form = _base_form(
        fields={
            "submitButton": {"labelByLocale": {"en_GB": "Submit"}},
            "mobileNumber": {"labelByLocale": {"en_GB": "Mobile"}, "dropdownFirstEntryByLocale": {}, "countries": ["AE", "QA"]},
        }
    )
    result = validate_form_definition(form)
    assert result.errors == []


def test_warns_not_errors_on_a_single_option_radio_question():
    form = _base_form(
        questions=[
            {
                "id": "Q1",
                "order": 1,
                "controlType": "radio",
                "headingByLocale": {"en_GB": "Pick one"},
                "subheadingByLocale": {},
                "required": True,
                "answers": [{"id": "A1", "order": 1, "textByLocale": {"en_GB": "Only"}}],
            }
        ]
    )
    result = validate_form_definition(form)
    assert result.errors == []
    assert any("only one option" in w.message for w in result.warnings)
