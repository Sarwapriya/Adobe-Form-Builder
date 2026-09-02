"""Port of packages/shared/src/form/formDefinitionValidator.ts.

`FormDefinition`-native validator for builder-authored forms — the
counterpart to the (removed) Excel `validateWorkbook`. Shares the same
Issue/ValidationResult shape (excel/types.py) so the frontend's existing
validation-panel rendering works unchanged for both pipelines. Generation
should only run once `errors` is empty, same convention as the Excel path.
"""

from __future__ import annotations

from typing import Callable

from ..excel.types import Issue, ValidationResult
from .calling_codes import find_calling_code_entry
from .definition import FormDefinition, QuestionDefinition, resolve_mobile_number_countries

_LABEL = "Form Builder"


def _err(message: str) -> Issue:
    return Issue(severity="error", sheet=_LABEL, message=message)


def _warn(message: str) -> Issue:
    return Issue(severity="warning", sheet=_LABEL, message=message)


def validate_form_definition(form: FormDefinition) -> ValidationResult:
    errors: list[Issue] = []
    warnings: list[Issue] = []

    if len(form.questions) == 0:
        errors.append(_err("Add at least one question before publishing."))

    if len(form.locales) == 0:
        errors.append(_err("The form has no locales configured."))
    elif not any(l.code == form.meta.defaultLocale for l in form.locales):
        errors.append(_err(f'Default locale "{form.meta.defaultLocale}" is not one of the form\'s configured locales.'))

    _check_duplicates(
        [l.code for l in form.locales],
        lambda code: f'Locale "{code}" is configured more than once.',
        errors,
    )

    if not (form.fields.submitButton and form.fields.submitButton.labelByLocale.get(form.meta.defaultLocale)):
        errors.append(_err("The submit button has no label for the default locale."))

    _check_duplicates(
        [q.id for q in form.questions],
        lambda id_: f'Question id "{id_}" is used more than once.',
        errors,
    )
    _check_sequential([q.order for q in form.questions], "Question", errors)

    for q in form.questions:
        _check_question(q, errors, warnings)

    if form.fields.mobileNumber:
        mobile_number = form.fields.mobileNumber
        seen_codes: set[str] = set()
        for locale in form.locales:
            countries = resolve_mobile_number_countries(mobile_number, locale.code)
            if len(countries) == 0:
                errors.append(_err(f'The Mobile Number field has no countries configured for locale "{locale.code}".'))
            for code in countries:
                seen_codes.add(code)
        if len(form.locales) == 0:
            for code in mobile_number.countries:
                seen_codes.add(code)
        for code in seen_codes:
            if not find_calling_code_entry(code):
                errors.append(_err(f'The Mobile Number field references an unrecognized country code "{code}".'))

    if form.fields.privacyPolicy:
        pp = form.fields.privacyPolicy
        if not pp.linkUrlByLocale.get(form.meta.defaultLocale):
            warnings.append(_warn("The Privacy Policy field has no link URL for the default locale."))
        if not pp.textByLocale.get(form.meta.defaultLocale):
            warnings.append(_warn("The Privacy Policy field has no consent text for the default locale."))
        if not (pp.linkTextByLocale or {}).get(form.meta.defaultLocale):
            warnings.append(_warn("The Privacy Policy field has no link text for the default locale — the link will render empty."))
        if pp.visibleInVariants is not None and len(pp.visibleInVariants) == 0:
            warnings.append(
                _warn("The Privacy Policy field isn't shown in Full Form or One-Click — it won't appear anywhere until you enable at least one.")
            )

    if form.fields.termsAndConditions:
        tc = form.fields.termsAndConditions
        if not tc.urlByLocale.get(form.meta.defaultLocale):
            warnings.append(_warn("The Terms and Conditions field has no link URL for the default locale."))
        if not tc.textByLocale.get(form.meta.defaultLocale):
            warnings.append(_warn("The Terms and Conditions field has no wording for the default locale."))

    if form.fields.marketingOptin and form.fields.marketingOptin.visibleInVariants is not None and len(form.fields.marketingOptin.visibleInVariants) == 0:
        warnings.append(
            _warn("The Marketing Opt-in field isn't shown in Full Form or One-Click — it won't appear anywhere until you enable at least one.")
        )

    if form.fields.additionalConsents:
        _check_duplicates(
            [c.id for c in form.fields.additionalConsents],
            lambda id_: f'Consent id "{id_}" is used more than once.',
            errors,
        )
        _check_sequential([c.order for c in form.fields.additionalConsents], "Additional consents", errors)
        for consent in form.fields.additionalConsents:
            if not consent.textByLocale.get(form.meta.defaultLocale):
                warnings.append(_warn(f'Consent "{consent.id}" has no text for the default locale.'))
            if consent.visibleInVariants is not None and len(consent.visibleInVariants) == 0:
                warnings.append(
                    _warn(f'Consent "{consent.id}" isn\'t shown in Full Form or One-Click — it won\'t appear anywhere until you enable at least one.')
                )

    return ValidationResult(errors=errors, warnings=warnings)


def _check_question(q: QuestionDefinition, errors: list[Issue], warnings: list[Issue]) -> None:
    _check_duplicates(
        [a.id for a in q.answers],
        lambda id_: f'Question {q.id}: answer id "{id_}" is used more than once.',
        errors,
    )
    _check_sequential([a.order for a in q.answers], f"Question {q.id}'s answers", errors)

    is_choice_type = q.controlType in ("radio", "checkbox", "dropdown")
    if is_choice_type and len(q.answers) == 0:
        errors.append(_err(f"Question {q.id} ({q.controlType}) has no options."))
    if q.controlType == "radio" and len(q.answers) == 1:
        warnings.append(_warn(f"Question {q.id} is a radio question with only one option."))
    if q.controlType in ("text", "shortText") and len(q.answers) > 0:
        warnings.append(_warn(f"Question {q.id} is a free-text question but has options configured — they will be ignored."))
    if not q.headingByLocale or len(q.headingByLocale) == 0:
        warnings.append(_warn(f"Question {q.id} has no heading text."))
    if q.visibleInVariants is not None and len(q.visibleInVariants) == 0:
        warnings.append(_warn(f"Question {q.id} isn't shown in Full Form or One-Click — it won't appear anywhere until you enable at least one."))


def _check_duplicates(values: list[str], message: Callable[[str], str], errors: list[Issue]) -> None:
    seen: set[str] = set()
    for value in values:
        if value in seen:
            errors.append(_err(message(value)))
        seen.add(value)


def _check_sequential(orders: list[int], label: str, errors: list[Issue]) -> None:
    """Confirms `order` values are 1..N with no gaps or duplicates — DOM ids and `data.js`
    lookup keys derive from `order` (see codegen/dom_ids.py), so a gap silently desyncs them."""
    if len(orders) == 0:
        return
    sorted_orders = sorted(orders)
    expected = list(range(1, len(sorted_orders) + 1))
    is_sequential = all(v == e for v, e in zip(sorted_orders, expected))
    if not is_sequential:
        joined = ", ".join(str(o) for o in sorted_orders)
        errors.append(_err(f"{label} order values must be sequential starting at 1 (found: {joined})."))
