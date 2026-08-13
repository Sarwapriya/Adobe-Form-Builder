/**
 * Subsidiary-user contributions to a published form: translations for text a
 * subsidiary user is allowed to touch (any locale on the form, including its
 * default — but never its *structure*, e.g. no renaming/removing a question, no
 * changing its control type — see TranslationTarget) plus entirely new
 * questions/consents they can append. Deliberately *not* a whole-FormDefinition
 * snapshot/diff — modeling exactly what's allowed as data (rather than diffing two
 * full snapshots and hoping nothing structural slipped through) makes an
 * out-of-scope change structurally impossible to submit, not just something
 * validateContribution happens to catch.
 *
 * `applyContribution`/`validateContribution` are pure and DOM-free like the rest of
 * this package, so both the backend (applying an approved contribution) and the
 * frontend (a live preview of the merge before submitting) can share one
 * implementation — same reasoning as validateFormDefinition/generateSolution.
 */
import type { Issue, ValidationResult } from "../excel/types";
import type { AnswerDefinition, ConsentDefinition, FormDefinition, LocaleCode, QuestionDefinition } from "./formDefinition";
import { resolveLocalizedText } from "./formDefinition";

export type TranslationTarget =
  | { kind: "profileLabel"; field: "firstName" | "lastName" | "email" | "mobileNumber" | "marketingOptin" }
  | { kind: "privacyPolicyText" }
  | { kind: "privacyPolicyLink" }
  | { kind: "consentText"; consentId: string }
  | { kind: "consentLink"; consentId: string }
  | { kind: "questionHeading"; questionId: string }
  | { kind: "questionSubheading"; questionId: string }
  | { kind: "answerText"; questionId: string; answerId: string };

export interface TranslationEntry {
  target: TranslationTarget;
  locale: LocaleCode;
  value: string;
}

export interface ContributionContent {
  translations: TranslationEntry[];
  /** Appended after the form's existing questions — ids/order are reassigned by
   * applyContribution regardless of what's submitted here, so collisions with
   * existing questions are structurally impossible. */
  newQuestions: QuestionDefinition[];
  /** Appended after the form's existing additionalConsents — same reassignment. */
  newConsents: ConsentDefinition[];
}

function renumberAnswers(answers: AnswerDefinition[]): AnswerDefinition[] {
  return answers.map((a, i) => ({ ...a, id: `A${i + 1}`, order: i + 1 }));
}

function renumberQuestions(questions: QuestionDefinition[]): QuestionDefinition[] {
  return questions.map((q, i) => ({ ...q, id: `Q${i + 1}`, order: i + 1, answers: renumberAnswers(q.answers) }));
}

function renumberConsents(consents: ConsentDefinition[]): ConsentDefinition[] {
  return consents.map((c, i) => ({ ...c, id: `consentExtra${i + 1}`, order: i + 1 }));
}

function applyTranslationEntry(form: FormDefinition, entry: TranslationEntry): void {
  const { target, locale, value } = entry;
  switch (target.kind) {
    case "profileLabel": {
      const field = form.fields[target.field];
      if (!field) return;
      field.labelByLocale = { ...field.labelByLocale, [locale]: value };
      return;
    }
    case "privacyPolicyText": {
      if (!form.fields.privacyPolicy) return;
      form.fields.privacyPolicy.textByLocale = { ...form.fields.privacyPolicy.textByLocale, [locale]: value };
      return;
    }
    case "privacyPolicyLink": {
      if (!form.fields.privacyPolicy) return;
      form.fields.privacyPolicy.linkUrlByLocale = { ...form.fields.privacyPolicy.linkUrlByLocale, [locale]: value };
      return;
    }
    case "consentText": {
      const consent = form.fields.additionalConsents?.find((c) => c.id === target.consentId);
      if (!consent) return;
      consent.textByLocale = { ...consent.textByLocale, [locale]: value };
      return;
    }
    case "consentLink": {
      const consent = form.fields.additionalConsents?.find((c) => c.id === target.consentId);
      if (!consent) return;
      consent.linkUrlByLocale = { ...(consent.linkUrlByLocale ?? {}), [locale]: value };
      return;
    }
    case "questionHeading": {
      const question = form.questions.find((q) => q.id === target.questionId);
      if (!question) return;
      question.headingByLocale = { ...question.headingByLocale, [locale]: value };
      return;
    }
    case "questionSubheading": {
      const question = form.questions.find((q) => q.id === target.questionId);
      if (!question) return;
      question.subheadingByLocale = { ...question.subheadingByLocale, [locale]: value };
      return;
    }
    case "answerText": {
      const question = form.questions.find((q) => q.id === target.questionId);
      const answer = question?.answers.find((a) => a.id === target.answerId);
      if (!answer) return;
      answer.textByLocale = { ...answer.textByLocale, [locale]: value };
      return;
    }
  }
}

function translationTargetExists(form: FormDefinition, target: TranslationTarget): boolean {
  switch (target.kind) {
    case "profileLabel":
      return !!form.fields[target.field];
    case "privacyPolicyText":
    case "privacyPolicyLink":
      return !!form.fields.privacyPolicy;
    case "consentText":
    case "consentLink":
      return !!form.fields.additionalConsents?.some((c) => c.id === target.consentId);
    case "questionHeading":
    case "questionSubheading":
      return form.questions.some((q) => q.id === target.questionId);
    case "answerText":
      return form.questions.some((q) => q.id === target.questionId && q.answers.some((a) => a.id === target.answerId));
  }
}

function describeTarget(target: TranslationTarget): string {
  switch (target.kind) {
    case "profileLabel":
      return target.field;
    case "privacyPolicyText":
    case "privacyPolicyLink":
      return "Privacy Policy";
    case "consentText":
    case "consentLink":
      return `consent "${target.consentId}"`;
    case "questionHeading":
    case "questionSubheading":
      return `question "${target.questionId}"`;
    case "answerText":
      return `answer "${target.answerId}" on question "${target.questionId}"`;
  }
}

/** Merges a contribution onto a baseline `FormDefinition`. Pure — returns a new
 * object, never mutates `base`. Translation targets that no longer exist on `base`
 * (e.g. the admin deleted that question since the contribution was submitted) are
 * silently skipped rather than throwing — `validateContribution` is what should catch
 * that before this ever runs, but a stale, no-longer-applicable entry shouldn't corrupt
 * an otherwise-valid merge. */
export function applyContribution(base: FormDefinition, content: ContributionContent): FormDefinition {
  const next: FormDefinition = JSON.parse(JSON.stringify(base));

  for (const entry of content.translations) {
    applyTranslationEntry(next, entry);
  }

  if (content.newQuestions.length > 0) {
    next.questions = renumberQuestions([...next.questions, ...content.newQuestions]);
  }
  if (content.newConsents.length > 0) {
    next.fields.additionalConsents = renumberConsents([...(next.fields.additionalConsents ?? []), ...content.newConsents]);
  }

  return next;
}

const LABEL = "Form Contribution";
function err(message: string): Issue {
  return { severity: "error", sheet: LABEL, message };
}
function warn(message: string): Issue {
  return { severity: "warning", sheet: LABEL, message };
}

/** Validates a contribution against the baseline it was proposed against — checked
 * both client-side (live feedback while composing) and server-side (the only copy
 * that actually gates whether an admin can approve it). Two kinds of problems:
 * out-of-bounds translations (wrong locale, or a target that no longer exists on the
 * form) are errors; incomplete-but-structurally-fine new content is a warning, same
 * split validateFormDefinition uses. */
export function validateContribution(base: FormDefinition, content: ContributionContent): ValidationResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  // Every locale on the form is translatable, including the default — a subsidiary
  // user is allowed to correct/update the default locale's own text too, same as
  // any other locale (no locale is specially off-limits).
  const translatableLocales = new Set(base.locales.map((l) => l.code));

  for (const entry of content.translations) {
    if (!translatableLocales.has(entry.locale)) {
      errors.push(err(`"${entry.locale}" isn't an existing locale on this form.`));
      continue;
    }
    if (!translationTargetExists(base, entry.target)) {
      errors.push(err(`${describeTarget(entry.target)} no longer exists on this form — it may have been removed since you started.`));
    }
  }

  for (const q of content.newQuestions) {
    const isChoiceType = q.controlType === "radio" || q.controlType === "checkbox" || q.controlType === "dropdown";
    const heading = resolveLocalizedText(q.headingByLocale, base.meta.defaultLocale, base.meta.defaultLocale);
    if (isChoiceType && q.answers.length === 0) {
      errors.push(err(`New question "${heading || q.id}" (${q.controlType}) has no options.`));
    }
    if (!heading) {
      warnings.push(warn(`A new question has no heading text for "${base.meta.defaultLocale}".`));
    }
  }

  for (const c of content.newConsents) {
    if (!resolveLocalizedText(c.textByLocale, base.meta.defaultLocale, base.meta.defaultLocale)) {
      warnings.push(warn(`A new consent has no text for "${base.meta.defaultLocale}".`));
    }
  }

  return { errors, warnings };
}
