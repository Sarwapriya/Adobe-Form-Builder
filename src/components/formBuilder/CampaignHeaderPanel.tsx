import { Paper, Stack, TextField, Typography } from "@mui/material";
import { resolveLocalizedText } from "@formbuilder/shared";
import { useFormBuilderStore } from "../../store/formBuilderStore";

/** Campaign heading/subheading + submit button label — the page-level copy
 * rendered above the form's fields (see pageTemplate.ts's `<h2>`/`.top_subheading`
 * markup and renderProfileField.ts's submit button, both sourced from these
 * same FormDefinition.fields entries). */
export function CampaignHeaderPanel() {
  const definition = useFormBuilderStore((s) => s.definition);
  const updateDefinition = useFormBuilderStore((s) => s.updateDefinition);
  const name = useFormBuilderStore((s) => s.name);

  if (!definition) return null;
  const defaultLocale = definition.meta.defaultLocale;

  const heading = resolveLocalizedText(definition.fields.headingBeforeBreakByLocale, defaultLocale, defaultLocale);
  const subheading = resolveLocalizedText(definition.fields.campaignSubheadingByLocale, defaultLocale, defaultLocale);
  const submitLabel = resolveLocalizedText(definition.fields.submitButton.labelByLocale, defaultLocale, defaultLocale);

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        {name}
      </Typography>
      <Stack spacing={2}>
        <TextField
          label="Campaign heading"
          size="small"
          fullWidth
          value={heading}
          onChange={(e) =>
            updateDefinition((d) => ({
              ...d,
              fields: { ...d.fields, headingBeforeBreakByLocale: { ...d.fields.headingBeforeBreakByLocale, [defaultLocale]: e.target.value } },
            }))
          }
        />
        <TextField
          label="Campaign subheading"
          size="small"
          fullWidth
          value={subheading}
          onChange={(e) =>
            updateDefinition((d) => ({
              ...d,
              fields: { ...d.fields, campaignSubheadingByLocale: { ...d.fields.campaignSubheadingByLocale, [defaultLocale]: e.target.value } },
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
                submitButton: { ...d.fields.submitButton, labelByLocale: { ...d.fields.submitButton.labelByLocale, [defaultLocale]: e.target.value } },
              },
            }))
          }
        />
      </Stack>
    </Paper>
  );
}
