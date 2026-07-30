/**
 * Shared DOM-id conventions used by both the HTML generators and buildDataJs.ts, so the
 * `value`/`id` attributes emitted into markup always match the keys `data.js` uses for
 * lookups — a single source of truth instead of two places that must stay in sync by
 * discipline. Answer DOM keys are derived from `AnswerDefinition.order` (sequential,
 * contiguous 1..N), not the source Excel's own `A<n>` label, since the source numbering
 * can have legitimate gaps (e.g. an intentionally-dropped option) that would otherwise
 * leak into the generated form as a non-contiguous, confusing option count.
 */

export function answerDomKey(order: number): string {
  return `A${order}`;
}

export function questionInputId(questionId: string, answerOrder: number): string {
  return `${questionId}${answerDomKey(answerOrder)}`;
}
