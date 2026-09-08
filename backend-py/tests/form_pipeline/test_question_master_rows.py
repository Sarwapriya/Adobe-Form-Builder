"""Python port of packages/shared/tests/excel/questionMasterRows.test.ts."""

from __future__ import annotations

from app.form_pipeline.excel.question_master_rows import build_question_master_rows
from app.form_pipeline.form.definition import FormDefinition


def _sample_form() -> FormDefinition:
    return FormDefinition.model_validate(
        {
            "meta": {"subsidiary": "SEIL", "sourceFileName": "sample.xlsx", "defaultLocale": "en_GB"},
            "locales": [
                {"code": "en_GB", "langSubtag": "en", "isRtl": False, "sourceColumn": "en_GB", "label": "English"},
                {"code": "ar_PS", "langSubtag": "ar", "isRtl": True, "sourceColumn": "C", "label": "Arabic"},
            ],
            "questions": [
                {
                    "id": "Q1",
                    "order": 1,
                    "controlType": "radio",
                    "headingByLocale": {"en_GB": "Which phone are you using?", "ar_PS": "هاتفي الآن هو"},
                    "subheadingByLocale": {"en_GB": "(Single answer)", "ar_PS": "(إجابة واحدة)"},
                    "required": True,
                    "answers": [
                        {"id": "A1", "order": 1, "textByLocale": {"en_GB": "Galaxy", "ar_PS": "جالاكسي"}},
                        {"id": "A2", "order": 2, "textByLocale": {"en_GB": "iPhone", "ar_PS": "آيفون"}},
                    ],
                },
                {
                    "id": "Q2",
                    "order": 2,
                    "controlType": "checkbox",
                    "headingByLocale": {"en_GB": "Interested products"},
                    "subheadingByLocale": {},
                    "required": False,
                    "answers": [{"id": "A1", "order": 1, "textByLocale": {"en_GB": "TV"}}],
                },
                {
                    "id": "Q3",
                    "order": 3,
                    "controlType": "text",
                    "headingByLocale": {"en_GB": "Any other comments?"},
                    "subheadingByLocale": {},
                    "required": False,
                    "answers": [],
                },
            ],
            "fields": {
                "firstName": {"labelByLocale": {"en_GB": "First name"}},
                "lastName": {"labelByLocale": {"en_GB": "Last name"}},
                "email": {"labelByLocale": {"en_GB": "Email"}},
                "callingCode": {"labelByLocale": {"en_GB": "Mobile number"}, "dropdownFirstEntryByLocale": {"en_GB": "Select"}},
                "countryCode": {"labelByLocale": {"en_GB": "Country"}},
                "privacyPolicy": {
                    "textByLocale": {"en_GB": "I have read the privacy policy", "ar_PS": "أقر بأنني قد قرأت"},
                    "linkUrlByLocale": {"en_GB": "https://example.com/privacy"},
                    "required": True,
                },
                "marketingOptin": {"labelByLocale": {"en_GB": "I want marketing info"}, "required": False},
                "termsAndConditions": {"textByLocale": {"en_GB": "Terms apply"}, "urlByLocale": {"en_GB": "https://example.com/terms"}},
                "additionalConsents": [{"id": "consentExtra1", "order": 1, "textByLocale": {"en_GB": "Extra consent"}, "required": True}],
                "submitButton": {"labelByLocale": {"en_GB": "Submit"}},
            },
            "validationMessages": {},
            "pageError": {},
            "thankYou": {},
        }
    )


def test_expands_multi_option_question_into_one_row_per_answer():
    rows = build_question_master_rows(_sample_form(), "MX", "F2H26")
    en_rows = [r for r in rows if r["locale"] == "en_GB"]
    q1_rows = [r for r in en_rows if r["question_code"] == "Q1"]
    assert len(q1_rows) == 2
    assert all(r["question_text_full"] == "Which phone are you using?" for r in q1_rows)
    assert all(r["mandatory_yn"] == "Y" for r in q1_rows)
    assert all(r["local_yn"] == "Standard" for r in q1_rows)
    assert [r["answer_code"] for r in q1_rows] == ["A1", "A2"]
    assert [r["answer_text_full"] for r in q1_rows] == ["Galaxy", "iPhone"]


def test_derives_answer_code_from_dom_order_not_raw_id():
    rows = build_question_master_rows(_sample_form(), "MX", "F2H26")
    ar_rows = [r for r in rows if r["locale"] == "ar_PS"]
    q1_ar_rows = [r for r in ar_rows if r["question_code"] == "Q1"]
    assert [r["answer_code"] for r in q1_ar_rows] == ["A1", "A2"]
    assert [r["answer_text_full"] for r in q1_ar_rows] == ["جالاكسي", "آيفون"]
    # answer_text_alias is always the answer's own default-locale (English) text.
    assert [r["answer_text_alias"] for r in q1_ar_rows] == ["Galaxy", "iPhone"]


def test_sets_type_per_control_type():
    rows = build_question_master_rows(_sample_form(), "MX", "F2H26")
    en_rows = [r for r in rows if r["locale"] == "en_GB"]
    assert all(r["type"] == "Single" for r in en_rows if r["question_code"] == "Q1")
    assert all(r["type"] == "Multi" for r in en_rows if r["question_code"] == "Q2")


def test_emits_single_self_referential_row_for_free_text_question():
    rows = build_question_master_rows(_sample_form(), "MX", "F2H26")
    en_rows = [r for r in rows if r["locale"] == "en_GB"]
    q3_rows = [r for r in en_rows if r["question_code"] == "Q3"]
    assert len(q3_rows) == 1
    assert q3_rows[0]["type"] == "Free text"
    assert q3_rows[0]["answer_code"] == "Q3"
    assert q3_rows[0]["answer_text_full"] == q3_rows[0]["question_text_full"]
    assert q3_rows[0]["answer_text_alias"] == q3_rows[0]["question_text_alias"]


def test_classifies_local_yn_correctly():
    rows = build_question_master_rows(_sample_form(), "MX", "F2H26")
    en_rows = [r for r in rows if r["locale"] == "en_GB"]
    by_code = {r["answer_code"]: r for r in en_rows}
    assert by_code["mobileNumber"]["local_yn"] == "Local"
    assert by_code["PRIVACY POLICY_YN"]["local_yn"] == "Local"
    assert by_code["Country"]["local_yn"] == "Local"

    assert by_code["firstName"]["local_yn"] == "Standard"
    assert by_code["lastName"]["local_yn"] == "Standard"
    assert by_code["email"]["local_yn"] == "Standard"
    assert by_code["MKT_AGE_YN"]["local_yn"] == "Standard"
    assert by_code["termsAndConditionsLink"]["local_yn"] == "Standard"
    assert by_code["consentExtra1"]["local_yn"] == "Standard"


def test_derives_mandatory_yn():
    rows = build_question_master_rows(_sample_form(), "MX", "F2H26")
    en_rows = [r for r in rows if r["locale"] == "en_GB"]
    by_code = {r["answer_code"]: r for r in en_rows}
    assert by_code["firstName"]["mandatory_yn"] == "Y"
    assert by_code["mobileNumber"]["mandatory_yn"] == "Y"
    assert by_code["PRIVACY POLICY_YN"]["mandatory_yn"] == "Y"
    assert by_code["MKT_AGE_YN"]["mandatory_yn"] == "N"
    assert by_code["consentExtra1"]["mandatory_yn"] == "Y"


def test_uses_generated_html_input_id_as_answer_code():
    rows = build_question_master_rows(_sample_form(), "MX", "F2H26")
    en_rows = [r for r in rows if r["locale"] == "en_GB"]
    by_code = {r["question_code"]: r for r in en_rows}
    assert by_code["FIRSTNAME"]["answer_code"] == "firstName"
    assert by_code["LASTNAME"]["answer_code"] == "lastName"
    assert by_code["EMAIL"]["answer_code"] == "email"
    assert by_code["HPP_CODE"]["answer_code"] == "mobileNumber"


def test_sets_type_per_field_kind():
    rows = build_question_master_rows(_sample_form(), "MX", "F2H26")
    en_rows = [r for r in rows if r["locale"] == "en_GB"]
    by_code = {r["question_code"]: r for r in en_rows}
    assert by_code["FIRSTNAME"]["type"] == "Free text"
    assert by_code["TERMS_AND_CONDITIONS"]["type"] == "Free text"
    assert by_code["PRIVACY POLICY_YN"]["type"] == "checkbox"
    assert by_code["MKT_AGE_YN"]["type"] == "checkbox"
    assert by_code["consentExtra1"]["type"] == "checkbox"
    assert by_code["Country"]["type"] == "dropdown"


def test_uses_fixed_literal_aliases():
    rows = build_question_master_rows(_sample_form(), "MX", "F2H26")
    en_rows = [r for r in rows if r["locale"] == "en_GB"]
    by_code = {r["question_code"]: r for r in en_rows}
    assert by_code["FIRSTNAME"]["question_text_alias"] == "firstname"
    assert by_code["PRIVACY POLICY_YN"]["answer_text_alias"] == "1 or 0"
    assert by_code["MKT_AGE_YN"]["answer_text_alias"] == "1 or 0"
    assert by_code["Country"]["answer_text_alias"] == "COUNTRY"


def test_caps_every_cell_at_255_characters():
    form = _sample_form()
    long_text = "x" * 400
    form.questions[0].headingByLocale["en_GB"] = long_text
    form.questions[0].answers[0].textByLocale["en_GB"] = long_text
    long_rows = build_question_master_rows(form, "MX", "F2H26")
    for row in long_rows:
        for value in row.values():
            if isinstance(value, str):
                assert len(value) <= 255


def test_omits_rows_for_absent_optional_fields():
    form = _sample_form()
    form.fields.termsAndConditions = None
    form.fields.additionalConsents = None
    no_extras = build_question_master_rows(form, "MX", "F2H26")
    assert not any(r["question_code"] == "TERMS_AND_CONDITIONS" for r in no_extras)
    assert not any(r["question_code"] == "consentExtra1" for r in no_extras)
