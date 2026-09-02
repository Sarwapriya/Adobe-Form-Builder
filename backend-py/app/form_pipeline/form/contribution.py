"""Port of packages/shared/src/form/contribution.ts.

Subsidiary-user contributions to a published form: translations for text a
subsidiary user is allowed to touch (any locale on the form, including its
default — but never its *structure*) plus entirely new questions/consents
they can append. `apply_contribution`/`validate_contribution` are pure, like
the rest of this package.
"""

from __future__ import annotations

from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field

from ..excel.types import Issue, ValidationResult
from .definition import (
    AnswerDefinition,
    ConsentDefinition,
    FormDefinition,
    LocaleCode,
    QuestionDefinition,
    resolve_localized_text,
)


class _Model(BaseModel):
    model_config = ConfigDict(extra="ignore", validate_assignment=True)


class ProfileLabelTarget(_Model):
    kind: Literal["profileLabel"] = "profileLabel"
    field: Literal["firstName", "lastName", "email", "mobileNumber", "marketingOptin"]


class PrivacyPolicyTextTarget(_Model):
    kind: Literal["privacyPolicyText"] = "privacyPolicyText"


class PrivacyPolicyLinkTarget(_Model):
    kind: Literal["privacyPolicyLink"] = "privacyPolicyLink"


class PrivacyPolicyLinkTextTarget(_Model):
    kind: Literal["privacyPolicyLinkText"] = "privacyPolicyLinkText"


class TermsAndConditionsTextTarget(_Model):
    kind: Literal["termsAndConditionsText"] = "termsAndConditionsText"


class TermsAndConditionsUrlTarget(_Model):
    kind: Literal["termsAndConditionsUrl"] = "termsAndConditionsUrl"


class ConsentTextTarget(_Model):
    kind: Literal["consentText"] = "consentText"
    consentId: str


class ConsentLinkTarget(_Model):
    kind: Literal["consentLink"] = "consentLink"
    consentId: str


class QuestionHeadingTarget(_Model):
    kind: Literal["questionHeading"] = "questionHeading"
    questionId: str


class QuestionSubheadingTarget(_Model):
    kind: Literal["questionSubheading"] = "questionSubheading"
    questionId: str


class AnswerTextTarget(_Model):
    kind: Literal["answerText"] = "answerText"
    questionId: str
    answerId: str


class CampaignHeadingTarget(_Model):
    kind: Literal["campaignHeading"] = "campaignHeading"


class CampaignSubheadingTarget(_Model):
    kind: Literal["campaignSubheading"] = "campaignSubheading"


class CampaignHeadingFullFormTarget(_Model):
    kind: Literal["campaignHeadingFullForm"] = "campaignHeadingFullForm"


class CampaignSubheadingFullFormTarget(_Model):
    kind: Literal["campaignSubheadingFullForm"] = "campaignSubheadingFullForm"


class SubmitButtonLabelTarget(_Model):
    kind: Literal["submitButtonLabel"] = "submitButtonLabel"


TranslationTarget = Union[
    ProfileLabelTarget,
    PrivacyPolicyTextTarget,
    PrivacyPolicyLinkTarget,
    PrivacyPolicyLinkTextTarget,
    TermsAndConditionsTextTarget,
    TermsAndConditionsUrlTarget,
    ConsentTextTarget,
    ConsentLinkTarget,
    QuestionHeadingTarget,
    QuestionSubheadingTarget,
    AnswerTextTarget,
    CampaignHeadingTarget,
    CampaignSubheadingTarget,
    CampaignHeadingFullFormTarget,
    CampaignSubheadingFullFormTarget,
    SubmitButtonLabelTarget,
]


class TranslationEntry(_Model):
    target: Annotated[TranslationTarget, Field(discriminator="kind")]
    locale: LocaleCode
    value: str


def target_key(target: TranslationTarget) -> str:
    """Stable string key for a TranslationTarget — collision-free by construction
    since it encodes every discriminant field."""
    kind = target.kind
    if isinstance(target, ProfileLabelTarget):
        return f"profileLabel:{target.field}"
    if kind == "privacyPolicyText":
        return "privacyPolicyText"
    if kind == "privacyPolicyLink":
        return "privacyPolicyLink"
    if kind == "privacyPolicyLinkText":
        return "privacyPolicyLinkText"
    if kind == "termsAndConditionsText":
        return "termsAndConditionsText"
    if kind == "termsAndConditionsUrl":
        return "termsAndConditionsUrl"
    if isinstance(target, ConsentTextTarget):
        return f"consentText:{target.consentId}"
    if isinstance(target, ConsentLinkTarget):
        return f"consentLink:{target.consentId}"
    if isinstance(target, QuestionHeadingTarget):
        return f"questionHeading:{target.questionId}"
    if isinstance(target, QuestionSubheadingTarget):
        return f"questionSubheading:{target.questionId}"
    if isinstance(target, AnswerTextTarget):
        return f"answerText:{target.questionId}:{target.answerId}"
    if kind == "campaignHeading":
        return "campaignHeading"
    if kind == "campaignSubheading":
        return "campaignSubheading"
    if kind == "campaignHeadingFullForm":
        return "campaignHeadingFullForm"
    if kind == "campaignSubheadingFullForm":
        return "campaignSubheadingFullForm"
    if kind == "submitButtonLabel":
        return "submitButtonLabel"
    raise ValueError(f"Unhandled translation target kind: {kind}")


class AutoPopulateToggle(_Model):
    questionId: str
    enabled: bool


class NewAnswerEntry(_Model):
    questionId: str
    answer: AnswerDefinition


class DeletedAnswerRef(_Model):
    questionId: str
    answerId: str


class ContributionContent(_Model):
    translations: list[TranslationEntry] = Field(default_factory=list)
    # Appended after the form's existing questions — ids/order are reassigned by
    # apply_contribution regardless of what's submitted here.
    newQuestions: list[QuestionDefinition] = Field(default_factory=list)
    newConsents: list[ConsentDefinition] = Field(default_factory=list)
    autoPopulateToggles: list[AutoPopulateToggle] = Field(default_factory=list)
    deletedQuestionIds: list[str] = Field(default_factory=list)
    newAnswers: list[NewAnswerEntry] = Field(default_factory=list)
    deletedAnswerIds: list[DeletedAnswerRef] = Field(default_factory=list)


def _renumber_answers(answers: list[AnswerDefinition]) -> list[AnswerDefinition]:
    return [a.model_copy(update={"id": f"A{i + 1}", "order": i + 1}) for i, a in enumerate(answers)]


def _renumber_questions(questions: list[QuestionDefinition]) -> list[QuestionDefinition]:
    return [
        q.model_copy(update={"id": f"Q{i + 1}", "order": i + 1, "answers": _renumber_answers(q.answers)})
        for i, q in enumerate(questions)
    ]


def _renumber_consents(consents: list[ConsentDefinition]) -> list[ConsentDefinition]:
    return [c.model_copy(update={"id": f"consentExtra{i + 1}", "order": i + 1}) for i, c in enumerate(consents)]


def _apply_translation_entry(form: FormDefinition, entry: TranslationEntry) -> None:
    target = entry.target
    locale = entry.locale
    value = entry.value

    if isinstance(target, ProfileLabelTarget):
        field = getattr(form.fields, target.field)
        if not field:
            return
        field.labelByLocale = {**field.labelByLocale, locale: value}
        return
    if isinstance(target, PrivacyPolicyTextTarget):
        if not form.fields.privacyPolicy:
            return
        form.fields.privacyPolicy.textByLocale = {**form.fields.privacyPolicy.textByLocale, locale: value}
        return
    if isinstance(target, PrivacyPolicyLinkTarget):
        if not form.fields.privacyPolicy:
            return
        form.fields.privacyPolicy.linkUrlByLocale = {**form.fields.privacyPolicy.linkUrlByLocale, locale: value}
        return
    if isinstance(target, PrivacyPolicyLinkTextTarget):
        if not form.fields.privacyPolicy:
            return
        form.fields.privacyPolicy.linkTextByLocale = {**(form.fields.privacyPolicy.linkTextByLocale or {}), locale: value}
        return
    if isinstance(target, TermsAndConditionsTextTarget):
        if not form.fields.termsAndConditions:
            return
        form.fields.termsAndConditions.textByLocale = {**form.fields.termsAndConditions.textByLocale, locale: value}
        return
    if isinstance(target, TermsAndConditionsUrlTarget):
        if not form.fields.termsAndConditions:
            return
        form.fields.termsAndConditions.urlByLocale = {**form.fields.termsAndConditions.urlByLocale, locale: value}
        return
    if isinstance(target, ConsentTextTarget):
        consent = next((c for c in (form.fields.additionalConsents or []) if c.id == target.consentId), None)
        if not consent:
            return
        consent.textByLocale = {**consent.textByLocale, locale: value}
        return
    if isinstance(target, ConsentLinkTarget):
        consent = next((c for c in (form.fields.additionalConsents or []) if c.id == target.consentId), None)
        if not consent:
            return
        consent.linkUrlByLocale = {**(consent.linkUrlByLocale or {}), locale: value}
        return
    if isinstance(target, QuestionHeadingTarget):
        question = next((q for q in form.questions if q.id == target.questionId), None)
        if not question:
            return
        question.headingByLocale = {**question.headingByLocale, locale: value}
        return
    if isinstance(target, QuestionSubheadingTarget):
        question = next((q for q in form.questions if q.id == target.questionId), None)
        if not question:
            return
        question.subheadingByLocale = {**question.subheadingByLocale, locale: value}
        return
    if isinstance(target, AnswerTextTarget):
        question = next((q for q in form.questions if q.id == target.questionId), None)
        answer = next((a for a in question.answers if a.id == target.answerId), None) if question else None
        if not answer:
            return
        answer.textByLocale = {**answer.textByLocale, locale: value}
        return
    if isinstance(target, CampaignHeadingTarget):
        form.fields.headingBeforeBreakByLocale = {**(form.fields.headingBeforeBreakByLocale or {}), locale: value}
        return
    if isinstance(target, CampaignSubheadingTarget):
        form.fields.campaignSubheadingByLocale = {**(form.fields.campaignSubheadingByLocale or {}), locale: value}
        return
    if isinstance(target, CampaignHeadingFullFormTarget):
        form.fields.headingBeforeBreakFFByLocale = {**(form.fields.headingBeforeBreakFFByLocale or {}), locale: value}
        return
    if isinstance(target, CampaignSubheadingFullFormTarget):
        form.fields.campaignSubheadingFFByLocale = {**(form.fields.campaignSubheadingFFByLocale or {}), locale: value}
        return
    if isinstance(target, SubmitButtonLabelTarget):
        form.fields.submitButton.labelByLocale = {**form.fields.submitButton.labelByLocale, locale: value}
        return


def _translation_target_exists(form: FormDefinition, target: TranslationTarget) -> bool:
    if isinstance(target, ProfileLabelTarget):
        return bool(getattr(form.fields, target.field))
    if isinstance(target, (PrivacyPolicyTextTarget, PrivacyPolicyLinkTarget, PrivacyPolicyLinkTextTarget)):
        return bool(form.fields.privacyPolicy)
    if isinstance(target, (TermsAndConditionsTextTarget, TermsAndConditionsUrlTarget)):
        return bool(form.fields.termsAndConditions)
    if isinstance(target, (ConsentTextTarget, ConsentLinkTarget)):
        return any(c.id == target.consentId for c in (form.fields.additionalConsents or []))
    if isinstance(target, (QuestionHeadingTarget, QuestionSubheadingTarget)):
        return any(q.id == target.questionId for q in form.questions)
    if isinstance(target, AnswerTextTarget):
        return any(q.id == target.questionId and any(a.id == target.answerId for a in q.answers) for q in form.questions)
    # campaignHeading / campaignSubheading / campaignHeadingFullForm /
    # campaignSubheadingFullForm / submitButtonLabel: plain optional Records
    # directly on `fields` (or, for submitButtonLabel, a non-optional nested
    # object) — always a legitimate target on any FormDefinition.
    return True


def _describe_target(target: TranslationTarget) -> str:
    if isinstance(target, ProfileLabelTarget):
        return target.field
    if isinstance(target, (PrivacyPolicyTextTarget, PrivacyPolicyLinkTarget, PrivacyPolicyLinkTextTarget)):
        return "Privacy Policy"
    if isinstance(target, (TermsAndConditionsTextTarget, TermsAndConditionsUrlTarget)):
        return "Terms and Conditions"
    if isinstance(target, (ConsentTextTarget, ConsentLinkTarget)):
        return f'consent "{target.consentId}"'
    if isinstance(target, (QuestionHeadingTarget, QuestionSubheadingTarget)):
        return f'question "{target.questionId}"'
    if isinstance(target, AnswerTextTarget):
        return f'answer "{target.answerId}" on question "{target.questionId}"'
    if isinstance(target, CampaignHeadingTarget):
        return "Campaign heading (One-Click)"
    if isinstance(target, CampaignSubheadingTarget):
        return "Campaign subheading (One-Click)"
    if isinstance(target, CampaignHeadingFullFormTarget):
        return "Campaign heading (Full Form)"
    if isinstance(target, CampaignSubheadingFullFormTarget):
        return "Campaign subheading (Full Form)"
    if isinstance(target, SubmitButtonLabelTarget):
        return "Submit button label"
    raise ValueError(f"Unhandled translation target kind: {target.kind}")


def apply_contribution(base: FormDefinition, content: ContributionContent) -> FormDefinition:
    """Merges a contribution onto a baseline `FormDefinition`. Pure — returns a new
    object, never mutates `base`. Translation targets that no longer exist on `base`
    are silently skipped rather than throwing."""
    next_form = base.model_copy(deep=True)

    for entry in content.translations:
        _apply_translation_entry(next_form, entry)

    for toggle in content.autoPopulateToggles:
        question = next((q for q in next_form.questions if q.id == toggle.questionId), None)
        if not question or not question.autoPopulateEligible:
            continue
        question.autoPopulateEnabled = toggle.enabled

    for entry in content.newAnswers:
        question = next((q for q in next_form.questions if q.id == entry.questionId), None)
        if not question:
            continue
        question.answers = [*question.answers, entry.answer.model_copy(deep=True)]
    for entry in content.deletedAnswerIds:
        question = next((q for q in next_form.questions if q.id == entry.questionId), None)
        if not question:
            continue
        question.answers = [a for a in question.answers if a.id != entry.answerId]

    if content.deletedQuestionIds:
        deletable = set(content.deletedQuestionIds)
        # The lockedFromSubsidiary guard is defensive — validate_contribution already
        # rejects a submission that tries this.
        next_form.questions = [q for q in next_form.questions if q.id not in deletable or q.lockedFromSubsidiary]

    next_form.questions = _renumber_questions(next_form.questions + [q.model_copy(deep=True) for q in content.newQuestions])

    if content.newConsents:
        next_form.fields.additionalConsents = _renumber_consents(
            (next_form.fields.additionalConsents or []) + [c.model_copy(deep=True) for c in content.newConsents]
        )

    return next_form


_LABEL = "Form Contribution"


def _err(message: str) -> Issue:
    return Issue(severity="error", sheet=_LABEL, message=message)


def _warn(message: str) -> Issue:
    return Issue(severity="warning", sheet=_LABEL, message=message)


def validate_contribution(base: FormDefinition, content: ContributionContent) -> ValidationResult:
    """Validates a contribution against the baseline it was proposed against."""
    errors: list[Issue] = []
    warnings: list[Issue] = []
    translatable_locales = {l.code for l in base.locales}

    for entry in content.translations:
        if entry.locale not in translatable_locales:
            errors.append(_err(f'"{entry.locale}" isn\'t an existing locale on this form.'))
            continue
        if not _translation_target_exists(base, entry.target):
            errors.append(
                _err(f"{_describe_target(entry.target)} no longer exists on this form — it may have been removed since you started.")
            )

    for q in content.newQuestions:
        is_choice_type = q.controlType in ("radio", "checkbox", "dropdown")
        heading = resolve_localized_text(q.headingByLocale, base.meta.defaultLocale, base.meta.defaultLocale)
        if is_choice_type and len(q.answers) == 0:
            errors.append(_err(f'New question "{heading or q.id}" ({q.controlType}) has no options.'))
        if not heading:
            warnings.append(_warn(f'A new question has no heading text for "{base.meta.defaultLocale}".'))

    for c in content.newConsents:
        if not resolve_localized_text(c.textByLocale, base.meta.defaultLocale, base.meta.defaultLocale):
            warnings.append(_warn(f'A new consent has no text for "{base.meta.defaultLocale}".'))

    for toggle in content.autoPopulateToggles:
        question = next((q for q in base.questions if q.id == toggle.questionId), None)
        if not question or not question.autoPopulateEligible:
            errors.append(
                _err(f'Question "{toggle.questionId}" isn\'t eligible for URL-param auto-populate — it may have been changed since you started.')
            )

    for id_ in content.deletedQuestionIds:
        question = next((q for q in base.questions if q.id == id_), None)
        if not question:
            errors.append(_err(f'Question "{id_}" no longer exists on this form — it may have been removed since you started.'))
        elif question.lockedFromSubsidiary:
            errors.append(_err(f'Question "{id_}" is locked by the admin and can\'t be deleted.'))

    for entry in content.newAnswers:
        question = next((q for q in base.questions if q.id == entry.questionId), None)
        if not question:
            errors.append(_err(f'Question "{entry.questionId}" no longer exists on this form — it may have been removed since you started.'))
            continue
        if not resolve_localized_text(entry.answer.textByLocale, base.meta.defaultLocale, base.meta.defaultLocale):
            warnings.append(_warn(f'A new option on question "{entry.questionId}" has no text for "{base.meta.defaultLocale}".'))

    for entry in content.deletedAnswerIds:
        question = next((q for q in base.questions if q.id == entry.questionId), None)
        answer = next((a for a in question.answers if a.id == entry.answerId), None) if question else None
        if not question or not answer:
            errors.append(
                _err(f'Answer "{entry.answerId}" on question "{entry.questionId}" no longer exists — it may have been removed since you started.')
            )

    return ValidationResult(errors=errors, warnings=warnings)
