"""Unit tests for app/services/html_structure_patch.py — pure string/data
functions, no DB or HTTP needed. Builds small, realistic HTML snippets with
render_question_module itself (the same function publish_form uses) so the
synthetic markup matches exactly what a real generated file looks like.
"""

from __future__ import annotations

import json
from typing import Literal, Optional

from app.form_pipeline.codegen.file_names import resolve_file_names
from app.form_pipeline.codegen.html.fragments.render_question_module import render_question_module
from app.form_pipeline.codegen.html.page_template import render_page
from app.form_pipeline.codegen.types import BuilderConfig
from app.form_pipeline.form.definition import (
    AnswerDefinition,
    CallingCodeFieldMeta,
    ConsentDefinition,
    ConsentToggleMeta,
    FormDefinition,
    FormMeta,
    LocaleInfo,
    LocalizedFieldMeta,
    MobileNumberFieldMeta,
    PageCopy,
    PrivacyPolicyMeta,
    ProfileFieldSet,
    QuestionDefinition,
    ReCaptchaMeta,
    TermsAndConditionsMeta,
)
from app.services.form_builder_service import compute_structure_fingerprint
from app.services.html_structure_patch import diff_consents, diff_questions, patch_html_for_field_diff, patch_html_for_question_diff


def _question(qid: str, order: int, answer_ids: list[str] | None = None, control_type: str = "radio") -> QuestionDefinition:
    answers = [AnswerDefinition(id=aid, order=i + 1, textByLocale={"en_GB": aid}) for i, aid in enumerate(answer_ids or [])]
    return QuestionDefinition(
        id=qid, order=order, controlType=control_type, headingByLocale={"en_GB": qid}, required=False, answers=answers
    )


def _page_with_questions(questions: list[QuestionDefinition]) -> str:
    """A minimal page skeleton — just enough structure for the patch
    functions to anchor on (the real `<div class="form_check_group">`
    wrapper, plus the questions' own modules), standing in for a full
    generated page."""
    modules = "".join(render_question_module(q) for q in questions)
    return f'<html><body><div class="form_check_group">{modules}</div></body></html>'


class _FakeDefinition:
    """A tiny stand-in for FormDefinition — patch_html_for_question_diff only
    ever reads `.questions` off it."""

    def __init__(self, questions: list[QuestionDefinition]):
        self.questions = questions


def _structure(questions: list[QuestionDefinition]) -> dict:
    return {
        "questions": [q.id for q in questions],
        "answers": {q.id: [a.id for a in q.answers] for q in questions},
    }


class TestDiffQuestions:
    def test_detects_added_and_removed_questions(self):
        old = _structure([_question("Q1", 1), _question("Q2", 2)])
        new_def = _FakeDefinition([_question("Q1", 1), _question("Q3", 2)])
        diff = diff_questions(old, new_def)
        assert diff.added_question_ids == ["Q3"]
        assert diff.removed_question_ids == ["Q2"]
        assert diff.questions_with_changed_answers == []
        assert diff.is_patchable

    def test_detects_an_answer_set_change_on_an_existing_question(self):
        old = _structure([_question("Q1", 1, ["A1", "A2"])])
        new_def = _FakeDefinition([_question("Q1", 1, ["A1", "A2", "A3"])])
        diff = diff_questions(old, new_def)
        assert diff.added_question_ids == []
        assert diff.removed_question_ids == []
        assert diff.questions_with_changed_answers == ["Q1"]
        assert not diff.is_patchable

    def test_no_change_is_empty_and_patchable(self):
        old = _structure([_question("Q1", 1, ["A1"])])
        new_def = _FakeDefinition([_question("Q1", 1, ["A1"])])
        diff = diff_questions(old, new_def)
        assert diff.added_question_ids == []
        assert diff.removed_question_ids == []
        assert diff.questions_with_changed_answers == []
        assert diff.is_patchable


class TestPatchHtmlForQuestionDiff:
    def test_inserts_a_new_last_question_after_the_existing_one(self):
        q1 = _question("Q1", 1, ["A1", "A2"])
        q2 = _question("Q2", 2, ["A1"])
        html = _page_with_questions([q1])
        new_def = _FakeDefinition([q1, q2])
        diff = diff_questions(_structure([q1]), new_def)

        patched = patch_html_for_question_diff(html, diff, new_def, "ff")
        assert patched is not None
        assert patched.index('id="Q1"') < patched.index('id="Q2"')
        assert render_question_module(q2) in patched

    def test_inserts_a_new_first_question_before_the_existing_one(self):
        q1 = _question("Q1", 1)
        q0 = _question("Q0", 1)
        html = _page_with_questions([q1])
        new_def = _FakeDefinition([q0, q1])
        diff = diff_questions(_structure([q1]), new_def)

        patched = patch_html_for_question_diff(html, diff, new_def, "ff")
        assert patched is not None
        assert patched.index('id="Q0"') < patched.index('id="Q1"')

    def test_inserts_a_new_middle_question_between_two_existing_ones(self):
        q1 = _question("Q1", 1)
        q3 = _question("Q3", 3)
        q2 = _question("Q2", 2)
        html = _page_with_questions([q1, q3])
        new_def = _FakeDefinition([q1, q2, q3])
        diff = diff_questions(_structure([q1, q3]), new_def)

        patched = patch_html_for_question_diff(html, diff, new_def, "ff")
        assert patched is not None
        assert patched.index('id="Q1"') < patched.index('id="Q2"') < patched.index('id="Q3"')

    def test_removes_a_deleted_question_and_leaves_the_others(self):
        q1 = _question("Q1", 1)
        q2 = _question("Q2", 2)
        q3 = _question("Q3", 3)
        html = _page_with_questions([q1, q2, q3])
        new_def = _FakeDefinition([q1, q3])
        diff = diff_questions(_structure([q1, q2, q3]), new_def)

        patched = patch_html_for_question_diff(html, diff, new_def, "ff")
        assert patched is not None
        assert 'id="Q2"' not in patched
        assert 'id="Q1"' in patched and 'id="Q3"' in patched

    def test_preserves_an_unrelated_hand_edit_elsewhere_in_the_file(self):
        q1 = _question("Q1", 1)
        q2 = _question("Q2", 2)
        html = _page_with_questions([q1]).replace("<body>", "<body><!-- redirect handled elsewhere -->")
        new_def = _FakeDefinition([q1, q2])
        diff = diff_questions(_structure([q1]), new_def)

        patched = patch_html_for_question_diff(html, diff, new_def, "ff")
        assert patched is not None
        assert "<!-- redirect handled elsewhere -->" in patched

    def test_only_inserts_into_the_variant_the_question_is_visible_in(self):
        q1 = _question("Q1", 1)
        q2 = _question("Q2", 2)
        q2.visibleInVariants = ["oc"]
        html = _page_with_questions([q1])
        new_def = _FakeDefinition([q1, q2])
        diff = diff_questions(_structure([q1]), new_def)

        ff_patched = patch_html_for_question_diff(html, diff, new_def, "ff")
        assert ff_patched is not None
        assert 'id="Q2"' not in ff_patched  # not visible in ff — nothing to insert here

        oc_patched = patch_html_for_question_diff(html, diff, new_def, "oc")
        assert oc_patched is not None
        assert 'id="Q2"' in oc_patched

    def test_returns_none_when_an_answer_set_also_changed(self):
        """Not surgically mergeable (see module doc comment) — the caller
        must fall back to the existing warn-and-confirm flow for the whole
        file rather than a partial merge."""
        q1 = _question("Q1", 1, ["A1"])
        q2 = _question("Q2", 2)
        html = _page_with_questions([q1])
        new_q1 = _question("Q1", 1, ["A1", "A2"])
        new_def = _FakeDefinition([new_q1, q2])
        diff = diff_questions(_structure([q1]), new_def)

        assert patch_html_for_question_diff(html, diff, new_def, "ff") is None

    def test_returns_none_when_the_anchor_question_is_missing_from_the_html(self):
        """The hand-edit itself removed/renamed Q1's module — can't safely
        guess where a new Q2 belongs, so it bails out rather than guess."""
        q1 = _question("Q1", 1)
        q2 = _question("Q2", 2)
        html = '<html><body><div class="form_check_group"></div></body></html>'  # Q1's module isn't here at all
        new_def = _FakeDefinition([q1, q2])
        diff = diff_questions(_structure([q1]), new_def)

        patched = patch_html_for_question_diff(html, diff, new_def, "ff")
        # No earlier sibling is found, but the form_check_group container
        # itself is still intact, so this still succeeds by inserting at
        # the start of it — a genuinely missing container is covered below.
        assert patched is not None
        assert 'id="Q2"' in patched

    def test_returns_none_when_the_form_check_group_container_itself_is_gone(self):
        q1 = _question("Q1", 1)
        html = "<html><body>completely hand-rewritten, no recognizable structure left</body></html>"
        new_def = _FakeDefinition([q1])
        diff = diff_questions(_structure([]), new_def)

        assert patch_html_for_question_diff(html, diff, new_def, "ff") is None


def _fields(**kwargs) -> ProfileFieldSet:
    """Every ProfileFieldSet needs a submitButton (the only non-optional
    field) — everything else defaults to absent unless overridden."""
    return ProfileFieldSet(submitButton=LocalizedFieldMeta(labelByLocale={"en_GB": "Submit"}), **kwargs)


def _form(fields: ProfileFieldSet, questions: Optional[list[QuestionDefinition]] = None) -> FormDefinition:
    return FormDefinition(
        meta=FormMeta(subsidiary="TEST", sourceFileName="sample.xlsx", defaultLocale="en_GB"),
        locales=[LocaleInfo(code="en_GB", langSubtag="en", isRtl=False, sourceColumn="en_GB", label="English")],
        questions=questions or [],
        fields=fields,
        validationMessages={},
        pageError={"en_GB": PageCopy(heading="Oops")},
        thankYou={"en_GB": PageCopy(heading="Thanks")},
    )


def _fresh_html(fields: ProfileFieldSet, variant: Literal["ff", "oc"] = "ff") -> str:
    """The real, full pipeline's own output for `fields` — the ground truth
    a correct patch must reproduce exactly."""
    form = _form(fields)
    config = BuilderConfig()
    return render_page(form, config, variant, resolve_file_names(form, config))


def _round_trip(old_fields: ProfileFieldSet, new_fields: ProfileFieldSet, variant: Literal["ff", "oc"] = "ff") -> Optional[str]:
    """Generates `old_fields`'s real page, then patches it to `new_fields`
    using only the patch module (never regenerating) — the same path
    publish_form takes for a hand-edited HTML file."""
    old_html = _fresh_html(old_fields, variant)
    old_structure = json.loads(compute_structure_fingerprint(_form(old_fields)))
    new_form = _form(new_fields)
    removed_consent_ids = diff_consents(old_structure, new_form)
    return patch_html_for_field_diff(old_html, removed_consent_ids, new_form, variant)


class TestPatchHtmlForFieldDiffTopGroup:
    def test_adding_email_reproduces_a_fresh_page_exactly(self):
        old = _fields()
        new = _fields(email=LocalizedFieldMeta(labelByLocale={"en_GB": "Email"}))
        patched = _round_trip(old, new)
        assert patched == _fresh_html(new)

    def test_removing_email_reproduces_a_fresh_page_exactly(self):
        old = _fields(email=LocalizedFieldMeta(labelByLocale={"en_GB": "Email"}))
        new = _fields()
        patched = _round_trip(old, new)
        fresh = _fresh_html(new)
        assert patched == fresh

    def test_adding_country_code_reproduces_a_fresh_page_exactly(self):
        old = _fields()
        new = _fields(countryCode=LocalizedFieldMeta())
        patched = _round_trip(old, new)
        assert patched == _fresh_html(new)

    def test_removing_country_code_reproduces_a_fresh_page_exactly(self):
        old = _fields(countryCode=LocalizedFieldMeta())
        new = _fields()
        patched = _round_trip(old, new)
        assert patched == _fresh_html(new)

    def test_an_unrelated_hand_edit_elsewhere_survives_a_field_merge(self):
        old = _fields()
        new = _fields(email=LocalizedFieldMeta(labelByLocale={"en_GB": "Email"}))
        old_html = _fresh_html(old).replace("<body>", "<body><!-- redirect handled elsewhere -->")
        old_structure = json.loads(compute_structure_fingerprint(_form(old)))
        new_form = _form(new)
        patched = patch_html_for_field_diff(old_html, diff_consents(old_structure, new_form), new_form, "ff")
        assert patched is not None
        assert "<!-- redirect handled elsewhere -->" in patched
        assert 'id="email"' in patched


class TestPatchHtmlForFieldDiffNamePair:
    def test_neither_to_both(self):
        old = _fields()
        new = _fields(
            firstName=LocalizedFieldMeta(labelByLocale={"en_GB": "First"}),
            lastName=LocalizedFieldMeta(labelByLocale={"en_GB": "Last"}),
        )
        assert _round_trip(old, new) == _fresh_html(new)

    def test_neither_to_first_name_only(self):
        old = _fields()
        new = _fields(firstName=LocalizedFieldMeta(labelByLocale={"en_GB": "First"}))
        assert _round_trip(old, new) == _fresh_html(new)

    def test_first_name_only_to_both(self):
        old = _fields(firstName=LocalizedFieldMeta(labelByLocale={"en_GB": "First"}))
        new = _fields(
            firstName=LocalizedFieldMeta(labelByLocale={"en_GB": "First"}),
            lastName=LocalizedFieldMeta(labelByLocale={"en_GB": "Last"}),
        )
        assert _round_trip(old, new) == _fresh_html(new)

    def test_last_name_only_to_both(self):
        old = _fields(lastName=LocalizedFieldMeta(labelByLocale={"en_GB": "Last"}))
        new = _fields(
            firstName=LocalizedFieldMeta(labelByLocale={"en_GB": "First"}),
            lastName=LocalizedFieldMeta(labelByLocale={"en_GB": "Last"}),
        )
        assert _round_trip(old, new) == _fresh_html(new)

    def test_both_to_first_name_only(self):
        old = _fields(
            firstName=LocalizedFieldMeta(labelByLocale={"en_GB": "First"}),
            lastName=LocalizedFieldMeta(labelByLocale={"en_GB": "Last"}),
        )
        new = _fields(firstName=LocalizedFieldMeta(labelByLocale={"en_GB": "First"}))
        assert _round_trip(old, new) == _fresh_html(new)

    def test_both_to_last_name_only(self):
        old = _fields(
            firstName=LocalizedFieldMeta(labelByLocale={"en_GB": "First"}),
            lastName=LocalizedFieldMeta(labelByLocale={"en_GB": "Last"}),
        )
        new = _fields(lastName=LocalizedFieldMeta(labelByLocale={"en_GB": "Last"}))
        assert _round_trip(old, new) == _fresh_html(new)

    def test_both_to_neither(self):
        old = _fields(
            firstName=LocalizedFieldMeta(labelByLocale={"en_GB": "First"}),
            lastName=LocalizedFieldMeta(labelByLocale={"en_GB": "Last"}),
        )
        new = _fields()
        assert _round_trip(old, new) == _fresh_html(new)

    def test_no_change_leaves_the_page_untouched(self):
        both = _fields(
            firstName=LocalizedFieldMeta(labelByLocale={"en_GB": "First"}),
            lastName=LocalizedFieldMeta(labelByLocale={"en_GB": "Last"}),
        )
        assert _round_trip(both, both) == _fresh_html(both)


class TestPatchHtmlForFieldDiffMobileGroup:
    def test_adding_mobile_number_ff_reproduces_a_fresh_page_exactly(self):
        old = _fields()
        new = _fields(mobileNumber=MobileNumberFieldMeta(required=True))
        assert _round_trip(old, new) == _fresh_html(new)

    def test_removing_mobile_group_ff_reproduces_a_fresh_page_exactly(self):
        old = _fields(callingCode=CallingCodeFieldMeta(), mobileNumber=MobileNumberFieldMeta())
        new = _fields()
        assert _round_trip(old, new) == _fresh_html(new)

    def test_adding_mobile_group_oc_reproduces_a_fresh_page_exactly(self):
        old = _fields()
        new = _fields(callingCode=CallingCodeFieldMeta(), mobileNumber=MobileNumberFieldMeta())
        assert _round_trip(old, new, "oc") == _fresh_html(new, "oc")

    def test_removing_mobile_group_oc_reproduces_a_fresh_page_exactly(self):
        old = _fields(mobileNumber=MobileNumberFieldMeta())
        new = _fields()
        assert _round_trip(old, new, "oc") == _fresh_html(new, "oc")


class TestPatchHtmlForFieldDiffConsents:
    def test_adding_privacy_policy_reproduces_a_fresh_page_exactly(self):
        old = _fields()
        new = _fields(privacyPolicy=PrivacyPolicyMeta())
        assert _round_trip(old, new) == _fresh_html(new)

    def test_removing_privacy_policy_reproduces_a_fresh_page_exactly(self):
        old = _fields(privacyPolicy=PrivacyPolicyMeta())
        new = _fields()
        assert _round_trip(old, new) == _fresh_html(new)

    def test_adding_marketing_optin_reproduces_a_fresh_page_exactly(self):
        old = _fields()
        new = _fields(marketingOptin=ConsentToggleMeta(required=True))
        assert _round_trip(old, new) == _fresh_html(new)

    def test_adding_privacy_policy_and_marketing_optin_at_once_keeps_order(self):
        old = _fields()
        new = _fields(privacyPolicy=PrivacyPolicyMeta(), marketingOptin=ConsentToggleMeta())
        assert _round_trip(old, new) == _fresh_html(new)

    def test_adding_one_additional_consent_reproduces_a_fresh_page_exactly(self):
        old = _fields()
        new = _fields(additionalConsents=[ConsentDefinition(id="consentExtra1", order=1)])
        assert _round_trip(old, new) == _fresh_html(new)

    def test_adding_a_second_additional_consent_keeps_the_first_and_the_order(self):
        old = _fields(additionalConsents=[ConsentDefinition(id="consentExtra1", order=1)])
        new = _fields(
            additionalConsents=[
                ConsentDefinition(id="consentExtra1", order=1),
                ConsentDefinition(id="consentExtra2", order=2, linkUrlByLocale={"en_GB": "https://example.com"}),
            ]
        )
        assert _round_trip(old, new) == _fresh_html(new)

    def test_removing_one_of_two_additional_consents_keeps_the_other(self):
        old = _fields(
            additionalConsents=[
                ConsentDefinition(id="consentExtra1", order=1),
                ConsentDefinition(id="consentExtra2", order=2),
            ]
        )
        new = _fields(additionalConsents=[ConsentDefinition(id="consentExtra2", order=2)])
        assert _round_trip(old, new) == _fresh_html(new)

    def test_removing_the_last_consent_drops_the_whole_group_wrapper(self):
        old = _fields(additionalConsents=[ConsentDefinition(id="consentExtra1", order=1)])
        new = _fields()
        patched = _round_trip(old, new)
        assert patched == _fresh_html(new)
        assert "form_bottom_check_group" not in patched

    def test_terms_and_conditions_link_can_be_added_and_removed(self):
        old = _fields()
        new = _fields(termsAndConditions=TermsAndConditionsMeta())
        added = _round_trip(old, new)
        assert added == _fresh_html(new)
        removed = _round_trip(new, old)
        assert removed == _fresh_html(old)


class TestPatchHtmlForFieldDiffRecaptcha:
    def test_adding_recaptcha_ff_reproduces_a_fresh_page_exactly(self):
        old = _fields()
        new = _fields(recaptcha=ReCaptchaMeta())
        assert _round_trip(old, new) == _fresh_html(new)

    def test_removing_recaptcha_ff_reproduces_a_fresh_page_exactly(self):
        old = _fields(recaptcha=ReCaptchaMeta())
        new = _fields()
        assert _round_trip(old, new) == _fresh_html(new)

    def test_adding_recaptcha_oc_reproduces_a_fresh_page_exactly(self):
        old = _fields()
        new = _fields(recaptcha=ReCaptchaMeta(visibleInVariants=["oc"]))
        assert _round_trip(old, new, "oc") == _fresh_html(new, "oc")

    def test_enabling_oc_too_while_already_enabled_for_ff_reproduces_a_fresh_page_exactly(self):
        old = _fields(recaptcha=ReCaptchaMeta())
        new = _fields(recaptcha=ReCaptchaMeta(visibleInVariants=["ff", "oc"]))
        assert _round_trip(old, new, "ff") == _fresh_html(new, "ff")
        assert _round_trip(old, new, "oc") == _fresh_html(new, "oc")

    def test_recaptcha_coexists_with_an_existing_consent_group(self):
        old = _fields(privacyPolicy=PrivacyPolicyMeta())
        new = _fields(privacyPolicy=PrivacyPolicyMeta(), recaptcha=ReCaptchaMeta())
        assert _round_trip(old, new) == _fresh_html(new)

    def test_removing_recaptcha_while_a_consent_group_stays(self):
        old = _fields(privacyPolicy=PrivacyPolicyMeta(), recaptcha=ReCaptchaMeta())
        new = _fields(privacyPolicy=PrivacyPolicyMeta())
        assert _round_trip(old, new) == _fresh_html(new)

    def test_an_unrelated_hand_edit_survives_adding_recaptcha(self):
        old = _fields()
        new = _fields(recaptcha=ReCaptchaMeta())
        old_html = _fresh_html(old).replace("<body>", "<body><!-- redirect handled elsewhere -->")
        old_structure = json.loads(compute_structure_fingerprint(_form(old)))
        new_form = _form(new)
        patched = patch_html_for_field_diff(old_html, diff_consents(old_structure, new_form), new_form, "ff")
        assert patched is not None
        assert "<!-- redirect handled elsewhere -->" in patched
        assert 'id="g-recaptcha"' in patched
        assert "recaptcha/api.js" in patched


class TestPatchHtmlForFieldDiffSubmitConfirmation:
    def test_disabling_reproduces_a_fresh_page_exactly(self):
        old = _fields()
        new = _fields(submitConfirmationEnabled=False)
        assert _round_trip(old, new) == _fresh_html(new)

    def test_re_enabling_after_disabling_reproduces_a_fresh_page_exactly(self):
        old = _fields(submitConfirmationEnabled=False)
        new = _fields(submitConfirmationEnabled=True)
        assert _round_trip(old, new) == _fresh_html(new)

    def test_no_change_leaves_the_page_untouched(self):
        fields = _fields()
        assert _round_trip(fields, fields) == _fresh_html(fields)

    def test_an_unrelated_hand_edit_survives_disabling(self):
        old = _fields()
        new = _fields(submitConfirmationEnabled=False)
        old_html = _fresh_html(old).replace("<body>", "<body><!-- redirect handled elsewhere -->")
        old_structure = json.loads(compute_structure_fingerprint(_form(old)))
        new_form = _form(new)
        patched = patch_html_for_field_diff(old_html, diff_consents(old_structure, new_form), new_form, "ff")
        assert patched is not None
        assert "<!-- redirect handled elsewhere -->" in patched
        assert 'id="submitIntentPopup"' not in patched

    def test_oc_variant_also_patches(self):
        old = _fields()
        new = _fields(submitConfirmationEnabled=False)
        assert _round_trip(old, new, "oc") == _fresh_html(new, "oc")


class TestPatchHtmlForFieldDiffCombined:
    def test_everything_added_at_once_from_a_bare_page_reproduces_a_fresh_page_exactly(self):
        old = _fields()
        new = _fields(
            countryCode=LocalizedFieldMeta(),
            email=LocalizedFieldMeta(labelByLocale={"en_GB": "Email"}),
            firstName=LocalizedFieldMeta(labelByLocale={"en_GB": "First"}),
            lastName=LocalizedFieldMeta(labelByLocale={"en_GB": "Last"}),
            callingCode=CallingCodeFieldMeta(),
            mobileNumber=MobileNumberFieldMeta(required=True),
            privacyPolicy=PrivacyPolicyMeta(),
            marketingOptin=ConsentToggleMeta(required=True),
            additionalConsents=[ConsentDefinition(id="consentExtra1", order=1)],
            termsAndConditions=TermsAndConditionsMeta(),
            recaptcha=ReCaptchaMeta(visibleInVariants=["ff", "oc"]),
        )
        assert _round_trip(old, new) == _fresh_html(new)
        assert _round_trip(old, new, "oc") == _fresh_html(new, "oc")


class TestPatchHtmlForFieldDiffFallback:
    def test_returns_none_when_form_top_group_itself_is_gone(self):
        new = _fields(email=LocalizedFieldMeta(labelByLocale={"en_GB": "Email"}))
        html = "<html><body>completely hand-rewritten, no recognizable structure left</body></html>"
        new_form = _form(new)
        assert patch_html_for_field_diff(html, [], new_form, "ff") is None

    def test_returns_none_when_form_bottom_group_itself_is_gone(self):
        old = _fields()
        html = _fresh_html(old).replace('<div class="form_bottom_group">', '<div class="hand_rewritten_bottom">')
        new = _fields(privacyPolicy=PrivacyPolicyMeta())
        new_form = _form(new)
        assert patch_html_for_field_diff(html, [], new_form, "ff") is None

    def test_returns_none_for_recaptcha_when_form_bottom_group_itself_is_gone(self):
        old = _fields()
        html = _fresh_html(old).replace('<div class="form_bottom_group">', '<div class="hand_rewritten_bottom">')
        new = _fields(recaptcha=ReCaptchaMeta())
        new_form = _form(new)
        assert patch_html_for_field_diff(html, [], new_form, "ff") is None

    def test_returns_none_for_submit_confirmation_when_overlay_div_is_gone(self):
        old = _fields(submitConfirmationEnabled=False)
        html = _fresh_html(old).replace('id="overlay"', 'id="overlayRenamed"')
        new = _fields()
        new_form = _form(new)
        assert patch_html_for_field_diff(html, [], new_form, "ff") is None
