import { targetKey, type TranslationTarget } from "@formbuilder/shared";
import type { ContributionSummary } from "../../api/formBuilderApi";

/** Newest pending (not yet approved/rejected) contribution's own value for this
 * exact target+locale, if any — contributions are already newest-first (see
 * formContributionService.listContributionsForForm's own ORDER BY), so the
 * first match wins when multiple subsidiary users have pending submissions
 * touching the same field. Read-only lookup — never mutates the draft; the
 * admin still has to click Approve for the text to actually land there.
 *
 * Consumed as a TextField `placeholder` (see pendingHelperText below) rather
 * than a separate banner — a placeholder only ever renders while the field's
 * real bound value is empty, so it can never visually cover up the draft's
 * own already-saved text; typing in the field, or Approve landing the real
 * text, both naturally replace it. */
export function pendingTranslationFor(
  contributions: ContributionSummary[],
  target: TranslationTarget,
  locale: string,
): string | undefined {
  const key = targetKey(target);
  for (const c of contributions) {
    if (c.status !== "pending") continue;
    const entry = c.content.translations.find((t) => targetKey(t.target) === key && t.locale === locale);
    if (entry && entry.value.trim() !== "") return entry.value;
  }
  return undefined;
}

/** Helper text to pair with a placeholder-shown pending value — replaces
 * whatever the field would otherwise show (a "not yet translated" warning or
 * a field-specific tip), since the placeholder text itself answers "why is
 * this blank." */
export const PENDING_TRANSLATION_HELPER_TEXT = "Pending from subsidiary, not yet approved — shown as a preview.";
