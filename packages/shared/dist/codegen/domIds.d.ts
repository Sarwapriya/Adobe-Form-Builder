/**
 * Shared DOM-id conventions used by both the HTML generators and buildDataJs.ts, so the
 * `value`/`id` attributes emitted into markup always match the keys `data.js` uses for
 * lookups — a single source of truth instead of two places that must stay in sync by
 * discipline. Answer DOM keys are derived from `AnswerDefinition.order` (sequential,
 * contiguous 1..N), not the source Excel's own `A<n>` label, since the source numbering
 * can have legitimate gaps (e.g. an intentionally-dropped option) that would otherwise
 * leak into the generated form as a non-contiguous, confusing option count.
 */
export declare function answerDomKey(order: number): string;
export declare function questionInputId(questionId: string, answerOrder: number): string;
/** Id for an admin-added consent checkbox (see ConsentDefinition) beyond the two
 * fixed slots (privacyPolicy/subscribe) — the "consentExtra" prefix is also the
 * convention the reference FF.js's mapParam() greps for generically to build the
 * submission payload's `additionalConsents`, so this prefix must stay in sync
 * with that script if ever renamed. */
export declare function consentExtraId(order: number): string;
