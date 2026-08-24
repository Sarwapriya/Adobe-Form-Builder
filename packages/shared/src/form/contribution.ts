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
  | { kind: "privacyPolicyLinkText" }
  | { kind: "termsAndConditionsText" }
  | { kind: "termsAndConditionsUrl" }
  | { kind: "consentText"; consentId: string }
  | { kind: "consentLink"; consentId: string }
  | { kind: "questionHeading"; questionId: string }
  | { kind: "questionSubheading"; questionId: string }
  | { kind: "answerText"; questionId: string; answerId: string }
  | { kind: "campaignHeading" }
  | { kind: "campaignSubheading" }
  | { kind: "campaignHeadingFullForm" }
  | { kind: "campaignSubheadingFullForm" }
  | { kind: "submitButtonLabel" };

export interface TranslationEntry {
  target: TranslationTarget;
  locale: LocaleCode;
  value: string;
}

/** Stable string key for a TranslationTarget — collision-free by construction
 * since it encodes every discriminant field. Used both by the subsidiary-side
 * working-edits map (formContributionStore.ts) and by the admin-side pending-
 * contribution hint lookup (pendingTranslationHint.tsx) to match a target
 * against a field regardless of which side produced it. */
export function targetKey(target: TranslationTarget): string {
  switch (target.kind) {
    case "profileLabel":
      return `profileLabel:${target.field}`;
    case "privacyPolicyText":
      return "privacyPolicyText";
    case "privacyPolicyLink":
      return "privacyPolicyLink";
    case "privacyPolicyLinkText":
      return "privacyPolicyLinkText";
    case "termsAndConditionsText":
      return "termsAndConditionsText";
    case "termsAndConditionsUrl":
      return "termsAndConditionsUrl";
    case "consentText":
      return `consentText:${target.consentId}`;
    case "consentLink":
      return `consentLink:${target.consentId}`;
    case "questionHeading":
      return `questionHeading:${target.questionId}`;
    case "questionSubheading":
      return `questionSubheading:${target.questionId}`;
    case "answerText":
      return `answerText:${target.questionId}:${target.answerId}`;
    case "campaignHeading":
      return "campaignHeading";
    case "campaignSubheading":
      return "campaignSubheading";
    case "campaignHeadingFullForm":
      return "campaignHeadingFullForm";
    case "campaignSubheadingFullForm":
      return "campaignSubheadingFullForm";
    case "submitButtonLabel":
      return "submitButtonLabel";
  }
}

export interface ContributionContent {
  translations: TranslationEntry[];
  /** Appended after the form's existing questions — ids/order are reassigned by
   * applyContribution regardless of what's submitted here, so collisions with
   * existing questions are structurally impossible. */
  newQuestions: QuestionDefinition[];
  /** Appended after the form's existing additionalConsents — same reassignment. */
  newConsents: ConsentDefinition[];
  /** Per-question opt-in/out for URL-param auto-populate (see QuestionDefinition's
   * autoPopulateEligible/autoPopulateEnabled) — only meaningful for questions the
   * admin has already marked autoPopulateEligible on the base form; a toggle
   * targeting any other question id is rejected by validateContribution. */
  autoPopulateToggles: { questionId: string; enabled: boolean }[];
  /** Ids of existing (base-form) questions this contribution proposes removing
   * entirely. Rejected by validateContribution if the id doesn't exist on the
   * base form or refers to a question the admin has marked lockedFromSubsidiary
   * (see QuestionDefinition.lockedFromSubsidiary). */
  deletedQuestionIds: string[];
  /** New answer options proposed for an EXISTING question — a question added via
   * newQuestions above already carries its own answers and doesn't use this. */
  newAnswers: { questionId: string; answer: AnswerDefinition }[];
  /** Existing answers on an EXISTING question this contribution proposes
   * removing. Applies regardless of the question's own lockedFromSubsidiary
   * state — the lock only blocks deleting the question itself. */
  deletedAnswerIds: { questionId: string; answerId: string }[];
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
    case "privacyPolicyLinkText": {
      if (!form.fields.privacyPolicy) return;
      form.fields.privacyPolicy.linkTextByLocale = { ...form.fields.privacyPolicy.linkTextByLocale, [locale]: value };
      return;
    }
    case "termsAndConditionsText": {
      if (!form.fields.termsAndConditions) return;
      form.fields.termsAndConditions.textByLocale = { ...form.fields.termsAndConditions.textByLocale, [locale]: value };
      return;
    }
    case "termsAndConditionsUrl": {
      if (!form.fields.termsAndConditions) return;
      form.fields.termsAndConditions.urlByLocale = { ...form.fields.termsAndConditions.urlByLocale, [locale]: value };
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
    case "campaignHeading": {
      form.fields.headingBeforeBreakByLocale = { ...form.fields.headingBeforeBreakByLocale, [locale]: value };
      return;
    }
    case "campaignSubheading": {
      form.fields.campaignSubheadingByLocale = { ...form.fields.campaignSubheadingByLocale, [locale]: value };
      return;
    }
    case "campaignHeadingFullForm": {
      form.fields.headingBeforeBreakFFByLocale = { ...form.fields.headingBeforeBreakFFByLocale, [locale]: value };
      return;
    }
    case "campaignSubheadingFullForm": {
      form.fields.campaignSubheadingFFByLocale = { ...form.fields.campaignSubheadingFFByLocale, [locale]: value };
      return;
    }
    case "submitButtonLabel": {
      form.fields.submitButton.labelByLocale = { ...form.fields.submitButton.labelByLocale, [locale]: value };
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
    case "privacyPolicyLinkText":
      return !!form.fields.privacyPolicy;
    case "termsAndConditionsText":
    case "termsAndConditionsUrl":
      return !!form.fields.termsAndConditions;
    case "consentText":
    case "consentLink":
      return !!form.fields.additionalConsents?.some((c) => c.id === target.consentId);
    case "questionHeading":
    case "questionSubheading":
      return form.questions.some((q) => q.id === target.questionId);
    case "answerText":
      return form.questions.some((q) => q.id === target.questionId && q.answers.some((a) => a.id === target.answerId));
    case "campaignHeading":
    case "campaignSubheading":
    case "campaignHeadingFullForm":
    case "campaignSubheadingFullForm":
    case "submitButtonLabel":
      // Plain optional Records directly on `fields` (or, for submitButtonLabel,
      // a non-optional nested object) — always a legitimate target on any
      // FormDefinition, unlike privacyPolicy/consents which have an optional
      // parent object that can be entirely absent.
      return true;
  }
}

function describeTarget(target: TranslationTarget): string {
  switch (target.kind) {
    case "profileLabel":
      return target.field;
    case "privacyPolicyText":
    case "privacyPolicyLink":
    case "privacyPolicyLinkText":
      return "Privacy Policy";
    case "termsAndConditionsText":
    case "termsAndConditionsUrl":
      return "Terms and Conditions";
    case "consentText":
    case "consentLink":
      return `consent "${target.consentId}"`;
    case "questionHeading":
    case "questionSubheading":
      return `question "${target.questionId}"`;
    case "answerText":
      return `answer "${target.answerId}" on question "${target.questionId}"`;
    case "campaignHeading":
      return "Campaign heading (One-Click)";
    case "campaignSubheading":
      return "Campaign subheading (One-Click)";
    case "campaignHeadingFullForm":
      return "Campaign heading (Full Form)";
    case "campaignSubheadingFullForm":
      return "Campaign subheading (Full Form)";
    case "submitButtonLabel":
      return "Submit button label";
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

  // Everything below that targets an existing question does so by its original
  // (pre-merge) id, before deletion/appending ever shifts renumberQuestions'
  // eventual output — see the reordering note on ContributionContent's own
  // deletedQuestionIds doc comment. renumberQuestions runs exactly once, at the
  // very end, once every question-level mutation (toggle/answer add/answer
  // delete/question delete/question append) has already happened.
  for (const toggle of content.autoPopulateToggles) {
    const question = next.questions.find((q) => q.id === toggle.questionId);
    if (!question || !question.autoPopulateEligible) continue;
    question.autoPopulateEnabled = toggle.enabled;
  }

  for (const entry of content.newAnswers) {
    const question = next.questions.find((q) => q.id === entry.questionId);
    if (!question) continue;
    question.answers = [...question.answers, entry.answer];
  }
  for (const entry of content.deletedAnswerIds) {
    const question = next.questions.find((q) => q.id === entry.questionId);
    if (!question) continue;
    question.answers = question.answers.filter((a) => a.id !== entry.answerId);
  }

  if (content.deletedQuestionIds.length > 0) {
    const deletable = new Set(content.deletedQuestionIds);
    // The lockedFromSubsidiary guard is defensive — validateContribution already
    // rejects a submission that tries this — mirroring the autoPopulateEligible
    // re-check just above.
    next.questions = next.questions.filter((q) => !deletable.has(q.id) || q.lockedFromSubsidiary);
  }

  next.questions = renumberQuestions([...next.questions, ...content.newQuestions]);

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

  for (const toggle of content.autoPopulateToggles) {
    const question = base.questions.find((q) => q.id === toggle.questionId);
    if (!question || !question.autoPopulateEligible) {
      errors.push(
        err(`Question "${toggle.questionId}" isn't eligible for URL-param auto-populate — it may have been changed since you started.`),
      );
    }
  }

  for (const id of content.deletedQuestionIds) {
    const question = base.questions.find((q) => q.id === id);
    if (!question) {
      errors.push(err(`Question "${id}" no longer exists on this form — it may have been removed since you started.`));
    } else if (question.lockedFromSubsidiary) {
      errors.push(err(`Question "${id}" is locked by the admin and can't be deleted.`));
    }
  }

  for (const entry of content.newAnswers) {
    const question = base.questions.find((q) => q.id === entry.questionId);
    if (!question) {
      errors.push(err(`Question "${entry.questionId}" no longer exists on this form — it may have been removed since you started.`));
      continue;
    }
    if (!resolveLocalizedText(entry.answer.textByLocale, base.meta.defaultLocale, base.meta.defaultLocale)) {
      warnings.push(warn(`A new option on question "${entry.questionId}" has no text for "${base.meta.defaultLocale}".`));
    }
  }

  for (const entry of content.deletedAnswerIds) {
    const question = base.questions.find((q) => q.id === entry.questionId);
    const answer = question?.answers.find((a) => a.id === entry.answerId);
    if (!question || !answer) {
      errors.push(
        err(`Answer "${entry.answerId}" on question "${entry.questionId}" no longer exists — it may have been removed since you started.`),
      );
    }
  }

  return { errors, warnings };
}
