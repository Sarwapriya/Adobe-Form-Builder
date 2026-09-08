"""Port of packages/shared/src/excel/questionMasterRows.ts.

Builds the flat, per-(subsidiary, locale, question/field, answer) row shape
used by the "Question Master" admin export — one `.xlsx` per project code,
compiled from every subsidiary's published `FormDefinition` under that
project. A multi-option question (radio/checkbox/dropdown) expands into one
row per answer; everything else (profile fields, free-text questions) gets
exactly one row.
"""

from __future__ import annotations

from typing import Literal, TypedDict

from ..codegen.dom_ids import answer_dom_key
from ..form.definition import ControlType, FormDefinition, LocaleCode, ProfileFieldSet, QuestionDefinition, resolve_localized_text

# Some downstream import of this report caps every cell at 255 characters.
_MAX_CELL_LENGTH = 255

QuestionMasterType = Literal["Free text", "checkbox", "dropdown", "Single", "Multi"]
YesNo = Literal["Y", "N"]
LocalYn = Literal["Standard", "Local"]


class QuestionMasterRow(TypedDict):
    division: str
    project: str
    subsidiary: str
    country_alpha_2: str
    locale: str
    question_code: str
    question_text_full: str
    question_text_alias: str
    mandatory_yn: YesNo
    local_yn: LocalYn
    type: QuestionMasterType
    answer_code: str
    answer_text_full: str
    answer_text_alias: str


class _FieldRow(TypedDict):
    question_code: str
    question_text_full: str
    question_text_alias: str
    mandatory_yn: YesNo
    local_yn: LocalYn
    type: QuestionMasterType
    answer_code: str
    answer_text_full: str
    answer_text_alias: str


def _yn(required: bool) -> YesNo:
    return "Y" if required else "N"


def _country_alpha_2(locale: LocaleCode) -> str:
    parts = locale.split("_")
    return parts[1] if len(parts) > 1 else ""


def _clamp(value: str) -> str:
    return value[:_MAX_CELL_LENGTH] if len(value) > _MAX_CELL_LENGTH else value


def _clamp_row(row: QuestionMasterRow) -> QuestionMasterRow:
    return QuestionMasterRow(
        division=_clamp(row["division"]),
        project=_clamp(row["project"]),
        subsidiary=_clamp(row["subsidiary"]),
        country_alpha_2=_clamp(row["country_alpha_2"]),
        locale=_clamp(row["locale"]),
        question_code=_clamp(row["question_code"]),
        question_text_full=_clamp(row["question_text_full"]),
        question_text_alias=_clamp(row["question_text_alias"]),
        mandatory_yn=row["mandatory_yn"],
        local_yn=row["local_yn"],
        type=row["type"],
        answer_code=_clamp(row["answer_code"]),
        answer_text_full=_clamp(row["answer_text_full"]),
        answer_text_alias=_clamp(row["answer_text_alias"]),
    )


def _self_referential_row(
    *,
    question_code: str,
    question_text_full: str,
    question_text_alias: str,
    mandatory_yn: YesNo,
    local_yn: LocalYn,
    type: QuestionMasterType,
    answer_code: str,
    answer_text_alias: str,
) -> _FieldRow:
    """A field with no discrete answer options (profile free-text fields, T&C's
    informational link, a free-text question) — its "answer" is just its own
    text, repeated from question_text_full/alias, with a fixed `answer_code`."""
    return _FieldRow(
        question_code=question_code,
        question_text_full=question_text_full,
        question_text_alias=question_text_alias,
        mandatory_yn=mandatory_yn,
        local_yn=local_yn,
        type=type,
        answer_code=answer_code,
        answer_text_full=question_text_full,
        answer_text_alias=answer_text_alias,
    )


def _build_profile_field_rows(fields: ProfileFieldSet, locale: LocaleCode, default_locale: LocaleCode) -> list[_FieldRow]:
    """One row per profile field present on the form, for a single locale — order
    matches the reference workbooks' own row order."""
    rows: list[_FieldRow] = []

    if fields.firstName:
        rows.append(
            _self_referential_row(
                question_code="FIRSTNAME",
                question_text_full=resolve_localized_text(fields.firstName.labelByLocale, locale, default_locale),
                question_text_alias="firstname",
                mandatory_yn="Y",
                local_yn="Standard",
                type="Free text",
                answer_code="firstName",
                answer_text_alias="firstname",
            )
        )
    if fields.lastName:
        rows.append(
            _self_referential_row(
                question_code="LASTNAME",
                question_text_full=resolve_localized_text(fields.lastName.labelByLocale, locale, default_locale),
                question_text_alias="lastname",
                mandatory_yn="Y",
                local_yn="Standard",
                type="Free text",
                answer_code="lastName",
                answer_text_alias="lastname",
            )
        )
    if fields.email:
        rows.append(
            _self_referential_row(
                question_code="EMAIL",
                question_text_full=resolve_localized_text(fields.email.labelByLocale, locale, default_locale),
                question_text_alias="email",
                mandatory_yn="Y",
                local_yn="Standard",
                type="Free text",
                answer_code="email",
                answer_text_alias="email",
            )
        )
    # Excel-sourced forms use callingCode, builder-authored forms use
    # mobileNumber — never both at once — but either represents the same
    # "HPP_CODE" mobile-number row, and both render the same "mobileNumber"
    # input id.
    mobile_field = fields.callingCode or fields.mobileNumber
    if mobile_field:
        rows.append(
            _self_referential_row(
                question_code="HPP_CODE",
                question_text_full=resolve_localized_text(mobile_field.labelByLocale, locale, default_locale),
                question_text_alias="mobileNumber",
                mandatory_yn="Y",
                local_yn="Local",
                type="Free text",
                answer_code="mobileNumber",
                answer_text_alias="mobileNumber",
            )
        )
    if fields.privacyPolicy:
        rows.append(
            _self_referential_row(
                question_code="PRIVACY POLICY_YN",
                question_text_full=resolve_localized_text(fields.privacyPolicy.textByLocale, locale, default_locale),
                question_text_alias="PRIVACY POLICY_YN",
                mandatory_yn=_yn(fields.privacyPolicy.required if fields.privacyPolicy.required is not None else True),
                local_yn="Local",
                type="checkbox",
                answer_code="PRIVACY POLICY_YN",
                answer_text_alias="1 or 0",
            )
        )
    if fields.marketingOptin:
        rows.append(
            _self_referential_row(
                question_code="MKT_AGE_YN",
                question_text_full=resolve_localized_text(fields.marketingOptin.labelByLocale, locale, default_locale),
                question_text_alias="MKT_AGE_YN",
                mandatory_yn=_yn(bool(fields.marketingOptin.required)),
                local_yn="Standard",
                type="checkbox",
                answer_code="MKT_AGE_YN",
                answer_text_alias="1 or 0",
            )
        )
    if fields.countryCode:
        rows.append(
            _self_referential_row(
                question_code="Country",
                question_text_full=resolve_localized_text(fields.countryCode.labelByLocale, locale, default_locale),
                question_text_alias="COUNTRY",
                mandatory_yn="Y",
                local_yn="Local",
                type="dropdown",
                answer_code="Country",
                answer_text_alias="COUNTRY",
            )
        )
    if fields.termsAndConditions:
        rows.append(
            _self_referential_row(
                question_code="TERMS_AND_CONDITIONS",
                question_text_full=resolve_localized_text(fields.termsAndConditions.textByLocale, locale, default_locale),
                question_text_alias="termsAndConditions",
                mandatory_yn="Y",
                local_yn="Standard",
                type="Free text",
                answer_code="termsAndConditionsLink",
                answer_text_alias="termsAndConditions",
            )
        )
    for consent in fields.additionalConsents or []:
        rows.append(
            _self_referential_row(
                question_code=consent.id,
                question_text_full=resolve_localized_text(consent.textByLocale, locale, default_locale),
                question_text_alias=consent.id,
                mandatory_yn=_yn(bool(consent.required)),
                local_yn="Standard",
                type="checkbox",
                answer_code=consent.id,
                answer_text_alias="1 or 0",
            )
        )

    return rows


_QUESTION_TYPE_BY_CONTROL_TYPE: dict[ControlType, QuestionMasterType] = {
    "radio": "Single",
    "checkbox": "Multi",
    "dropdown": "dropdown",
}


def _build_question_rows(question: QuestionDefinition, locale: LocaleCode, default_locale: LocaleCode) -> list[_FieldRow]:
    """One row per answer for a multi-option question (radio/checkbox/dropdown),
    or one self-referential row for a free-text question / a multi-option
    question with no answers defined yet."""
    question_text_full = resolve_localized_text(question.headingByLocale, locale, default_locale)
    question_text_alias = resolve_localized_text(question.headingByLocale, default_locale, default_locale)
    mandatory_yn = _yn(question.required)
    type_ = _QUESTION_TYPE_BY_CONTROL_TYPE.get(question.controlType, "Free text")

    if len(question.answers) == 0:
        return [
            _self_referential_row(
                question_code=question.id,
                question_text_full=question_text_full,
                question_text_alias=question_text_alias,
                mandatory_yn=mandatory_yn,
                local_yn="Standard",
                type=type_,
                answer_code=question.id,
                answer_text_alias=question_text_alias,
            )
        ]

    return [
        _FieldRow(
            question_code=question.id,
            question_text_full=question_text_full,
            question_text_alias=question_text_alias,
            mandatory_yn=mandatory_yn,
            local_yn="Standard",
            type=type_,
            answer_code=answer_dom_key(answer.order),
            answer_text_full=resolve_localized_text(answer.textByLocale, locale, default_locale),
            answer_text_alias=resolve_localized_text(answer.textByLocale, default_locale, default_locale),
        )
        for answer in question.answers
    ]


def build_question_master_rows(form: FormDefinition, division: str, project: str) -> list[QuestionMasterRow]:
    """Pure projection of a single subsidiary's `FormDefinition` into Question
    Master rows — one row per (locale, profile field or question answer)."""
    rows: list[QuestionMasterRow] = []
    subsidiary = form.meta.subsidiary
    default_locale = form.meta.defaultLocale

    for locale_info in form.locales:
        locale = locale_info.code
        base = {
            "division": division,
            "project": project,
            "subsidiary": subsidiary,
            "country_alpha_2": _country_alpha_2(locale),
            "locale": locale,
        }

        for field_row in _build_profile_field_rows(form.fields, locale, default_locale):
            rows.append(_clamp_row(QuestionMasterRow(**base, **field_row)))

        for question in form.questions:
            for question_row in _build_question_rows(question, locale, default_locale):
                rows.append(_clamp_row(QuestionMasterRow(**base, **question_row)))

    return rows
