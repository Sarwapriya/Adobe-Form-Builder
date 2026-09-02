"""Port of packages/shared/src/codegen/js/buildDataJs.ts.

Builds the data file (`{prefix}.js`): the bare top-level `const`s the
byte-identical build_ff_js/build_oc_js scripts read at runtime — same names
and shape as the reference's `SGE-EN_F2H26.js` (`page_error`, `fields`,
`questions`, `answers`, `validation_messages`, `country_subsidiary`,
`subsidiary_detail`, `param`).

This is the densest translation point in the whole port — every dict is
built key-by-key in exactly the same insertion order as the TypeScript
source, since that order flows straight through `json.dumps` into the
generated file's byte content (Python dicts, like JS objects, preserve
insertion order for string keys).
"""

from __future__ import annotations

from typing import Any, Optional

from ..form.calling_codes import find_calling_code_entry
from ..form.definition import (
    FormDefinition,
    LocaleCode,
    LocaleInfo,
    MobileNumberFieldMeta,
    PageCopy,
    resolve_localized_text,
    resolve_mobile_number_countries,
)
from ..form.subsidiary_data import COUNTRY_SUBSIDIARY, SUBSIDIARY_DETAIL, SubsidiaryCountryEntry, resolve_country_name
from .dom_ids import answer_dom_key, auto_populate_param_name
from .escaping import safe_json_for_script
from .file_names import FileNames
from .types import BuilderConfig, GeneratedFile

# Reserved subsidiary key for a builder-authored `fields.mobileNumber` field —
# never a real Samsung subsidiary code (those are short org codes like
# "SGE"/"SEIL").
_BUILDER_SUBSIDIARY_KEY = "BUILDER"

# Question control types with discrete, selectable answers — the only kind a
# URL param can meaningfully auto-populate.
_AUTO_POPULATE_CONTROL_TYPES = {"radio", "checkbox", "dropdown"}


def _build_builder_subsidiary_tables(
    field: MobileNumberFieldMeta,
    locales: list[LocaleInfo],
    default_locale: LocaleCode,
) -> tuple[dict[str, str], dict[str, list[SubsidiaryCountryEntry]]]:
    """Synthesizes one-off `country_subsidiary`/`subsidiary_detail` tables for a
    builder's `fields.mobileNumber` field, from the generic CALLING_CODES table
    rather than the real, org-specific Samsung tables."""
    country_subsidiary: dict[str, str] = {}
    subsidiary_detail: dict[str, list[SubsidiaryCountryEntry]] = {}

    def build_entries(countries: list[str]) -> list[SubsidiaryCountryEntry]:
        entries: list[SubsidiaryCountryEntry] = []
        for code in countries:
            entry = find_calling_code_entry(code)
            if not entry:
                continue
            entries.append(
                SubsidiaryCountryEntry(
                    callingCode=entry.callingCode,
                    countryCode=entry.countryCode,
                    countryName={l.code: resolve_country_name(entry.countryCode, l.code, default_locale) for l in locales},
                )
            )
        return entries

    subsidiary_detail[_BUILDER_SUBSIDIARY_KEY] = build_entries(field.countries)
    for code in field.countries:
        entry = find_calling_code_entry(code)
        if entry:
            country_subsidiary[entry.countryCode] = _BUILDER_SUBSIDIARY_KEY

    for locale in locales:
        parts = locale.code.split("_")
        locale_country = parts[1] if len(parts) > 1 else None
        if not locale_country:
            continue
        resolved = resolve_mobile_number_countries(field, locale.code)
        if resolved is not field.countries:
            key = f"{_BUILDER_SUBSIDIARY_KEY}_{locale.code}"
            subsidiary_detail[key] = build_entries(resolved)
            country_subsidiary[locale_country] = key
        elif not country_subsidiary.get(locale_country):
            country_subsidiary[locale_country] = _BUILDER_SUBSIDIARY_KEY

    return country_subsidiary, subsidiary_detail


# Fallback validation messages when the workbook carries no "Error Messages"
# section. The reference itself only ever ships one generic English set;
# these mirror that (a documented limitation, not a bug).
_DEFAULT_VALIDATION_MESSAGES: dict[str, str] = {
    "emailError": "Please enter a valid Email address",
    "firstNameError": "Only letters are allowed",
    "lastNameError": "Only letters are allowed",
    "callingCodeError": "Please select a value",
    "mobileNumberType": "Only digits are allowed",
    "mobileNumberLength": "Must be 9 or 10 digits",
    "mobileNumberError": "Enter a valid mobile number",
    "zipCodeError": "Please enter a valid ZIP code of 5 to 9 characters",
    "reCaptchaRequired": "Please complete reCaptcha verification",
    "apiError": "Something went wrong. Please try again later.",
    "modalMessage_1": "Are you sure you want to submit?",
    "modalMessage_2": "You won't be able to change your answers after this.",
    "modalButtonYes": "Yes, submit",
    "modalButtonNo": "No, go back",
}


def _nullish(*values: Optional[str]) -> str:
    """`a ?? b ?? "" ` — the first value that is not None, else "". Unlike Python's
    `or`, an explicitly-empty string is a valid (non-fallback-triggering) value,
    matching JS's nullish-coalescing semantics used throughout the TS source."""
    for v in values:
        if v is not None:
            return v
    return ""


def _resolve_page_copy(m: dict[LocaleCode, PageCopy], locale: LocaleCode, default_locale: LocaleCode) -> dict[str, str]:
    entry = m.get(locale) or m.get(default_locale) or PageCopy()
    fallback = m.get(default_locale) or PageCopy()
    return {
        "heading": _nullish(entry.heading, fallback.heading, ""),
        "subHeading": _nullish(entry.subHeading, fallback.subHeading, ""),
        "subHeadingUrlText": _nullish(entry.subHeadingUrlText, fallback.subHeadingUrlText, ""),
        "subHeadingUrl": _nullish(entry.subHeadingUrl, fallback.subHeadingUrl, ""),
    }


def build_data_js(form: FormDefinition, config: BuilderConfig, file_names: FileNames) -> GeneratedFile:
    default_locale = form.meta.defaultLocale
    locale_codes = [l.code for l in form.locales]

    fields: dict[LocaleCode, dict[str, Any]] = {}
    page_error: dict[LocaleCode, Any] = {}
    questions: dict[LocaleCode, Any] = {}
    answers: dict[LocaleCode, Any] = {}
    validation_messages: dict[LocaleCode, dict[str, str]] = {}

    for locale in locale_codes:
        f = form.fields

        calling_code_field = f.callingCode or f.mobileNumber

        locale_fields: dict[str, Any] = {
            "headingBeforeBreakFF": (
                resolve_localized_text(f.headingBeforeBreakFFByLocale, locale, default_locale)
                if f.headingBeforeBreakFFByLocale
                else (resolve_localized_text(f.headingBeforeBreakByLocale, locale, default_locale) if f.headingBeforeBreakByLocale else "")
            ),
            "headingAfterBreakFF": (
                resolve_localized_text(f.headingAfterBreakFFByLocale, locale, default_locale)
                if f.headingAfterBreakFFByLocale
                else (resolve_localized_text(f.headingAfterBreakByLocale, locale, default_locale) if f.headingAfterBreakByLocale else "")
            ),
            "headingBeforeBreak": resolve_localized_text(f.headingBeforeBreakByLocale, locale, default_locale) if f.headingBeforeBreakByLocale else "",
            "headingAfterBreak": resolve_localized_text(f.headingAfterBreakByLocale, locale, default_locale) if f.headingAfterBreakByLocale else "",
            "campaignSubheadingFF": (
                resolve_localized_text(f.campaignSubheadingFFByLocale, locale, default_locale)
                if f.campaignSubheadingFFByLocale
                else (resolve_localized_text(f.campaignSubheadingByLocale, locale, default_locale) if f.campaignSubheadingByLocale else "")
            ),
            "campaignSubheading": resolve_localized_text(f.campaignSubheadingByLocale, locale, default_locale) if f.campaignSubheadingByLocale else "",
            "requiredField": resolve_localized_text(f.requiredFieldNoteByLocale, locale, default_locale) if f.requiredFieldNoteByLocale else "",
            "label": {
                "countryCode": resolve_localized_text(f.countryCode.labelByLocale, locale, default_locale) if f.countryCode else "",
                "email": resolve_localized_text(f.email.labelByLocale, locale, default_locale) if f.email else "",
                "firstName": resolve_localized_text(f.firstName.labelByLocale, locale, default_locale) if f.firstName else "",
                "lastName": resolve_localized_text(f.lastName.labelByLocale, locale, default_locale) if f.lastName else "",
                "callingCode": resolve_localized_text(calling_code_field.labelByLocale, locale, default_locale) if calling_code_field else "",
                "zipCode": "",
            },
            "placeholder": {
                "email": resolve_localized_text(f.email.placeholderByLocale, locale, default_locale) if f.email else "",
                "firstName": resolve_localized_text(f.firstName.placeholderByLocale, locale, default_locale) if f.firstName else "",
                "lastName": resolve_localized_text(f.lastName.placeholderByLocale, locale, default_locale) if f.lastName else "",
                "mobileNumber": "",
                "zipCode": "",
            },
            "callingCodeDropdownFirstEntry": (
                resolve_localized_text(calling_code_field.dropdownFirstEntryByLocale, locale, default_locale) if calling_code_field else ""
            ),
            "privacyPolicy": resolve_localized_text(f.privacyPolicy.textByLocale, locale, default_locale) if f.privacyPolicy else "",
            "privacyPolicyLink": {
                "label": resolve_localized_text(f.privacyPolicy.linkTextByLocale, locale, default_locale) if f.privacyPolicy else "",
                "image": "",
                "imageAlt": "",
                "url": resolve_localized_text(f.privacyPolicy.linkUrlByLocale, locale, default_locale) if f.privacyPolicy else "",
            },
            "termsAndConditions": resolve_localized_text(f.termsAndConditions.textByLocale, locale, default_locale) if f.termsAndConditions else "",
            "termsAndConditionsLink": {
                "label": "",
                "image": "",
                "imageAlt": "",
                "url": resolve_localized_text(f.termsAndConditions.urlByLocale, locale, default_locale) if f.termsAndConditions else "",
            },
            "subscribe": resolve_localized_text(f.marketingOptin.labelByLocale, locale, default_locale) if f.marketingOptin else "",
            "submitButton": resolve_localized_text(f.submitButton.labelByLocale, locale, default_locale),
            "hrTy": _resolve_page_copy(form.thankYou, locale, default_locale),
            "redirectAfterSuccessUrl": (
                resolve_localized_text(f.redirectAfterSuccessUrlByLocale, locale, default_locale) if f.redirectAfterSuccessUrlByLocale else ""
            ),
        }
        fields[locale] = locale_fields

        # Admin-added consent checkboxes beyond the two fixed slots above.
        for consent in f.additionalConsents or []:
            locale_fields[consent.id] = resolve_localized_text(consent.textByLocale, locale, default_locale)
            if consent.linkUrlByLocale:
                locale_fields[f"{consent.id}Link"] = {
                    "label": "",
                    "image": "",
                    "imageAlt": "",
                    "url": resolve_localized_text(consent.linkUrlByLocale, locale, default_locale),
                }

        page_error[locale] = {"hrErr": _resolve_page_copy(form.pageError, locale, default_locale)}

        questions_for_locale: dict[str, dict[str, str]] = {}
        answers_for_locale: dict[str, dict[str, Any]] = {}
        for q in form.questions:
            questions_for_locale[q.id] = {
                "heading": resolve_localized_text(q.headingByLocale, locale, default_locale),
                "subheading": resolve_localized_text(q.subheadingByLocale, locale, default_locale),
            }
            answer_map: dict[str, Any] = {}
            for a in q.answers:
                text = resolve_localized_text(a.textByLocale, locale, default_locale)
                if a.image:
                    answer_map[answer_dom_key(a.order)] = {
                        "label": text,
                        "image": a.image.src,
                        "imageAlt": a.image.alt if a.image.alt is not None else text,
                    }
                else:
                    answer_map[answer_dom_key(a.order)] = text
            answers_for_locale[q.id] = answer_map
        questions[locale] = questions_for_locale
        answers[locale] = answers_for_locale

        # Merge workbook-provided validation messages with hardcoded defaults.
        #
        # NOTE (faithfully reproduced quirk, not "fixed" here): the TS source does
        # `{ ...DEFAULT_VALIDATION_MESSAGES, ...wbMessages }` where DEFAULT_VALIDATION_MESSAGES
        # uses underscored keys for the two modal-message fields ("modalMessage_1"/
        # "modalMessage_2") but ValidationMessageSet's own fields are camelCase
        # ("modalMessage1"/"modalMessage2") — so a workbook-provided modal message never
        # actually overrides the default; it just adds an extra, differently-named key
        # nothing reads. Reproduced verbatim (no key remapping) for exact parity.
        wb_messages = form.validationMessages.get(locale)
        wb_dict = (
            {k: v for k, v in wb_messages.model_dump(by_alias=False).items() if v is not None} if wb_messages is not None else {}
        )
        validation_messages[locale] = {**_DEFAULT_VALIDATION_MESSAGES, **wb_dict}

    builder_subsidiary_tables: Optional[tuple[dict[str, str], dict[str, list[SubsidiaryCountryEntry]]]] = None
    if form.fields.mobileNumber:
        builder_subsidiary_tables = _build_builder_subsidiary_tables(form.fields.mobileNumber, form.locales, form.meta.defaultLocale)

    # paramName -> questionId, for the One-Click reference script's
    # setAnswerDataFromParams() to read at runtime.
    auto_populate_params: dict[str, str] = {}
    for q in form.questions:
        if q.autoPopulateEligible and q.autoPopulateEnabled and q.controlType in _AUTO_POPULATE_CONTROL_TYPES:
            auto_populate_params[auto_populate_param_name(q.order)] = q.id

    # exclude_none: TS's `config.analytics` is a plain object literal that only ever
    # has the keys actually set on it (e.g. `{ enabled: false }` has no
    # reportSuiteID/imsOrgID/datastreamID keys at all when unset) — Pydantic's
    # model_dump() would otherwise materialize every Optional field as an explicit
    # `null`, which the real reference data file never emits.
    analytics = config.analytics.model_dump(exclude_none=True) if config.analytics is not None else {"enabled": False}

    parts: list[tuple[str, Any]] = [
        ("page_error", page_error),
        ("fields", fields),
        ("questions", questions),
        ("answers", answers),
        ("validation_messages", validation_messages),
        ("country_subsidiary", builder_subsidiary_tables[0] if builder_subsidiary_tables else COUNTRY_SUBSIDIARY),
        ("subsidiary_detail", builder_subsidiary_tables[1] if builder_subsidiary_tables else SUBSIDIARY_DETAIL),
        (
            "param",
            {
                "apiEndpoint": config.apiEndpoint or "",
                "channel": {
                    "fullForm": (config.channel.fullForm or "") if config.channel else "",
                    "oneClick": (config.channel.oneClick or "") if config.channel else "",
                },
                "channelDetail": {
                    "fullForm": (config.channelDetail.fullForm or "") if config.channelDetail else "",
                    "oneClick": (config.channelDetail.oneClick or "") if config.channelDetail else "",
                },
                "fallbackLanguage": default_locale,
                "project": config.project or "",
                "reCaptchaSiteKey": "",
                "redirectAfterSuccessInSecond": "5",
                "source": {
                    "fullForm": (config.source.fullForm or "") if config.source else "",
                    "oneClick": (config.source.oneClick or "") if config.source else "",
                },
                "voucherRequired": config.voucherRequired or "N",
                "analytics": analytics,
            },
        ),
        ("auto_populate_params", auto_populate_params),
    ]

    contents = "\n\n".join(f"const {name} = {safe_json_for_script(value)};" for name, value in parts) + "\n"
    return GeneratedFile(path=file_names.dataJs, contents=contents)
