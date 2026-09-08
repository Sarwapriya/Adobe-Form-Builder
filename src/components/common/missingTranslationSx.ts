import type { SxProps, Theme } from "@mui/material/styles";

/** Helper text shown under a text field currently missing its own translation for
 * the active/selected locale — paired with `missingTranslationSx` below. */
export const MISSING_TRANSLATION_HELPER_TEXT = "Not yet translated for this locale.";

/**
 * A static amber outline for a text field that has no text of its own for the
 * currently active/selected locale — used both by the Form Builder's own editors
 * (admin and the subsidiary-user Ad-hoc builder alike, since they share the same
 * components) and by the Translate & Extend contribution flow's TranslatableField,
 * so "this still needs translating" reads the same way everywhere a locale-bound
 * text field can be edited. Deliberately not a blinking animation like
 * unsavedChangesBlinkSx — this flags a content gap to fill in eventually, not an
 * unsaved edit that needs acting on right now. Never applied to a link/URL field —
 * callers should never pass `active: true` for one, since a URL is routinely
 * identical across locales rather than something that needs translating.
 */
export function missingTranslationSx(active: boolean): SxProps<Theme> {
  return active ? { "& .MuiOutlinedInput-root": { "& > fieldset": { borderColor: "warning.main", borderWidth: 2 } } } : {};
}
