import { Alert, Button, FormControlLabel, Stack, Switch, TextField, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import type { FormVariant } from "@formbuilder/shared";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { ConsentVisibilityControls } from "./ConsentVisibilityControls";
import { consentVariants, renumberConsents } from "./formBuilderHelpers";
import { localeDir } from "../../utils/localeDir";
import { MISSING_TRANSLATION_HELPER_TEXT, missingTranslationSx } from "../common/missingTranslationSx";
import { PENDING_TRANSLATION_HELPER_TEXT, pendingTranslationFor } from "./pendingTranslationHint";

/** Config drawer content for one admin-added consent checkbox beyond the fixed
 * Privacy Policy / Marketing Opt-in slots — same text+optional-link shape as
 * Privacy Policy, plus the same shared required/shown-in controls (see
 * ConsentVisibilityControls) every consent-style field gets. */
export function ConsentEditorPanel({ consentId, onDeleted }: { consentId: string; onDeleted: () => void }) {
  const definition = useFormBuilderStore((s) => s.definition);
  const updateDefinition = useFormBuilderStore((s) => s.updateDefinition);
  const formVariants = useFormBuilderStore((s): FormVariant[] => s.config?.variants ?? ["ff", "oc"]);
  const defaultLocale = definition?.meta.defaultLocale ?? "en_GB";
  const activeLocale = useFormBuilderStore((s) => s.activeLocale) || defaultLocale;
  const contributions = useFormBuilderStore((s) => s.contributions);
  const localeText = (map: Record<string, string> | undefined) => map?.[activeLocale] ?? "";
  const consent = definition?.fields.additionalConsents?.find((c) => c.id === consentId);
  const dir = localeDir(activeLocale);

  if (!consent) return null;

  const text = localeText(consent.textByLocale);
  const linkUrl = localeText(consent.linkUrlByLocale);
  const missing = (value: string) => value.trim() === "";
  const pendingText = pendingTranslationFor(contributions, { kind: "consentText", consentId: consent.id }, activeLocale);
  const pendingLinkUrl = pendingTranslationFor(contributions, { kind: "consentLink", consentId: consent.id }, activeLocale);

  function patchConsent(patch: Partial<typeof consent>) {
    updateDefinition((d) => ({
      ...d,
      fields: {
        ...d.fields,
        additionalConsents: (d.fields.additionalConsents ?? []).map((c) => (c.id === consentId ? { ...c, ...patch } : c)),
      },
    }));
  }

  function toggleVariant(variant: FormVariant, checked: boolean) {
    const current = consentVariants(consent!);
    const next = checked ? [...current, variant] : current.filter((v) => v !== variant);
    patchConsent({ visibleInVariants: next });
  }

  function handleDelete() {
    if (!window.confirm("Remove this consent?")) return;
    updateDefinition((d) => ({
      ...d,
      fields: { ...d.fields, additionalConsents: renumberConsents((d.fields.additionalConsents ?? []).filter((c) => c.id !== consentId)) },
    }));
    onDeleted();
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" fontWeight={700}>
        Consent ({consent.id})
      </Typography>
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        Shown as a checkbox in the "before submit" section. Its checked state is included in the submission payload
        under <code>additionalConsents.{consent.id}</code>.
      </Alert>
      {activeLocale !== defaultLocale && (
        <Typography variant="caption" color="text.secondary">
          Editing text for <strong>{activeLocale}</strong> — other settings below always apply to every locale.
        </Typography>
      )}
      <TextField
        label="Consent text"
        size="small"
        fullWidth
        multiline
        minRows={2}
        value={text}
        inputProps={{ dir }}
        placeholder={pendingText}
        sx={missingTranslationSx(missing(text))}
        helperText={pendingText ? PENDING_TRANSLATION_HELPER_TEXT : missing(text) ? MISSING_TRANSLATION_HELPER_TEXT : undefined}
        onChange={(e) => patchConsent({ textByLocale: { ...consent.textByLocale, [activeLocale]: e.target.value } })}
      />
      <FormControlLabel
        control={
          <Switch
            checked={!!consent.linkUrlByLocale}
            onChange={(e) => patchConsent({ linkUrlByLocale: e.target.checked ? {} : undefined })}
          />
        }
        label="Include a link"
      />
      {consent.linkUrlByLocale && (
        <TextField
          label="Link URL"
          size="small"
          fullWidth
          value={linkUrl}
          placeholder={pendingLinkUrl}
          helperText={pendingLinkUrl ? PENDING_TRANSLATION_HELPER_TEXT : undefined}
          onChange={(e) => patchConsent({ linkUrlByLocale: { ...consent.linkUrlByLocale, [activeLocale]: e.target.value } })}
        />
      )}
      <ConsentVisibilityControls
        required={!!consent.required}
        visibleInVariants={consentVariants(consent)}
        formVariants={formVariants}
        onRequiredChange={(required) => patchConsent({ required })}
        onVariantChange={toggleVariant}
      />
      <Button color="error" startIcon={<DeleteIcon />} onClick={handleDelete} sx={{ alignSelf: "flex-start" }}>
        Remove consent
      </Button>
    </Stack>
  );
}
