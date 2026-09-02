"""Python port of packages/shared/tests/form/contribution.test.ts."""

from __future__ import annotations

from typing import Any

from app.form_pipeline.form.contribution import ContributionContent, apply_contribution, validate_contribution
from app.form_pipeline.form.definition import FormDefinition


def _base_form(**overrides: Any) -> FormDefinition:
    data: dict[str, Any] = {
        "meta": {"subsidiary": "TEST", "sourceFileName": "", "defaultLocale": "en_GB"},
        "locales": [
            {"code": "en_GB", "langSubtag": "en", "isRtl": False, "sourceColumn": "en_GB", "label": "English"},
            {"code": "ar_AE", "langSubtag": "ar", "isRtl": True, "sourceColumn": "C", "label": "Arabic"},
        ],
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
        "fields": {
            "firstName": {"labelByLocale": {"en_GB": "First Name"}},
            "privacyPolicy": {"textByLocale": {"en_GB": "I agree"}, "linkUrlByLocale": {"en_GB": "https://x"}},
            "additionalConsents": [{"id": "consentExtra1", "order": 1, "textByLocale": {"en_GB": "Send me updates"}}],
            "submitButton": {"labelByLocale": {"en_GB": "Submit"}},
        },
        "validationMessages": {},
        "pageError": {},
        "thankYou": {},
    }
    data.update(overrides)
    return FormDefinition.model_validate(data)


def _empty_content(**overrides: Any) -> ContributionContent:
    data: dict[str, Any] = {
        "translations": [],
        "newQuestions": [],
        "newConsents": [],
        "autoPopulateToggles": [],
        "deletedQuestionIds": [],
        "newAnswers": [],
        "deletedAnswerIds": [],
    }
    data.update(overrides)
    return ContributionContent.model_validate(data)


# ---- applyContribution ----


def test_adds_a_non_default_locale_translation_without_touching_the_default_locale_text():
    form = _base_form()
    content = _empty_content(
        translations=[{"target": {"kind": "profileLabel", "field": "firstName"}, "locale": "ar_AE", "value": "الاسم الأول"}]
    )
    next_form = apply_contribution(form, content)
    assert next_form.fields.firstName.labelByLocale == {"en_GB": "First Name", "ar_AE": "الاسم الأول"}
    assert form.fields.firstName.labelByLocale == {"en_GB": "First Name"}  # base untouched — pure


def test_translates_various_target_kinds():
    form = _base_form()
    content = _empty_content(
        translations=[
            {"target": {"kind": "questionHeading", "questionId": "Q1"}, "locale": "ar_AE", "value": "اختر واحدا"},
            {"target": {"kind": "answerText", "questionId": "Q1", "answerId": "A1"}, "locale": "ar_AE", "value": "نعم"},
            {"target": {"kind": "privacyPolicyText"}, "locale": "ar_AE", "value": "أوافق"},
            {"target": {"kind": "privacyPolicyLink"}, "locale": "ar_AE", "value": "https://x-ar"},
            {"target": {"kind": "consentText", "consentId": "consentExtra1"}, "locale": "ar_AE", "value": "أرسل التحديثات"},
        ]
    )
    next_form = apply_contribution(form, content)
    assert next_form.questions[0].headingByLocale["ar_AE"] == "اختر واحدا"
    assert next_form.questions[0].answers[0].textByLocale["ar_AE"] == "نعم"
    assert next_form.fields.privacyPolicy.textByLocale["ar_AE"] == "أوافق"
    assert next_form.fields.privacyPolicy.linkUrlByLocale["ar_AE"] == "https://x-ar"
    assert next_form.fields.additionalConsents[0].textByLocale["ar_AE"] == "أرسل التحديثات"


def test_silently_skips_translation_targeting_nonexistent_id():
    form = _base_form()
    content = _empty_content(translations=[{"target": {"kind": "questionHeading", "questionId": "Q99"}, "locale": "ar_AE", "value": "x"}])
    apply_contribution(form, content)  # must not raise


def test_appends_new_questions_renumbering_regardless_of_submitted_ids():
    form = _base_form()
    content = _empty_content(
        newQuestions=[
            {
                "id": "Q1",  # deliberately colliding — must be reassigned
                "order": 1,
                "controlType": "shortText",
                "headingByLocale": {"en_GB": "New question"},
                "subheadingByLocale": {},
                "required": False,
                "answers": [],
            }
        ]
    )
    next_form = apply_contribution(form, content)
    assert len(next_form.questions) == 2
    assert next_form.questions[0].id == "Q1"
    assert next_form.questions[0].headingByLocale["en_GB"] == "Pick one"  # original untouched
    assert next_form.questions[1].id == "Q2"
    assert next_form.questions[1].order == 2
    assert next_form.questions[1].headingByLocale["en_GB"] == "New question"


def test_appends_new_consents_renumbering():
    form = _base_form()
    content = _empty_content(newConsents=[{"id": "consentExtra1", "order": 1, "textByLocale": {"en_GB": "Another consent"}}])
    next_form = apply_contribution(form, content)
    assert len(next_form.fields.additionalConsents) == 2
    assert next_form.fields.additionalConsents[0].textByLocale["en_GB"] == "Send me updates"
    assert next_form.fields.additionalConsents[1].id == "consentExtra2"
    assert next_form.fields.additionalConsents[1].textByLocale["en_GB"] == "Another consent"


def test_turns_auto_populate_on_for_eligible_question():
    form = _base_form()
    form.questions[0].autoPopulateEligible = True
    content = _empty_content(autoPopulateToggles=[{"questionId": "Q1", "enabled": True}])
    next_form = apply_contribution(form, content)
    assert next_form.questions[0].autoPopulateEnabled is True
    assert form.questions[0].autoPopulateEnabled is None  # base untouched


def test_silently_skips_auto_populate_toggle_for_ineligible_question():
    form = _base_form()  # Q1 has no autoPopulateEligible flag set
    content = _empty_content(autoPopulateToggles=[{"questionId": "Q1", "enabled": True}])
    next_form = apply_contribution(form, content)
    assert next_form.questions[0].autoPopulateEnabled is None


def test_silently_skips_auto_populate_toggle_for_nonexistent_question():
    form = _base_form()
    content = _empty_content(autoPopulateToggles=[{"questionId": "Q99", "enabled": True}])
    apply_contribution(form, content)  # must not raise


def test_deletes_unlocked_question_and_renumbers():
    form = _base_form()
    form.questions.append(
        form.questions[0].model_copy(
            update={
                "id": "Q2",
                "order": 2,
                "controlType": "shortText",
                "headingByLocale": {"en_GB": "Second question"},
                "answers": [],
            }
        )
    )
    content = _empty_content(deletedQuestionIds=["Q1"])
    next_form = apply_contribution(form, content)
    assert len(next_form.questions) == 1
    assert next_form.questions[0].id == "Q1"  # old Q2 renumbered down to Q1
    assert next_form.questions[0].headingByLocale["en_GB"] == "Second question"
    assert len(form.questions) == 2  # base untouched


def test_never_deletes_a_locked_question():
    form = _base_form()
    form.questions[0].lockedFromSubsidiary = True
    content = _empty_content(deletedQuestionIds=["Q1"])
    next_form = apply_contribution(form, content)
    assert len(next_form.questions) == 1
    assert next_form.questions[0].id == "Q1"


def test_adds_a_new_answer_option():
    form = _base_form()
    content = _empty_content(newAnswers=[{"questionId": "Q1", "answer": {"id": "tmp", "order": 0, "textByLocale": {"en_GB": "No"}}}])
    next_form = apply_contribution(form, content)
    assert len(next_form.questions[0].answers) == 2
    assert next_form.questions[0].answers[1].id == "A2"
    assert next_form.questions[0].answers[1].textByLocale["en_GB"] == "No"
    assert len(form.questions[0].answers) == 1  # base untouched


def test_removes_an_answer_option_locked_or_not():
    form = _base_form()
    form.questions[0].lockedFromSubsidiary = True
    content = _empty_content(deletedAnswerIds=[{"questionId": "Q1", "answerId": "A1"}])
    next_form = apply_contribution(form, content)
    assert len(next_form.questions[0].answers) == 0


# ---- validateContribution ----


def test_passes_a_well_formed_contribution():
    form = _base_form()
    content = _empty_content(translations=[{"target": {"kind": "profileLabel", "field": "firstName"}, "locale": "ar_AE", "value": "الاسم"}])
    assert validate_contribution(form, content).errors == []


def test_allows_translation_to_target_default_locale():
    form = _base_form()
    content = _empty_content(translations=[{"target": {"kind": "profileLabel", "field": "firstName"}, "locale": "en_GB", "value": "Changed"}])
    assert validate_contribution(form, content).errors == []


def test_errors_when_translation_targets_nonexistent_locale():
    form = _base_form()
    content = _empty_content(translations=[{"target": {"kind": "profileLabel", "field": "firstName"}, "locale": "he_IL", "value": "x"}])
    result = validate_contribution(form, content)
    assert any("he_IL" in e.message for e in result.errors)


def test_errors_when_translation_targets_nonexistent_ids():
    form = _base_form()
    content = _empty_content(
        translations=[
            {"target": {"kind": "questionHeading", "questionId": "Q99"}, "locale": "ar_AE", "value": "x"},
            {"target": {"kind": "answerText", "questionId": "Q1", "answerId": "A99"}, "locale": "ar_AE", "value": "x"},
            {"target": {"kind": "consentText", "consentId": "consentExtra99"}, "locale": "ar_AE", "value": "x"},
        ]
    )
    result = validate_contribution(form, content)
    assert len(result.errors) == 3


def test_errors_when_a_new_choice_type_question_has_no_options():
    form = _base_form()
    content = _empty_content(
        newQuestions=[
            {"id": "Qx", "order": 1, "controlType": "radio", "headingByLocale": {"en_GB": "Empty"}, "subheadingByLocale": {}, "required": True, "answers": []}
        ]
    )
    result = validate_contribution(form, content)
    assert any("has no options" in e.message for e in result.errors)


def test_allows_translation_targeting_default_locale_on_single_locale_form():
    form = _base_form(locales=[{"code": "en_GB", "langSubtag": "en", "isRtl": False, "sourceColumn": "en_GB", "label": "English"}])
    content = _empty_content(translations=[{"target": {"kind": "profileLabel", "field": "firstName"}, "locale": "en_GB", "value": "Changed"}])
    assert validate_contribution(form, content).errors == []


def test_passes_auto_populate_toggle_for_eligible_question():
    form = _base_form()
    form.questions[0].autoPopulateEligible = True
    content = _empty_content(autoPopulateToggles=[{"questionId": "Q1", "enabled": True}])
    assert validate_contribution(form, content).errors == []


def test_errors_when_auto_populate_toggle_targets_ineligible_question():
    form = _base_form()  # Q1 has no autoPopulateEligible flag set
    content = _empty_content(autoPopulateToggles=[{"questionId": "Q1", "enabled": True}])
    result = validate_contribution(form, content)
    assert any("isn't eligible" in e.message for e in result.errors)


def test_errors_when_auto_populate_toggle_targets_nonexistent_question():
    form = _base_form()
    content = _empty_content(autoPopulateToggles=[{"questionId": "Q99", "enabled": True}])
    result = validate_contribution(form, content)
    assert any("isn't eligible" in e.message for e in result.errors)


def test_passes_deleting_an_unlocked_question():
    form = _base_form()
    content = _empty_content(deletedQuestionIds=["Q1"])
    assert validate_contribution(form, content).errors == []


def test_errors_when_deleting_a_locked_question():
    form = _base_form()
    form.questions[0].lockedFromSubsidiary = True
    content = _empty_content(deletedQuestionIds=["Q1"])
    result = validate_contribution(form, content)
    assert any("locked by the admin" in e.message for e in result.errors)


def test_errors_when_deleting_a_nonexistent_question():
    form = _base_form()
    content = _empty_content(deletedQuestionIds=["Q99"])
    result = validate_contribution(form, content)
    assert any("no longer exists" in e.message for e in result.errors)


def test_passes_adding_removing_answer_on_locked_question():
    form = _base_form()
    form.questions[0].lockedFromSubsidiary = True
    content = _empty_content(
        newAnswers=[{"questionId": "Q1", "answer": {"id": "tmp", "order": 0, "textByLocale": {"en_GB": "No"}}}],
        deletedAnswerIds=[{"questionId": "Q1", "answerId": "A1"}],
    )
    assert validate_contribution(form, content).errors == []


def test_errors_when_deleting_a_nonexistent_answer():
    form = _base_form()
    content = _empty_content(deletedAnswerIds=[{"questionId": "Q1", "answerId": "A99"}])
    result = validate_contribution(form, content)
    assert any("no longer exists" in e.message for e in result.errors)
