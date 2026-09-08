/**
 * Builds the flat, per-(subsidiary, locale, question/field, answer) row shape used by
 * the "Question Master" admin export — one `.xlsx` per project code, compiled from
 * every subsidiary's published `FormDefinition` under that project. Column layout and
 * values are modeled after the hand-maintained reference workbooks in `Documents/`
 * (`Question_Master_F2H26_V2.xlsx`, `QuestionMaster_TV2H26.xlsx`), not derived from them
 * at runtime — this is a pure projection of `FormDefinition`. A multi-option question
 * (radio/checkbox/dropdown) expands into one row per answer (`question_text_full`/
 * `question_text_alias`/`mandatory_yn`/`local_yn` repeated across those rows, matching
 * the reference workbooks' own shape) — everything else (profile fields, free-text
 * questions) gets exactly one row.
 */

import { answerDomKey } from "../codegen/domIds";
import { resolveLocalizedText, type ControlType, type FormDefinition, type LocaleCode, type ProfileFieldSet, type QuestionDefinition } from "../form/formDefinition";

/** Some downstream import of this report caps every cell at 255 characters. */
const MAX_CELL_LENGTH = 255;

export interface QuestionMasterRow {
  division: string;
  project: string;
  subsidiary: string;
  country_alpha_2: string;
  locale: string;
  question_code: string;
  question_text_full: string;
  question_text_alias: string;
  mandatory_yn: "Y" | "N";
  local_yn: "Standard" | "Local";
  /** "Free text" (name/email/mobile/free-text questions), "checkbox" (Privacy Policy,
   * Marketing Opt-in, extra consents), "dropdown" (Country, dropdown-control
   * questions), "Single" (radio-control questions), or "Multi" (checkbox-control
   * questions) — matches the reference workbooks' own `type` values. */
  type: "Free text" | "checkbox" | "dropdown" | "Single" | "Multi";
  /** The generated form's own DOM id for whatever this row describes — `A1`/`A2`/... for
   * a question's answer (see `domIds.answerDomKey`, the "A1" part of the rendered
   * `Q1A1` input id), or the field's own fixed input id (`firstName`, `email`,
   * `mobileNumber`, ...) for profile fields — see renderProfileField.ts/pageTemplate.ts,
   * the actual generated-HTML source of these ids. */
  answer_code: string;
  answer_text_full: string;
  answer_text_alias: string;
}

function yn(required: boolean): "Y" | "N" {
  return required ? "Y" : "N";
}

function countryAlpha2(locale: LocaleCode): string {
  return locale.split("_")[1] ?? "";
}

function clamp(value: string): string {
  return value.length > MAX_CELL_LENGTH ? value.slice(0, MAX_CELL_LENGTH) : value;
}

function clampRow(row: QuestionMasterRow): QuestionMasterRow {
  return {
    division: clamp(row.division),
    project: clamp(row.project),
    subsidiary: clamp(row.subsidiary),
    country_alpha_2: clamp(row.country_alpha_2),
    locale: clamp(row.locale),
    question_code: clamp(row.question_code),
    question_text_full: clamp(row.question_text_full),
    question_text_alias: clamp(row.question_text_alias),
    mandatory_yn: row.mandatory_yn,
    local_yn: row.local_yn,
    type: row.type,
    answer_code: clamp(row.answer_code),
    answer_text_full: clamp(row.answer_text_full),
    answer_text_alias: clamp(row.answer_text_alias),
  };
}

type FieldRow = Omit<QuestionMasterRow, "division" | "project" | "subsidiary" | "country_alpha_2" | "locale">;

/** A field with no discrete answer options (profile free-text fields, T&C's
 * informational link, a free-text question) — its "answer" is just its own text,
 * repeated from question_text_full/alias, with a fixed `answer_code`. */
function selfReferentialRow(
  base: Pick<FieldRow, "question_code" | "question_text_full" | "question_text_alias" | "mandatory_yn" | "local_yn">,
  type: FieldRow["type"],
  answerCode: string,
  answerTextAlias: string,
): FieldRow {
  return {
    ...base,
    type,
    answer_code: answerCode,
    answer_text_full: base.question_text_full,
    answer_text_alias: answerTextAlias,
  };
}

/** One row per profile field present on the form, for a single locale — order matches
 * the reference workbooks' own row order. `local_yn` is "Local" only for the three
 * fields confirmed subsidiary-specific (mobile number, Privacy Policy, country); every
 * other field is "Standard", per explicit user correction — not a broader "every
 * optional/admin-toggled field is Local" rule. `answer_code` for firstName/lastName/
 * email/mobileNumber is that field's own generated-HTML input id (see
 * renderProfileField.ts) — per explicit user correction, not the reference workbooks'
 * own (inconsistent) values for those two. */
function buildProfileFieldRows(fields: ProfileFieldSet, locale: LocaleCode, defaultLocale: LocaleCode): FieldRow[] {
  const rows: FieldRow[] = [];

  if (fields.firstName) {
    rows.push(
      selfReferentialRow(
        {
          question_code: "FIRSTNAME",
          question_text_full: resolveLocalizedText(fields.firstName.labelByLocale, locale, defaultLocale),
          question_text_alias: "firstname",
          mandatory_yn: "Y",
          local_yn: "Standard",
        },
        "Free text",
        "firstName",
        "firstname",
      ),
    );
  }
  if (fields.lastName) {
    rows.push(
      selfReferentialRow(
        {
          question_code: "LASTNAME",
          question_text_full: resolveLocalizedText(fields.lastName.labelByLocale, locale, defaultLocale),
          question_text_alias: "lastname",
          mandatory_yn: "Y",
          local_yn: "Standard",
        },
        "Free text",
        "lastName",
        "lastname",
      ),
    );
  }
  if (fields.email) {
    rows.push(
      selfReferentialRow(
        {
          question_code: "EMAIL",
          question_text_full: resolveLocalizedText(fields.email.labelByLocale, locale, defaultLocale),
          question_text_alias: "email",
          mandatory_yn: "Y",
          local_yn: "Standard",
        },
        "Free text",
        "email",
        "email",
      ),
    );
  }
  // Excel-sourced forms use callingCode, builder-authored forms use mobileNumber — never
  // both at once — but either represents the same "HPP_CODE" mobile-number row, and both
  // render the same "mobileNumber" input id (see renderProfileField.ts).
  const mobileField = fields.callingCode ?? fields.mobileNumber;
  if (mobileField) {
    rows.push(
      selfReferentialRow(
        {
          question_code: "HPP_CODE",
          question_text_full: resolveLocalizedText(mobileField.labelByLocale, locale, defaultLocale),
          question_text_alias: "mobileNumber",
          mandatory_yn: "Y",
          local_yn: "Local",
        },
        "Free text",
        "mobileNumber",
        "mobileNumber",
      ),
    );
  }
  if (fields.privacyPolicy) {
    rows.push(
      selfReferentialRow(
        {
          question_code: "PRIVACY POLICY_YN",
          question_text_full: resolveLocalizedText(fields.privacyPolicy.textByLocale, locale, defaultLocale),
          question_text_alias: "PRIVACY POLICY_YN",
          mandatory_yn: yn(fields.privacyPolicy.required ?? true),
          local_yn: "Local",
        },
        "checkbox",
        "PRIVACY POLICY_YN",
        "1 or 0",
      ),
    );
  }
  if (fields.marketingOptin) {
    rows.push(
      selfReferentialRow(
        {
          question_code: "MKT_AGE_YN",
          question_text_full: resolveLocalizedText(fields.marketingOptin.labelByLocale, locale, defaultLocale),
          question_text_alias: "MKT_AGE_YN",
          mandatory_yn: yn(fields.marketingOptin.required ?? false),
          local_yn: "Standard",
        },
        "checkbox",
        "MKT_AGE_YN",
        "1 or 0",
      ),
    );
  }
  if (fields.countryCode) {
    rows.push(
      selfReferentialRow(
        {
          question_code: "Country",
          question_text_full: resolveLocalizedText(fields.countryCode.labelByLocale, locale, defaultLocale),
          question_text_alias: "COUNTRY",
          mandatory_yn: "Y",
          local_yn: "Local",
        },
        "dropdown",
        "Country",
        "COUNTRY",
      ),
    );
  }
  if (fields.termsAndConditions) {
    rows.push(
      selfReferentialRow(
        {
          question_code: "TERMS_AND_CONDITIONS",
          question_text_full: resolveLocalizedText(fields.termsAndConditions.textByLocale, locale, defaultLocale),
          question_text_alias: "termsAndConditions",
          mandatory_yn: "Y",
          local_yn: "Standard",
        },
        "Free text",
        "termsAndConditionsLink",
        "termsAndConditions",
      ),
    );
  }
  for (const consent of fields.additionalConsents ?? []) {
    rows.push(
      selfReferentialRow(
        {
          question_code: consent.id,
          question_text_full: resolveLocalizedText(consent.textByLocale, locale, defaultLocale),
          question_text_alias: consent.id,
          mandatory_yn: yn(consent.required ?? false),
          local_yn: "Standard",
        },
        "checkbox",
        consent.id,
        "1 or 0",
      ),
    );
  }

  return rows;
}

const QUESTION_TYPE_BY_CONTROL_TYPE: Partial<Record<ControlType, FieldRow["type"]>> = {
  radio: "Single",
  checkbox: "Multi",
  dropdown: "dropdown",
};

/** One row per answer for a multi-option question (radio/checkbox/dropdown), or one
 * self-referential row for a free-text question / a multi-option question with no
 * answers defined yet — `answer_code` is the answer's own rendered DOM id (`A1`, `A2`,
 * ... — see `domIds.answerDomKey`, the "A1" part of the generated `Q1A1` input id), not
 * its raw Excel-parsed `id`, which can have gaps `answerDomKey` deliberately closes. */
function buildQuestionRows(
  question: QuestionDefinition,
  locale: LocaleCode,
  defaultLocale: LocaleCode,
): FieldRow[] {
  const base = {
    question_code: question.id,
    question_text_full: resolveLocalizedText(question.headingByLocale, locale, defaultLocale),
    question_text_alias: resolveLocalizedText(question.headingByLocale, defaultLocale, defaultLocale),
    mandatory_yn: yn(question.required),
    local_yn: "Standard" as const,
  };
  const type = QUESTION_TYPE_BY_CONTROL_TYPE[question.controlType] ?? "Free text";

  if (question.answers.length === 0) {
    return [selfReferentialRow(base, type, question.id, base.question_text_alias)];
  }

  return question.answers.map((answer) => ({
    ...base,
    type,
    answer_code: answerDomKey(answer.order),
    answer_text_full: resolveLocalizedText(answer.textByLocale, locale, defaultLocale),
    answer_text_alias: resolveLocalizedText(answer.textByLocale, defaultLocale, defaultLocale),
  }));
}

/**
 * Pure projection of a single subsidiary's `FormDefinition` into Question Master rows —
 * one row per (locale, profile field or question answer). `division` and `project` are
 * supplied by the caller (see `questionMasterService.ts`) — neither is carried on
 * `FormDefinition` itself: `division` has no equivalent anywhere in the app, and
 * `project` lives on the backend's `Form` entity, not the definition JSON. Called once
 * per subsidiary's published form by the backend generation service, which
 * concatenates the results across every subsidiary in a project before writing the
 * workbook.
 */
export function buildQuestionMasterRows(form: FormDefinition, division: string, project: string): QuestionMasterRow[] {
  const rows: QuestionMasterRow[] = [];
  const { subsidiary, defaultLocale } = form.meta;

  for (const localeInfo of form.locales) {
    const locale = localeInfo.code;
    const base = { division, project, subsidiary, country_alpha_2: countryAlpha2(locale), locale };

    for (const fieldRow of buildProfileFieldRows(form.fields, locale, defaultLocale)) {
      rows.push(clampRow({ ...base, ...fieldRow }));
    }

    for (const question of form.questions) {
      for (const questionRow of buildQuestionRows(question, locale, defaultLocale)) {
        rows.push(clampRow({ ...base, ...questionRow }));
      }
    }
  }

  return rows;
}
