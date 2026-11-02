import { Paper, Stack, TextField, Typography } from "@mui/material";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { localeDir } from "../../utils/localeDir";
import type { PageCopy } from "@formbuilder/shared";

/** The "Thank You" message shown after a successful submission —
 * `FormDefinition.thankYou[locale]` (a `PageCopy`: heading/subHeading/
 * subHeadingUrlText/subHeadingUrl), rendered into data.js's `hrTy` object
 * (see build_data_js.py) and populated at runtime into the always-present,
 * initially-hidden `<div id="hrTy">` block every generated page has (see
 * pageTemplate.ts) — shown by the reference FF.js/OC.js once a submission
 * succeeds. Like `redirectAfterSuccessUrlByLocale` (see CampaignHeaderPanel's
 * own doc comment), this had no editor anywhere in the builder — a form's
 * `thankYou` starts as an empty object per locale and stayed that way unless
 * hand-edited directly into the generated data.js, which data.js's own
 * always-fresh regeneration then silently wiped on the next save or
 * publish. `pageError` (the equivalent failure-page copy) doesn't need the
 * same treatment — it's resolved automatically from an admin-managed,
 * locale-keyed default table instead (see
 * form_builder_service._resolve_page_error_updates), since error copy is
 * normally the same generic message across every campaign; a Thank You
 * message is usually campaign-specific, so it belongs here, per form. */
export function ThankYouPanel() {
  const definition = useFormBuilderStore((s) => s.definition);
  const updateDefinition = useFormBuilderStore((s) => s.updateDefinition);
  const storeActiveLocale = useFormBuilderStore((s) => s.activeLocale);

  if (!definition) return null;
  const defaultLocale = definition.meta.defaultLocale;
  const activeLocale = storeActiveLocale || defaultLocale;
  const dir = localeDir(activeLocale);
  const copy: PageCopy = definition.thankYou[activeLocale] ?? {};

  function updateThankYou(patch: Partial<PageCopy>) {
    updateDefinition((d) => ({
      ...d,
      thankYou: { ...d.thankYou, [activeLocale]: { ...d.thankYou[activeLocale], ...patch } },
    }));
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
        Thank You message
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
        Shown after a successful submission (unless a redirect URL above is set instead). All fields optional.
      </Typography>
      <Stack spacing={2}>
        <TextField
          label="Heading"
          size="small"
          fullWidth
          value={copy.heading ?? ""}
          inputProps={{ dir }}
          onChange={(e) => updateThankYou({ heading: e.target.value })}
        />
        <TextField
          label="Sub-heading"
          size="small"
          fullWidth
          multiline
          minRows={2}
          value={copy.subHeading ?? ""}
          inputProps={{ dir }}
          onChange={(e) => updateThankYou({ subHeading: e.target.value })}
        />
        <TextField
          label="Link text (optional)"
          size="small"
          fullWidth
          value={copy.subHeadingUrlText ?? ""}
          inputProps={{ dir }}
          helperText="e.g. &quot;Learn more&quot; — shown only when the link URL below is also set."
          onChange={(e) => updateThankYou({ subHeadingUrlText: e.target.value })}
        />
        <TextField
          label="Link URL (optional)"
          size="small"
          fullWidth
          value={copy.subHeadingUrl ?? ""}
          inputProps={{ dir: "ltr" }}
          onChange={(e) => updateThankYou({ subHeadingUrl: e.target.value })}
        />
      </Stack>
    </Paper>
  );
}
