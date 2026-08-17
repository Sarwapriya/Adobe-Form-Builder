import type { Issue, ValidationResult } from "../excel/types";
import { findCallingCodeEntry } from "./callingCodes";
import type { FormDefinition, QuestionDefinition } from "./formDefinition";

const LABEL = "Form Builder";

/**
 * `FormDefinition`-native validator for builder-authored forms — the counterpart to
 * `excel/validator.ts`'s `validateWorkbook`, which is entirely `MapResult`/Excel-shaped
 * and can't be reused here. Shares the same `Issue`/`ValidationResult` shape so the
 * frontend's existing validation-panel rendering works unchanged for both pipelines.
 * Generation (`generateSolution`) should only run once `errors` is empty, same
 * convention as the Excel path.
 */
export function validateFormDefinition(form: FormDefinition): ValidationResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];

  if (form.questions.length === 0) {
    errors.push(err("Add at least one question before publishing."));
  }

  if (form.locales.length === 0) {
    errors.push(err("The form has no locales configured."));
  } else if (!form.locales.some((l) => l.code === form.meta.defaultLocale)) {
    errors.push(err(`Default locale "${form.meta.defaultLocale}" is not one of the form's configured locales.`));
  }
  checkDuplicates(
    form.locales.map((l) => l.code),
    (code) => `Locale "${code}" is configured more than once.`,
    errors,
  );

  if (!form.fields.submitButton?.labelByLocale?.[form.meta.defaultLocale]) {
    errors.push(err("The submit button has no label for the default locale."));
  }

  checkDuplicates(
    form.questions.map((q) => q.id),
    (id) => `Question id "${id}" is used more than once.`,
    errors,
  );
  checkSequential(
    form.questions.map((q) => q.order),
    "Question",
    errors,
  );

  for (const q of form.questions) {
    checkQuestion(q, errors, warnings);
  }

  if (form.fields.mobileNumber) {
    const countries = form.fields.mobileNumber.countries;
    if (countries.length === 0) {
      errors.push(err("The Mobile Number field has no countries configured."));
    }
    for (const code of countries) {
      if (!findCallingCodeEntry(code)) {
        errors.push(err(`The Mobile Number field references an unrecognized country code "${code}".`));
      }
    }
  }

  if (form.fields.privacyPolicy) {
    if (!form.fields.privacyPolicy.linkUrlByLocale?.[form.meta.defaultLocale]) {
      warnings.push(warn("The Privacy Policy field has no link URL for the default locale."));
    }
    if (!form.fields.privacyPolicy.textByLocale?.[form.meta.defaultLocale]) {
      warnings.push(warn("The Privacy Policy field has no consent text for the default locale."));
    }
    if (form.fields.privacyPolicy.visibleInVariants && form.fields.privacyPolicy.visibleInVariants.length === 0) {
      warnings.push(warn("The Privacy Policy field isn't shown in Full Form or One-Click — it won't appear anywhere until you enable at least one."));
    }
  }

  if (form.fields.termsAndConditions) {
    if (!form.fields.termsAndConditions.urlByLocale?.[form.meta.defaultLocale]) {
      warnings.push(warn("The Terms and Conditions field has no link URL for the default locale."));
    }
    if (!form.fields.termsAndConditions.textByLocale?.[form.meta.defaultLocale]) {
      warnings.push(warn("The Terms and Conditions field has no wording for the default locale."));
    }
  }

  if (form.fields.marketingOptin?.visibleInVariants && form.fields.marketingOptin.visibleInVariants.length === 0) {
    warnings.push(warn("The Marketing Opt-in field isn't shown in Full Form or One-Click — it won't appear anywhere until you enable at least one."));
  }

  if (form.fields.additionalConsents) {
    checkDuplicates(
      form.fields.additionalConsents.map((c) => c.id),
      (id) => `Consent id "${id}" is used more than once.`,
      errors,
    );
    checkSequential(
      form.fields.additionalConsents.map((c) => c.order),
      "Additional consents",
      errors,
    );
    for (const consent of form.fields.additionalConsents) {
      if (!consent.textByLocale?.[form.meta.defaultLocale]) {
        warnings.push(warn(`Consent "${consent.id}" has no text for the default locale.`));
      }
      if (consent.visibleInVariants && consent.visibleInVariants.length === 0) {
        warnings.push(warn(`Consent "${consent.id}" isn't shown in Full Form or One-Click — it won't appear anywhere until you enable at least one.`));
      }
    }
  }

  return { errors, warnings };
}

function checkQuestion(q: QuestionDefinition, errors: Issue[], warnings: Issue[]): void {
  checkDuplicates(
    q.answers.map((a) => a.id),
    (id) => `Question ${q.id}: answer id "${id}" is used more than once.`,
    errors,
  );
  checkSequential(
    q.answers.map((a) => a.order),
    `Question ${q.id}'s answers`,
    errors,
  );

  const isChoiceType = q.controlType === "radio" || q.controlType === "checkbox" || q.controlType === "dropdown";
  if (isChoiceType && q.answers.length === 0) {
    errors.push(err(`Question ${q.id} (${q.controlType}) has no options.`));
  }
  if (q.controlType === "radio" && q.answers.length === 1) {
    warnings.push(warn(`Question ${q.id} is a radio question with only one option.`));
  }
  if ((q.controlType === "text" || q.controlType === "shortText") && q.answers.length > 0) {
    warnings.push(warn(`Question ${q.id} is a free-text question but has options configured — they will be ignored.`));
  }
  if (!q.headingByLocale || Object.keys(q.headingByLocale).length === 0) {
    warnings.push(warn(`Question ${q.id} has no heading text.`));
  }
  if (q.visibleInVariants && q.visibleInVariants.length === 0) {
    warnings.push(warn(`Question ${q.id} isn't shown in Full Form or One-Click — it won't appear anywhere until you enable at least one.`));
  }
}

function checkDuplicates(values: string[], message: (value: string) => string, errors: Issue[]): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      errors.push(err(message(value)));
    }
    seen.add(value);
  }
}

/** Confirms `order` values are 1..N with no gaps or duplicates — DOM ids and `data.js`
 * lookup keys derive from `order` (see `domIds.ts`), so a gap silently desyncs them. */
function checkSequential(orders: number[], label: string, errors: Issue[]): void {
  if (orders.length === 0) return;
  const sorted = [...orders].sort((a, b) => a - b);
  const expected = sorted.map((_, i) => i + 1);
  const isSequential = sorted.every((value, i) => value === expected[i]);
  if (!isSequential) {
    errors.push(err(`${label} order values must be sequential starting at 1 (found: ${sorted.join(", ")}).`));
  }
}

function err(message: string): Issue {
  return { severity: "error", sheet: LABEL, message };
}

function warn(message: string): Issue {
  return { severity: "warning", sheet: LABEL, message };
}
