import { useEffect } from "react";
import { MenuItem, Paper, TextField, Typography } from "@mui/material";
import { useFormBuilderStore } from "../../store/formBuilderStore";

/**
 * The builder's locale-editing switcher, shared by both admin's Form Initiator
 * (FormBuilderEditorPage) and the subsidiary ad-hoc builder (MyAdHocFormEditorPage)
 * — separate from LocaleManagerPanel/SubsidiaryLocalePicker (which only add/remove/
 * reorder which locales the form includes) so those panels can stay plain locale-list
 * management. Once a form has more than one locale (e.g. Arabic alongside English),
 * this lets whoever's editing pick which one every text field below (heading/
 * subheading, question text, profile field labels, consent text) currently reads/
 * writes — see QuestionEditorPanel/ProfileFieldEditorPanel/ConsentEditorPanel/
 * CampaignHeaderPanel, all of which key off the same store.activeLocale. Without this
 * switcher mounted, activeLocale never moves off defaultLocale and every field stays
 * pinned to the form's default locale regardless of how many locales it has — this is
 * the one piece of UI that actually lets a translation into a second locale happen at
 * all. Hidden entirely when the form only has one locale, since there's nothing to
 * switch between.
 */
export function LocaleEditingSwitcher() {
  const definition = useFormBuilderStore((s) => s.definition);
  const activeLocale = useFormBuilderStore((s) => s.activeLocale);
  const setActiveLocale = useFormBuilderStore((s) => s.setActiveLocale);

  // If the locale currently being edited gets removed via SubsidiaryLocalePicker's
  // enable/disable toggle, fall back to the form's default rather than leaving
  // activeLocale pointing at a code no longer in definition.locales (which would
  // otherwise both break every panel's [activeLocale] write key and make this
  // TextField's `value` not match any of its MenuItems).
  useEffect(() => {
    if (!definition) return;
    if (!definition.locales.some((l) => l.code === activeLocale)) {
      setActiveLocale(definition.meta.defaultLocale);
    }
  }, [definition, activeLocale, setActiveLocale]);

  if (!definition || definition.locales.length <= 1) return null;

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
        Translate
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
        Pick a locale below, then fill in every question, field, and consent for it — anything you leave blank here
        falls back to {definition.meta.defaultLocale} on the generated form.
      </Typography>
      <TextField
        select
        size="small"
        label="Editing"
        value={activeLocale}
        onChange={(e) => setActiveLocale(e.target.value)}
        sx={{ minWidth: 160 }}
      >
        {definition.locales.map((l) => (
          <MenuItem key={l.code} value={l.code}>
            {l.code}
            {l.code === definition.meta.defaultLocale ? " (fallback)" : ""}
          </MenuItem>
        ))}
      </TextField>
    </Paper>
  );
}
