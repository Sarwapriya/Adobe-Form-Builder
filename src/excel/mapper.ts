import type {
  AnswerDefinition,
  ControlType,
  FormDefinition,
  LocaleCode,
  PageCopy,
  ProfileFieldSet,
  QuestionDefinition,
} from "../form/formDefinition.ts";
import { ENGLISH_LOCALE, resolveLocales, type UnresolvedLocale } from "./localeDetection.ts";
import { isBracketPlaceholder, normalizeLoose } from "./textUtils.ts";
import type { Issue, ParsedWorkbook, RawRow } from "./types.ts";

const SHEET_NAME = "Complete Translations";
const ANSWER_MARKER_RE = /^\(\s*(single|multiple)\s+answers?\s*\)/i;
const QUESTION_KEY_RE = /^q\d+$/i;
const ANSWER_KEY_RE = /^a\d+$/i;

type Section = "fields" | "pageError" | "thankYou";

interface QuestionAccumulator {
  id: string;
  startRow: number;
  headingByLocale: Record<LocaleCode, string>;
  subheadingByLocale: Record<LocaleCode, string>;
  controlType: ControlType | null;
  answers: AnswerDefinition[];
}

export interface MapResult {
  form: FormDefinition;
  unresolvedLocales: UnresolvedLocale[];
  issues: Issue[];
}

type FieldSetter = (fields: ProfileFieldSet, textByLocale: Record<LocaleCode, string>) => void;

function simpleField(name: "email" | "firstName" | "lastName" | "countryCode" | "marketingOptin"): FieldSetter {
  return (fields, textByLocale) => {
    fields[name] = { labelByLocale: textByLocale };
  };
}

const FLAT_FIELD_SETTERS: Record<string, FieldSetter> = {
  [normalizeLoose("headingBeforeBreak")]: (f, t) => {
    f.headingBeforeBreakByLocale = t;
  },
  [normalizeLoose("headingAfterBreak")]: (f, t) => {
    f.headingAfterBreakByLocale = t;
  },
  [normalizeLoose("requiredField")]: (f, t) => {
    f.requiredFieldNoteByLocale = t;
  },
  [normalizeLoose("countryCode")]: simpleField("countryCode"),
  [normalizeLoose("email")]: simpleField("email"),
  [normalizeLoose("firstName")]: simpleField("firstName"),
  [normalizeLoose("lastName")]: simpleField("lastName"),
  [normalizeLoose("callingCodeDropdownFirstEntry")]: (f, t) => {
    f.callingCode = { labelByLocale: {}, ...f.callingCode, dropdownFirstEntryByLocale: t };
  },
  [normalizeLoose("callingCode")]: (f, t) => {
    f.callingCode = { dropdownFirstEntryByLocale: {}, ...f.callingCode, labelByLocale: t };
  },
  [normalizeLoose("privacyPolicy (.com form only)")]: (f, t) => {
    f.privacyPolicy = { linkUrlByLocale: {}, ...f.privacyPolicy, textByLocale: t };
  },
  [normalizeLoose("url")]: (f, t) => {
    f.privacyPolicy = { textByLocale: {}, ...f.privacyPolicy, linkUrlByLocale: t };
  },
  [normalizeLoose("Marketing optin (.com form only)")]: simpleField("marketingOptin"),
  [normalizeLoose("submitButton")]: (f, t) => {
    f.submitButton = { labelByLocale: t };
  },
  [normalizeLoose("Terms and Conditions")]: (f, t) => {
    f.termsAndConditions = { urlByLocale: {}, ...f.termsAndConditions, textByLocale: t };
  },
  [normalizeLoose("redirectAfterSuccessUrl")]: (f, t) => {
    f.redirectAfterSuccessUrlByLocale = t;
  },
  // Known key with no dedicated model field (Samsung-specific "Raffle Draw" promo
  // copy) — routed straight to the passthrough bucket, silently, since it's a
  // recognized part of the schema rather than a genuinely unrecognized key.
  [normalizeLoose("Rafle Draw")]: (f, t) => {
    f.extraFieldsByLocale = { ...f.extraFieldsByLocale, "Rafle Draw": t };
  },
};

const PAGE_COPY_FIELD_BY_KEY = new Map<string, keyof PageCopy>([
  [normalizeLoose("heading"), "heading"],
  [normalizeLoose("subHeading"), "subHeading"],
  [normalizeLoose("subHeadingUrlText"), "subHeadingUrlText"],
  [normalizeLoose("subHeadingUrl"), "subHeadingUrl"],
]);

const THANK_YOU_MARKER_KEY = normalizeLoose("Form Thank you Page");

/**
 * Walks the raw rows of the "Complete Translations" sheet and produces a `FormDefinition`.
 * Column A is the sheet's own documented row-type key ("(Do not change this column)") —
 * only non-blank values there are treated as meaningful, machine-readable keys; every
 * blank-key row (spacer, section sub-header like "Fields needed (English)", the
 * "(Single answer)"/"(Multiple answers)" marker) is handled generically rather than
 * erroring, since the sheet's own convention is that blank column A means "not for
 * automated processing".
 */
export function mapWorkbook(parsed: ParsedWorkbook): MapResult {
  const issues: Issue[] = [];
  const { locales, unresolved } = resolveLocales(parsed.meta, parsed.rows);
  const localeByColumn: Partial<Record<"C" | "D", LocaleCode>> = {};
  for (const l of locales) {
    if (l.sourceColumn === "C") localeByColumn.C = l.code;
    if (l.sourceColumn === "D") localeByColumn.D = l.code;
  }
  const defaultLocale = ENGLISH_LOCALE.code;

  function textMap(row: RawRow): Record<LocaleCode, string> {
    const map: Record<LocaleCode, string> = { [defaultLocale]: row.englishText };
    if (localeByColumn.C && row.translationC !== "") map[localeByColumn.C] = row.translationC;
    if (localeByColumn.D && row.translationD !== "") map[localeByColumn.D] = row.translationD;
    return map;
  }

  const questions: QuestionDefinition[] = [];
  const fields: ProfileFieldSet = { submitButton: { labelByLocale: {} } };
  const pageError: Record<LocaleCode, PageCopy> = {};
  const thankYou: Record<LocaleCode, PageCopy> = {};
  const extraFields: Record<string, Record<LocaleCode, string>> = {};

  const seenQuestionIds = new Set<string>();
  let currentSection: Section = "fields";
  let current: QuestionAccumulator | null = null;

  function setPageCopyField(section: "pageError" | "thankYou", field: keyof PageCopy, textByLocale: Record<LocaleCode, string>) {
    const target = section === "pageError" ? pageError : thankYou;
    for (const [locale, text] of Object.entries(textByLocale)) {
      target[locale] = { ...target[locale], [field]: text };
    }
  }

  function flushQuestion() {
    if (!current) return;
    const q = current;
    current = null;
    const heading = q.headingByLocale[defaultLocale] ?? "";
    if (heading === "" || isBracketPlaceholder(heading)) {
      issues.push({
        severity: "warning",
        sheet: SHEET_NAME,
        row: q.startRow,
        message: `Question ${q.id} looks like an unfilled placeholder (English text: "${heading || "(empty)"}") and was excluded from the generated form.`,
      });
      return;
    }
    let controlType = q.controlType;
    if (q.answers.length === 0) {
      controlType = "text";
    } else if (controlType === null) {
      issues.push({
        severity: "warning",
        sheet: SHEET_NAME,
        row: q.startRow,
        message: `Question ${q.id} has no "(Single answer)"/"(Multiple answers)" marker row; defaulting to single-answer (radio).`,
      });
      controlType = "radio";
    }
    questions.push({
      id: q.id,
      order: questions.length + 1,
      controlType,
      headingByLocale: q.headingByLocale,
      subheadingByLocale: q.subheadingByLocale,
      required: true,
      answers: q.answers,
    });
  }

  const dataRows = parsed.rows.filter((r) => r.rowNumber > parsed.headerRowNumber);

  for (const row of dataRows) {
    const key = row.key;
    const keyLoose = normalizeLoose(key);

    if (QUESTION_KEY_RE.test(key)) {
      flushQuestion();
      if (seenQuestionIds.has(keyLoose)) {
        issues.push({
          severity: "error",
          sheet: SHEET_NAME,
          row: row.rowNumber,
          message: `Duplicate question id "${key}" — a question with this id was already seen earlier in the sheet.`,
        });
      }
      seenQuestionIds.add(keyLoose);
      current = {
        id: key,
        startRow: row.rowNumber,
        headingByLocale: textMap(row),
        subheadingByLocale: {},
        controlType: null,
        answers: [],
      };
      continue;
    }

    if (ANSWER_KEY_RE.test(key)) {
      if (!current) {
        issues.push({
          severity: "error",
          sheet: SHEET_NAME,
          row: row.rowNumber,
          message: `Answer row "${key}" found with no preceding question row; skipped.`,
        });
        continue;
      }
      current.answers.push({
        id: key,
        order: current.answers.length + 1,
        textByLocale: textMap(row),
      });
      continue;
    }

    if (key === "") {
      const markerMatch = ANSWER_MARKER_RE.exec(row.englishText);
      if (markerMatch && current && current.answers.length === 0) {
        current.controlType = /multiple/i.test(markerMatch[1]!) ? "checkbox" : "radio";
        current.subheadingByLocale = textMap(row);
        continue;
      }
      if (/^page error/i.test(row.englishText)) {
        flushQuestion();
        currentSection = "pageError";
        continue;
      }
      // Benign no-op: spacer row, or a section sub-header like "Fields needed (English)"
      // / "Select correct values for this form" that isn't meant for automated reading.
      continue;
    }

    if (keyLoose === THANK_YOU_MARKER_KEY) {
      flushQuestion();
      currentSection = "thankYou";
      continue;
    }

    if (currentSection !== "fields" && PAGE_COPY_FIELD_BY_KEY.has(keyLoose)) {
      flushQuestion();
      setPageCopyField(currentSection, PAGE_COPY_FIELD_BY_KEY.get(keyLoose)!, textMap(row));
      continue;
    }

    const setter = FLAT_FIELD_SETTERS[keyLoose];
    if (setter) {
      flushQuestion();
      setter(fields, textMap(row));
      continue;
    }

    flushQuestion();
    extraFields[key] = textMap(row);
    issues.push({
      severity: "warning",
      sheet: SHEET_NAME,
      row: row.rowNumber,
      message: `Unrecognized row key "${key}" — its text was preserved but not mapped to a known field.`,
    });
  }

  flushQuestion();

  if (Object.keys(extraFields).length > 0) fields.extraFieldsByLocale = extraFields;

  const subsidiary = parsed.meta.subsidiary.C || parsed.meta.subsidiary.D || "";

  const form: FormDefinition = {
    meta: { subsidiary, sourceFileName: parsed.sourceFileName, defaultLocale },
    locales,
    questions,
    fields,
    validationMessages: {},
    pageError,
    thankYou,
  };

  return { form, unresolvedLocales: unresolved, issues };
}
