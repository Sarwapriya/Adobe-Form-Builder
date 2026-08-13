import { TextField } from "@mui/material";
import type { TranslationTarget } from "@formbuilder/shared";
import { resolveTranslationValue, useFormContributionStore } from "../../store/formContributionStore";

/** One text field bound to a single TranslationTarget in the currently-selected
 * locale — pre-filled with whatever text already exists on the base (published)
 * form for that locale, so retranslating after a prior approved contribution shows
 * the current state, not a blank field. */
export function TranslatableField({
  label,
  target,
  existingValue,
  multiline,
}: {
  label: string;
  target: TranslationTarget;
  existingValue: string;
  multiline?: boolean;
}) {
  const locale = useFormContributionStore((s) => s.locale);
  const translations = useFormContributionStore((s) => s.translations);
  const setTranslation = useFormContributionStore((s) => s.setTranslation);

  const value = resolveTranslationValue(translations, target, locale, existingValue);

  return (
    <TextField
      label={label}
      size="small"
      fullWidth
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      value={value}
      onChange={(e) => setTranslation(target, e.target.value)}
    />
  );
}
