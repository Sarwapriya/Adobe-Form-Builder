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
import type { ValidationResult } from "../excel/types";
import type { ConsentDefinition, FormDefinition, LocaleCode, QuestionDefinition } from "./formDefinition";
export type TranslationTarget = {
    kind: "profileLabel";
    field: "firstName" | "lastName" | "email" | "mobileNumber" | "marketingOptin";
} | {
    kind: "privacyPolicyText";
} | {
    kind: "privacyPolicyLink";
} | {
    kind: "termsAndConditionsText";
} | {
    kind: "termsAndConditionsUrl";
} | {
    kind: "consentText";
    consentId: string;
} | {
    kind: "consentLink";
    consentId: string;
} | {
    kind: "questionHeading";
    questionId: string;
} | {
    kind: "questionSubheading";
    questionId: string;
} | {
    kind: "answerText";
    questionId: string;
    answerId: string;
};
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
/** Merges a contribution onto a baseline `FormDefinition`. Pure — returns a new
 * object, never mutates `base`. Translation targets that no longer exist on `base`
 * (e.g. the admin deleted that question since the contribution was submitted) are
 * silently skipped rather than throwing — `validateContribution` is what should catch
 * that before this ever runs, but a stale, no-longer-applicable entry shouldn't corrupt
 * an otherwise-valid merge. */
export declare function applyContribution(base: FormDefinition, content: ContributionContent): FormDefinition;
/** Validates a contribution against the baseline it was proposed against — checked
 * both client-side (live feedback while composing) and server-side (the only copy
 * that actually gates whether an admin can approve it). Two kinds of problems:
 * out-of-bounds translations (wrong locale, or a target that no longer exists on the
 * form) are errors; incomplete-but-structurally-fine new content is a warning, same
 * split validateFormDefinition uses. */
export declare function validateContribution(base: FormDefinition, content: ContributionContent): ValidationResult;
