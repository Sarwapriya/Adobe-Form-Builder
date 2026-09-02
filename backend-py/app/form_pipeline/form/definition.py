"""Port of packages/shared/src/form/formDefinition.ts + formDefinitionZod.ts.

The single canonical, serializable model produced by the (now-removed) Excel
parser/mapper and the Form Builder, consumed by the codegen pipeline. Ported
as Pydantic models: the field/type shape mirrors formDefinition.ts exactly,
and Pydantic's own construction-time validation (required vs. Optional
fields, Literal enums) stands in for formDefinitionZod.ts's runtime
`z.object(...)` checks — both files were hand-kept in sync 1:1 in the
TypeScript source, so a single Pydantic model plays both roles here.

Pydantic's default `extra="ignore"` behavior on unrecognized keys mirrors
zod's own default (a plain `z.object()` strips unknown keys unless
`.strict()` is used — formDefinitionSchema never calls `.strict()`).
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

# `<lang>_<COUNTRY>`, e.g. "en_GB", "he_IL", "ar_SA". Always includes the
# English source locale. Kept as a plain `str` alias (not a validated newtype)
# since the TS source itself is just `type LocaleCode = string`.
LocaleCode = str

# The language subtag portion of a LocaleCode, e.g. "en", "he", "ar".
LangSubtag = str

# "text" is historical naming — it renders as a multi-line <textarea>, kept as-is
# for Excel-sourced-form backward compatibility. "shortText" (single-line <input>)
# and "dropdown" (<select>) are builder-only additions.
ControlType = Literal["radio", "checkbox", "text", "shortText", "dropdown"]

FormVariant = Literal["ff", "oc"]

SourceColumn = Literal["en_GB", "C", "D", "builder"]


class _Model(BaseModel):
    # validate_assignment: lets callers assign a plain dict/list to a nested-model
    # field (e.g. `form.fields.mobileNumber = {...}`) the way a TS object literal
    # assignment works with no runtime checking — Pydantic coerces it into the
    # proper nested model on assignment instead of storing the raw dict verbatim.
    model_config = ConfigDict(extra="ignore", validate_assignment=True)


class LocaleInfo(_Model):
    code: LocaleCode
    langSubtag: LangSubtag
    isRtl: bool
    sourceColumn: SourceColumn
    label: str


class AnswerImage(_Model):
    src: str
    alt: Optional[str] = None


class AnswerDefinition(_Model):
    """"A1".."An" """

    id: str
    order: int
    textByLocale: dict[LocaleCode, str] = Field(default_factory=dict)
    image: Optional[AnswerImage] = None


class QuestionDefinition(_Model):
    """"Q1".."Qn" — arbitrary count, not capped."""

    id: str
    order: int
    controlType: ControlType
    headingByLocale: dict[LocaleCode, str] = Field(default_factory=dict)
    subheadingByLocale: dict[LocaleCode, str] = Field(default_factory=dict)
    required: bool
    answers: list[AnswerDefinition] = Field(default_factory=list)
    visibleInVariants: Optional[list[FormVariant]] = None
    autoPopulateEligible: Optional[bool] = None
    autoPopulateEnabled: Optional[bool] = None
    lockedFromSubsidiary: Optional[bool] = None


class LocalizedFieldMeta(_Model):
    labelByLocale: dict[LocaleCode, str] = Field(default_factory=dict)
    placeholderByLocale: Optional[dict[LocaleCode, str]] = None


class CallingCodeFieldMeta(LocalizedFieldMeta):
    dropdownFirstEntryByLocale: dict[LocaleCode, str] = Field(default_factory=dict)


class MobileNumberFieldMeta(LocalizedFieldMeta):
    countries: list[str] = Field(default_factory=list)
    countriesByLocale: Optional[dict[LocaleCode, list[str]]] = None
    dropdownFirstEntryByLocale: dict[LocaleCode, str] = Field(default_factory=dict)


def resolve_mobile_number_countries(field: MobileNumberFieldMeta, locale: LocaleCode) -> list[str]:
    """Resolves the effective country list for one locale of a builder-authored
    `fields.mobileNumber` field — the locale's own `countriesByLocale` override when
    one is set and non-empty, else the field's shared `countries` fallback."""
    override = (field.countriesByLocale or {}).get(locale)
    if override and len(override) > 0:
        return override
    return field.countries


class PrivacyPolicyMeta(_Model):
    textByLocale: dict[LocaleCode, str] = Field(default_factory=dict)
    linkUrlByLocale: dict[LocaleCode, str] = Field(default_factory=dict)
    linkTextByLocale: Optional[dict[LocaleCode, str]] = None
    required: Optional[bool] = None
    visibleInVariants: Optional[list[FormVariant]] = None


class TermsAndConditionsMeta(_Model):
    textByLocale: dict[LocaleCode, str] = Field(default_factory=dict)
    urlByLocale: dict[LocaleCode, str] = Field(default_factory=dict)


class ConsentToggleMeta(LocalizedFieldMeta):
    required: Optional[bool] = None
    visibleInVariants: Optional[list[FormVariant]] = None


class ConsentDefinition(_Model):
    """"consentExtra1".."consentExtraN" """

    id: str
    order: int
    textByLocale: dict[LocaleCode, str] = Field(default_factory=dict)
    linkUrlByLocale: Optional[dict[LocaleCode, str]] = None
    required: Optional[bool] = None
    visibleInVariants: Optional[list[FormVariant]] = None


class ProfileFieldSet(_Model):
    email: Optional[LocalizedFieldMeta] = None
    firstName: Optional[LocalizedFieldMeta] = None
    lastName: Optional[LocalizedFieldMeta] = None
    countryCode: Optional[LocalizedFieldMeta] = None
    callingCode: Optional[CallingCodeFieldMeta] = None
    mobileNumber: Optional[MobileNumberFieldMeta] = None
    privacyPolicy: Optional[PrivacyPolicyMeta] = None
    marketingOptin: Optional[ConsentToggleMeta] = None
    additionalConsents: Optional[list[ConsentDefinition]] = None
    termsAndConditions: Optional[TermsAndConditionsMeta] = None
    submitButton: LocalizedFieldMeta
    redirectAfterSuccessUrlByLocale: Optional[dict[LocaleCode, str]] = None
    headingBeforeBreakByLocale: Optional[dict[LocaleCode, str]] = None
    headingAfterBreakByLocale: Optional[dict[LocaleCode, str]] = None
    headingBeforeBreakFFByLocale: Optional[dict[LocaleCode, str]] = None
    headingAfterBreakFFByLocale: Optional[dict[LocaleCode, str]] = None
    campaignSubheadingByLocale: Optional[dict[LocaleCode, str]] = None
    campaignSubheadingFFByLocale: Optional[dict[LocaleCode, str]] = None
    requiredFieldNoteByLocale: Optional[dict[LocaleCode, str]] = None
    extraFieldsByLocale: Optional[dict[str, dict[LocaleCode, str]]] = None


class PageCopy(_Model):
    heading: Optional[str] = None
    subHeading: Optional[str] = None
    subHeadingUrlText: Optional[str] = None
    subHeadingUrl: Optional[str] = None


class ValidationMessageSet(_Model):
    requiredField: Optional[str] = None
    email: Optional[str] = None
    mobileNumber: Optional[str] = None
    modalMessage1: Optional[str] = None
    modalMessage2: Optional[str] = None
    modalButtonYes: Optional[str] = None
    modalButtonNo: Optional[str] = None
    emailError: Optional[str] = None
    firstNameError: Optional[str] = None
    lastNameError: Optional[str] = None
    callingCodeError: Optional[str] = None
    mobileNumberType: Optional[str] = None
    mobileNumberLength: Optional[str] = None
    mobileNumberError: Optional[str] = None
    zipCodeError: Optional[str] = None
    reCaptchaRequired: Optional[str] = None
    apiError: Optional[str] = None


class FormMeta(_Model):
    subsidiary: str
    sourceFileName: str
    # The locale sourced from the "Original en_GB Text" column.
    defaultLocale: LocaleCode


class FormDefinition(_Model):
    meta: FormMeta
    locales: list[LocaleInfo] = Field(default_factory=list)
    questions: list[QuestionDefinition] = Field(default_factory=list)
    fields: ProfileFieldSet
    validationMessages: dict[LocaleCode, ValidationMessageSet] = Field(default_factory=dict)
    pageError: dict[LocaleCode, PageCopy] = Field(default_factory=dict)
    thankYou: dict[LocaleCode, PageCopy] = Field(default_factory=dict)


def resolve_localized_text(
    map: Optional[dict[LocaleCode, str]],
    locale: LocaleCode,
    default_locale: LocaleCode,
) -> str:
    """Resolve a per-locale text map with fallback to the form's default locale, then "".

    Mirrors TS's `map[locale] ?? map[defaultLocale] ?? ""` exactly: an
    explicitly-empty-string entry for `locale` is NOT treated as missing (no
    fallback), only an actually-absent key is — nullish coalescing, not `||`.
    """
    if map is None:
        return ""
    value = map.get(locale)
    if value is not None:
        return value
    fallback = map.get(default_locale)
    if fallback is not None:
        return fallback
    return ""
