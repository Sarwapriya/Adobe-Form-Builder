import { Paper, Stack, TextField, Typography } from "@mui/material";
import { useFormBuilderStore } from "../../store/formBuilderStore";

/** Campaign heading/subheading + submit button label — the page-level copy
 * rendered above the form's fields (see pageTemplate.ts's `<h2>`/`.top_subheading`
 * markup and renderProfileField.ts's submit button, both sourced from these
 * same FormDefinition.fields entries). Which output variant(s) get generated
 * is configured separately — see VariantConfigPanel.
 *
 * Text reads/writes whichever locale is currently active (see
 * MyAdHocFormEditorPage's locale-editing tabs) — for admin's own flow
 * activeLocale never moves off defaultLocale, so this is a no-op behavior
 * change there; it's what makes campaign heading/subheading translatable for
 * the ad-hoc builder, which has no separate CampaignHeaderPanel of its own.
 * No fallback to another locale for display — see ProfileFieldEditorPanel's
 * own localeText for why (an untranslated field must show blank, not another
 * locale's text, or editing it looks like it copies that locale's text over). */
export function CampaignHeaderPanel() {
  const definition = useFormBuilderStore((s) => s.definition);
  const updateDefinition = useFormBuilderStore((s) => s.updateDefinition);
  const name = useFormBuilderStore((s) => s.name);
  const storeActiveLocale = useFormBuilderStore((s) => s.activeLocale);

  if (!definition) return null;
  const defaultLocale = definition.meta.defaultLocale;
  const activeLocale = storeActiveLocale || defaultLocale;
  const localeText = (map: Record<string, string> | undefined) => map?.[activeLocale] ?? "";

  const heading = localeText(definition.fields.headingBeforeBreakByLocale);
  const subheading = localeText(definition.fields.campaignSubheadingByLocale);
  const submitLabel = localeText(definition.fields.submitButton.labelByLocale);

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        {name}
      </Typography>
      {activeLocale !== defaultLocale && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
          Editing text for <strong>{activeLocale}</strong>.
        </Typography>
      )}
      <Stack spacing={2}>
        <TextField
          label="Campaign heading"
          size="small"
          fullWidth
          value={heading}
          helperText="Shown as the main title above the form."
          onChange={(e) =>
            updateDefinition((d) => ({
              ...d,
              fields: { ...d.fields, headingBeforeBreakByLocale: { ...d.fields.headingBeforeBreakByLocale, [activeLocale]: e.target.value } },
            }))
          }
        />
        <TextField
          label="Campaign subheading"
          size="small"
          fullWidth
          value={subheading}
          helperText="Optional supporting line under the heading."
          onChange={(e) =>
            updateDefinition((d) => ({
              ...d,
              fields: { ...d.fields, campaignSubheadingByLocale: { ...d.fields.campaignSubheadingByLocale, [activeLocale]: e.target.value } },
            }))
          }
        />
        <TextField
          label="Submit button label"
          size="small"
          fullWidth
          value={submitLabel}
          onChange={(e) =>
            updateDefinition((d) => ({
              ...d,
              fields: {
                ...d.fields,
                submitButton: { ...d.fields.submitButton, labelByLocale: { ...d.fields.submitButton.labelByLocale, [activeLocale]: e.target.value } },
              },
            }))
          }
        />
      </Stack>
    </Paper>
  );
}
