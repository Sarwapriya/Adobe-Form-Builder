import { ENGLISH_LOCALE } from "./localeDetection.ts";
import type { MapResult } from "./mapper.ts";
import type { Issue, ValidationResult } from "./types.ts";

const SHEET_NAME = "Complete Translations";
/** Leading characters that make a spreadsheet cell interpretable as a formula by
 * Excel/Sheets/CSV consumers — a classic CSV/Excel-injection vector (spec §18). */
const FORMULA_LIKE_RE = /^[=+\-@]/;

/**
 * Combines the structural issues surfaced during parsing/mapping with a handful of
 * additional whole-workbook checks, and partitions everything into blocking errors
 * vs. non-blocking warnings. Generation should only be enabled once `errors` is empty.
 */
export function validateWorkbook(mapResult: MapResult, parserIssues: Issue[]): ValidationResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];

  for (const issue of [...parserIssues, ...mapResult.issues]) {
    (issue.severity === "error" ? errors : warnings).push(issue);
  }

  for (const unresolved of mapResult.unresolvedLocales) {
    errors.push({
      severity: "error",
      sheet: SHEET_NAME,
      column: unresolved.column,
      message: `Column ${unresolved.column}'s "Language_Country" metadata could not be read (found "${unresolved.rawValue || "(blank)"}"), but the column has real translated content. Confirm which language column ${unresolved.column} is before generating.`,
    });
  }

  if (mapResult.form.questions.length === 0) {
    errors.push({
      severity: "error",
      sheet: SHEET_NAME,
      message: "No usable questions were found (every question row was empty or unfilled placeholder text).",
    });
  }

  if (!mapResult.form.fields.submitButton.labelByLocale[ENGLISH_LOCALE.code]) {
    errors.push({
      severity: "error",
      sheet: SHEET_NAME,
      message: 'No "submitButton" row/text was found; the generated form needs a submit button label.',
    });
  }

  for (const q of mapResult.form.questions) {
    checkFormulaLike(q.headingByLocale, `Question ${q.id} heading`, warnings);
    checkMultilineMismatch(q.headingByLocale, `Question ${q.id} heading`, warnings);
    for (const a of q.answers) {
      checkFormulaLike(a.textByLocale, `Question ${q.id} answer ${a.id}`, warnings);
      checkMultilineMismatch(a.textByLocale, `Question ${q.id} answer ${a.id}`, warnings);
    }
  }

  return { errors, warnings };
}

function checkFormulaLike(textByLocale: Record<string, string>, label: string, warnings: Issue[]): void {
  for (const [locale, text] of Object.entries(textByLocale)) {
    if (FORMULA_LIKE_RE.test(text)) {
      warnings.push({
        severity: "warning",
        sheet: SHEET_NAME,
        message: `${label} (${locale}) starts with a formula-like character ("${text[0]}") — verify this is meant to be literal text and not a leftover Excel formula.`,
      });
    }
  }
}

/** Flags a translation that was pasted with multiple lines into one cell while its
 * English source is a single line — a real pattern found in production sample data,
 * usually indicating several answer options were merged into one cell by mistake. */
function checkMultilineMismatch(textByLocale: Record<string, string>, label: string, warnings: Issue[]): void {
  const englishText = textByLocale[ENGLISH_LOCALE.code] ?? "";
  if (englishText.includes("\n")) return;
  for (const [locale, text] of Object.entries(textByLocale)) {
    if (locale === ENGLISH_LOCALE.code) continue;
    if (text.includes("\n")) {
      warnings.push({
        severity: "warning",
        sheet: SHEET_NAME,
        message: `${label} (${locale}) contains multiple lines but the English source is a single line — this may indicate several translations were pasted into one cell by mistake.`,
      });
    }
  }
}
