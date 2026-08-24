import { TextField } from "@mui/material";
import type { TranslationTarget } from "@formbuilder/shared";
import { resolveTranslationValue, targetKey, useFormContributionStore } from "../../store/formContributionStore";
import { localeDir } from "../../utils/localeDir";
import { MISSING_TRANSLATION_HELPER_TEXT, missingTranslationSx } from "../common/missingTranslationSx";

/** One text field bound to a single TranslationTarget in the currently-selected
 * locale — pre-filled with whatever text already exists on the base (published)
 * form for that locale, so retranslating after a prior approved contribution shows
 * the current state, not a blank field.
 *
 * Highlights itself (amber outline + helper text) whenever the currently-selected
 * locale has no text of its own for this field — checked directly against `byLocale`
 * (never against the default locale's own content, so a field left blank in every
 * locale still gets flagged the same as one translated everywhere except here).
 * The displayed `value` above still falls back to the default locale's text so
 * there's something to work from, but that fallback text alone never counts as
 * "translated." Cleared the moment the user types (or clears back to blank) this
 * session — the live edit always wins over the last-saved value. Never highlighted
 * for a link/URL field (`isUrl`) — a URL is routinely identical across locales, not
 * a translation gap. */
export function TranslatableField({
  label,
  target,
  existingValue,
  byLocale,
  multiline,
  isUrl,
}: {
  label: string;
  target: TranslationTarget;
  existingValue: string;
  /** The field's raw per-locale map, undistorted by resolveLocalizedText's own
   * fallback-to-default behavior — needed to tell "this locale has its own text"
   * apart from "this locale is silently showing the default's text." Omit for a
   * link/URL field, where the distinction doesn't matter (isUrl already skips it). */
  byLocale?: Record<string, string>;
  multiline?: boolean;
  /** Link URL fields stay LTR regardless of the locale being translated into, and
   * are never highlighted as missing a translation. */
  isUrl?: boolean;
}) {
  const locale = useFormContributionStore((s) => s.locale);
  const translations = useFormContributionStore((s) => s.translations);
  const setTranslation = useFormContributionStore((s) => s.setTranslation);

  const value = resolveTranslationValue(translations, target, locale, existingValue);

  // The session's own live edit (if any) is this locale's real current value —
  // takes priority over the last-saved byLocale entry, which onChange hasn't
  // touched yet.
  const sessionEntry = translations.get(`${targetKey(target)}::${locale}`);
  const ownValue = sessionEntry ? sessionEntry.value : byLocale?.[locale];
  const missingTranslation = !isUrl && !ownValue?.trim();

  return (
    <TextField
      label={label}
      size="small"
      fullWidth
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      value={value}
      inputProps={{ dir: isUrl ? "ltr" : localeDir(locale) }}
      onChange={(e) => setTranslation(target, e.target.value)}
      helperText={missingTranslation ? MISSING_TRANSLATION_HELPER_TEXT : undefined}
      sx={missingTranslationSx(missingTranslation)}
    />
  );
}
