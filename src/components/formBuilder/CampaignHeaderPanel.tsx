import { Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { localeDir } from "../../utils/localeDir";
import { MISSING_TRANSLATION_HELPER_TEXT, missingTranslationSx } from "../common/missingTranslationSx";
import { PENDING_TRANSLATION_HELPER_TEXT, pendingTranslationFor } from "./pendingTranslationHint";

/** Campaign heading/subheading + submit button label — the page-level copy
 * rendered above the form's fields (see pageTemplate.ts's `<h2>`/`.top_subheading`
 * markup and renderProfileField.ts's submit button, both sourced from these
 * same FormDefinition.fields entries). Which output variant(s) get generated
 * is configured separately — see VariantConfigPanel.
 *
 * Heading and subheading are independently configurable per output variant:
 * the base fields below (headingBeforeBreakByLocale/campaignSubheadingByLocale)
 * are what One-Click shows and what Full Form falls back to; the "Full Form
 * override" fields (headingBeforeBreakFFByLocale/campaignSubheadingFFByLocale)
 * only take effect for the Full Form output, and only when non-blank — see
 * buildDataJs.ts's fallback logic and formDefinition.ts's own doc comments on
 * these fields for why the naming reads this way.
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
  const contributions = useFormBuilderStore((s) => s.contributions);

  if (!definition) return null;
  const defaultLocale = definition.meta.defaultLocale;
  const activeLocale = storeActiveLocale || defaultLocale;
  const localeText = (map: Record<string, string> | undefined) => map?.[activeLocale] ?? "";
  const missing = (value: string) => value.trim() === "";

  const heading = localeText(definition.fields.headingBeforeBreakByLocale);
  const subheading = localeText(definition.fields.campaignSubheadingByLocale);
  const headingFF = localeText(definition.fields.headingBeforeBreakFFByLocale);
  const subheadingFF = localeText(definition.fields.campaignSubheadingFFByLocale);
  const submitLabel = localeText(definition.fields.submitButton.labelByLocale);
  const pendingHeading = pendingTranslationFor(contributions, { kind: "campaignHeading" }, activeLocale);
  const pendingSubheading = pendingTranslationFor(contributions, { kind: "campaignSubheading" }, activeLocale);
  const pendingHeadingFF = pendingTranslationFor(contributions, { kind: "campaignHeadingFullForm" }, activeLocale);
  const pendingSubheadingFF = pendingTranslationFor(contributions, { kind: "campaignSubheadingFullForm" }, activeLocale);
  const pendingSubmitLabel = pendingTranslationFor(contributions, { kind: "submitButtonLabel" }, activeLocale);
  const dir = localeDir(activeLocale);

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
          label="Campaign heading (One-Click)"
          size="small"
          fullWidth
          value={heading}
          inputProps={{ dir }}
          placeholder={pendingHeading}
          sx={missingTranslationSx(missing(heading))}
          helperText={
            pendingHeading
              ? PENDING_TRANSLATION_HELPER_TEXT
              : missing(heading)
                ? MISSING_TRANSLATION_HELPER_TEXT
                : "Shown as the main title above the form. Also Full Form's text unless overridden below."
          }
          onChange={(e) =>
            updateDefinition((d) => ({
              ...d,
              fields: { ...d.fields, headingBeforeBreakByLocale: { ...d.fields.headingBeforeBreakByLocale, [activeLocale]: e.target.value } },
            }))
          }
        />
        <TextField
          label="Campaign subheading (One-Click)"
          size="small"
          fullWidth
          value={subheading}
          inputProps={{ dir }}
          placeholder={pendingSubheading}
          sx={missingTranslationSx(missing(subheading))}
          helperText={
            pendingSubheading
              ? PENDING_TRANSLATION_HELPER_TEXT
              : missing(subheading)
                ? MISSING_TRANSLATION_HELPER_TEXT
                : "Optional supporting line under the heading. Also Full Form's text unless overridden below."
          }
          onChange={(e) =>
            updateDefinition((d) => ({
              ...d,
              fields: { ...d.fields, campaignSubheadingByLocale: { ...d.fields.campaignSubheadingByLocale, [activeLocale]: e.target.value } },
            }))
          }
        />

        <Divider textAlign="left">
          <Typography variant="caption" color="text.secondary">
            Full Form override (optional)
          </Typography>
        </Divider>

        {/* Never missing-translation-highlighted, unlike every other field on this
            page — blank is these two fields' own normal, invited state ("leave
            blank to use..."), not a translation gap. */}
        <TextField
          label="Campaign heading (Full Form)"
          size="small"
          fullWidth
          value={headingFF}
          inputProps={{ dir }}
          placeholder={pendingHeadingFF}
          helperText={pendingHeadingFF ? PENDING_TRANSLATION_HELPER_TEXT : "Leave blank to use the One-Click heading above for Full Form too."}
          onChange={(e) =>
            updateDefinition((d) => ({
              ...d,
              fields: { ...d.fields, headingBeforeBreakFFByLocale: { ...d.fields.headingBeforeBreakFFByLocale, [activeLocale]: e.target.value } },
            }))
          }
        />
        <TextField
          label="Campaign subheading (Full Form)"
          size="small"
          fullWidth
          value={subheadingFF}
          inputProps={{ dir }}
          placeholder={pendingSubheadingFF}
          helperText={pendingSubheadingFF ? PENDING_TRANSLATION_HELPER_TEXT : "Leave blank to use the One-Click subheading above for Full Form too."}
          onChange={(e) =>
            updateDefinition((d) => ({
              ...d,
              fields: { ...d.fields, campaignSubheadingFFByLocale: { ...d.fields.campaignSubheadingFFByLocale, [activeLocale]: e.target.value } },
            }))
          }
        />

        <TextField
          label="Submit button label"
          size="small"
          fullWidth
          value={submitLabel}
          inputProps={{ dir }}
          placeholder={pendingSubmitLabel}
          sx={missingTranslationSx(missing(submitLabel))}
          helperText={pendingSubmitLabel ? PENDING_TRANSLATION_HELPER_TEXT : missing(submitLabel) ? MISSING_TRANSLATION_HELPER_TEXT : undefined}
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
