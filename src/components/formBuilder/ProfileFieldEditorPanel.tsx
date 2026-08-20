import { Alert, Autocomplete, Chip, Stack, TextField, Typography } from "@mui/material";
import type { FormVariant } from "@formbuilder/shared";
import { CALLING_CODES, resolveCountryName, subsidiaryCountryCodes } from "@formbuilder/shared";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { ConsentVisibilityControls } from "./ConsentVisibilityControls";
import { consentVariants } from "./formBuilderHelpers";
import { localeDir } from "../../utils/localeDir";

export type ProfileFieldKey =
  | "firstName"
  | "lastName"
  | "email"
  | "mobileNumber"
  | "privacyPolicy"
  | "marketingOptin"
  | "termsAndConditions"
  | "submitButton";

const FIELD_LABEL: Record<ProfileFieldKey, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  email: "Email",
  mobileNumber: "Mobile Number",
  privacyPolicy: "Privacy Policy Consent",
  marketingOptin: "Marketing Opt-in",
  termsAndConditions: "Terms and Conditions",
  submitButton: "Submit Button",
};

/** Config drawer content for a predefined profile field. Mobile Number gets an
 * extra country picker, restricted to the form's own subsidiary's real country
 * list (see subsidiaryCountryCodes) so a subsidiary/campaign only ever offers
 * the countries it actually serves, falling back to the generic CALLING_CODES
 * list for a subsidiary this repo has no reference country data for — driving
 * both the generated form's calling-code dropdown and its runtime validation
 * (see buildDataJs.ts's synthesized "BUILDER" subsidiary table); Privacy Policy
 * has its own shape (consent text + link text + link URL, not a plain label —
 * see PrivacyPolicyMeta in formDefinition.ts); Privacy Policy and Marketing
 * Opt-in both get the shared required/shown-in consent controls (see
 * ConsentVisibilityControls); the rest are label-only, since renderProfileField.ts
 * hardcodes their required-ness/validation pattern. */
export function ProfileFieldEditorPanel({ fieldKey }: { fieldKey: ProfileFieldKey }) {
  const definition = useFormBuilderStore((s) => s.definition);
  const updateDefinition = useFormBuilderStore((s) => s.updateDefinition);
  const formVariants = useFormBuilderStore((s): FormVariant[] => s.config?.variants ?? ["ff", "oc"]);
  const defaultLocale = definition?.meta.defaultLocale ?? "en_GB";
  const activeLocale = useFormBuilderStore((s) => s.activeLocale) || defaultLocale;
  const field = fieldKey === "submitButton" ? definition?.fields.submitButton : definition?.fields[fieldKey];

  if (!field) return null;

  // Reads only the currently active locale's own text — no fallback to another
  // locale. Falling back (e.g. to defaultLocale) here would make an untranslated
  // field look already-translated while editing a non-default locale, and any
  // edit made against that fallback-displayed text would then get saved under
  // the active locale's own key, appearing to "copy" the default locale's text
  // into the translation instead of leaving it genuinely blank until typed.
  // (The generated form's own runtime rendering still falls back to
  // defaultLocale when a locale has no translation — see buildDataJs.ts's own
  // resolveLocalizedText calls — this only affects what the builder itself
  // displays while editing.)
  const localeText = (map: Record<string, string> | undefined) => map?.[activeLocale] ?? "";
  const dir = localeDir(activeLocale);

  const localeHint = activeLocale !== defaultLocale && (
    <Typography variant="caption" color="text.secondary">
      Editing text for <strong>{activeLocale}</strong> — other settings below always apply to every locale.
    </Typography>
  );

  if (fieldKey === "submitButton") {
    const submitButton = definition!.fields.submitButton;
    const label = localeText(submitButton.labelByLocale);
    return (
      <Stack spacing={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          {FIELD_LABEL.submitButton}
        </Typography>
        {localeHint}
        <TextField
          label="Label"
          size="small"
          fullWidth
          value={label}
          inputProps={{ dir }}
          onChange={(e) =>
            updateDefinition((d) => ({
              ...d,
              fields: { ...d.fields, submitButton: { ...d.fields.submitButton, labelByLocale: { ...d.fields.submitButton.labelByLocale, [activeLocale]: e.target.value } } },
            }))
          }
        />
      </Stack>
    );
  }

  if (fieldKey === "privacyPolicy") {
    const privacyPolicy = definition!.fields.privacyPolicy!;
    const text = localeText(privacyPolicy.textByLocale);
    const linkUrl = localeText(privacyPolicy.linkUrlByLocale);
    const linkText = localeText(privacyPolicy.linkTextByLocale);

    function toggleVariant(variant: FormVariant, checked: boolean) {
      const current = consentVariants(definition!.fields.privacyPolicy!);
      const next = checked ? [...current, variant] : current.filter((v) => v !== variant);
      updateDefinition((d) => ({ ...d, fields: { ...d.fields, privacyPolicy: { ...d.fields.privacyPolicy!, visibleInVariants: next } } }));
    }

    return (
      <Stack spacing={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          {FIELD_LABEL.privacyPolicy}
        </Typography>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Shown as a checkbox in the "before submit" section. One-Click recipients normally already consented via the
          channel that delivered their link, so this defaults to Full Form only — enable One-Click below if this
          campaign needs it there too.
        </Alert>
        {localeHint}
        <TextField
          label="Consent text"
          size="small"
          fullWidth
          multiline
          minRows={2}
          value={text}
          inputProps={{ dir }}
          helperText={'Shown next to the checkbox, e.g. "I agree to the"'}
          onChange={(e) =>
            updateDefinition((d) => ({
              ...d,
              fields: {
                ...d.fields,
                privacyPolicy: { ...d.fields.privacyPolicy!, textByLocale: { ...d.fields.privacyPolicy!.textByLocale, [activeLocale]: e.target.value } },
              },
            }))
          }
        />
        <TextField
          label="Link text"
          size="small"
          fullWidth
          value={linkText}
          inputProps={{ dir }}
          helperText={'The link\'s own clickable text, e.g. "Samsung Privacy Policy" — separate from the consent text above.'}
          onChange={(e) =>
            updateDefinition((d) => ({
              ...d,
              fields: {
                ...d.fields,
                privacyPolicy: {
                  ...d.fields.privacyPolicy!,
                  linkTextByLocale: { ...d.fields.privacyPolicy!.linkTextByLocale, [activeLocale]: e.target.value },
                },
              },
            }))
          }
        />
        <TextField
          label="Link URL"
          size="small"
          fullWidth
          value={linkUrl}
          helperText="The Privacy Policy / Terms page this checkbox links to."
          onChange={(e) =>
            updateDefinition((d) => ({
              ...d,
              fields: {
                ...d.fields,
                privacyPolicy: {
                  ...d.fields.privacyPolicy!,
                  linkUrlByLocale: { ...d.fields.privacyPolicy!.linkUrlByLocale, [activeLocale]: e.target.value },
                },
              },
            }))
          }
        />
        <ConsentVisibilityControls
          required={privacyPolicy.required !== false}
          visibleInVariants={consentVariants(privacyPolicy)}
          formVariants={formVariants}
          onRequiredChange={(required) =>
            updateDefinition((d) => ({ ...d, fields: { ...d.fields, privacyPolicy: { ...d.fields.privacyPolicy!, required } } }))
          }
          onVariantChange={toggleVariant}
        />
      </Stack>
    );
  }

  if (fieldKey === "termsAndConditions") {
    const termsAndConditions = definition!.fields.termsAndConditions!;
    const text = localeText(termsAndConditions.textByLocale);
    const url = localeText(termsAndConditions.urlByLocale);

    return (
      <Stack spacing={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          {FIELD_LABEL.termsAndConditions}
        </Typography>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          An optional informational link shown next to the Submit button — not a checkbox, nothing to gate Submit
          on. You can publish without filling this in; a subsidiary user can also add their own locale's wording
          and link later, from the Translate & Extend page.
        </Alert>
        {localeHint}
        <TextField
          label="Wording"
          size="small"
          fullWidth
          multiline
          minRows={2}
          value={text}
          inputProps={{ dir }}
          helperText='e.g. "* Terms and conditions apply."'
          onChange={(e) =>
            updateDefinition((d) => ({
              ...d,
              fields: {
                ...d.fields,
                termsAndConditions: {
                  ...d.fields.termsAndConditions!,
                  textByLocale: { ...d.fields.termsAndConditions!.textByLocale, [activeLocale]: e.target.value },
                },
              },
            }))
          }
        />
        <TextField
          label="Link URL"
          size="small"
          fullWidth
          value={url}
          helperText="The Terms and Conditions page this link points to."
          onChange={(e) =>
            updateDefinition((d) => ({
              ...d,
              fields: {
                ...d.fields,
                termsAndConditions: {
                  ...d.fields.termsAndConditions!,
                  urlByLocale: { ...d.fields.termsAndConditions!.urlByLocale, [activeLocale]: e.target.value },
                },
              },
            }))
          }
        />
      </Stack>
    );
  }

  if (fieldKey === "marketingOptin") {
    const marketingOptin = definition!.fields.marketingOptin!;
    const label = localeText(marketingOptin.labelByLocale);

    function toggleVariant(variant: FormVariant, checked: boolean) {
      const current = consentVariants(definition!.fields.marketingOptin!);
      const next = checked ? [...current, variant] : current.filter((v) => v !== variant);
      updateDefinition((d) => ({ ...d, fields: { ...d.fields, marketingOptin: { ...d.fields.marketingOptin!, visibleInVariants: next } } }));
    }

    return (
      <Stack spacing={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          {FIELD_LABEL.marketingOptin}
        </Typography>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Shown as a checkbox in the "before submit" section.
        </Alert>
        {localeHint}
        <TextField
          label="Label"
          size="small"
          fullWidth
          value={label}
          inputProps={{ dir }}
          onChange={(e) =>
            updateDefinition((d) => ({
              ...d,
              fields: { ...d.fields, marketingOptin: { ...d.fields.marketingOptin!, labelByLocale: { ...d.fields.marketingOptin!.labelByLocale, [activeLocale]: e.target.value } } },
            }))
          }
        />
        <ConsentVisibilityControls
          required={!!marketingOptin.required}
          visibleInVariants={consentVariants(marketingOptin)}
          formVariants={formVariants}
          onRequiredChange={(required) =>
            updateDefinition((d) => ({ ...d, fields: { ...d.fields, marketingOptin: { ...d.fields.marketingOptin!, required } } }))
          }
          onVariantChange={toggleVariant}
        />
      </Stack>
    );
  }

  // fieldKey is firstName/lastName/email/mobileNumber past this point, so `field`
  // can only be a LocalizedFieldMeta/MobileNumberFieldMeta — both have
  // labelByLocale. TS can't correlate that with the earlier `fieldKey` checks on
  // their own (different variable), hence the assertion.
  const label = localeText((field as { labelByLocale: Record<string, string> }).labelByLocale);

  function patchLabel(value: string) {
    updateDefinition((d) => {
      const current = d.fields[fieldKey] as { labelByLocale?: Record<string, string> } | undefined;
      return {
        ...d,
        fields: { ...d.fields, [fieldKey]: { ...current, labelByLocale: { ...current?.labelByLocale, [activeLocale]: value } } },
      };
    });
  }

  const subsidiaryCodes = definition ? subsidiaryCountryCodes(definition.meta.subsidiary) : [];
  const countryOptions = subsidiaryCodes.length > 0 ? subsidiaryCodes : CALLING_CODES.map((c) => c.countryCode);

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" fontWeight={700}>
        {FIELD_LABEL[fieldKey]}
      </Typography>
      {localeHint}
      <TextField label="Label" size="small" fullWidth value={label} inputProps={{ dir }} onChange={(e) => patchLabel(e.target.value)} />

      {fieldKey === "mobileNumber" && definition?.fields.mobileNumber && (
        <Autocomplete
          multiple
          size="small"
          options={countryOptions}
          getOptionLabel={(code) => resolveCountryName(code, activeLocale, defaultLocale)}
          value={definition.fields.mobileNumber.countries}
          onChange={(_e, next) =>
            updateDefinition((d) => ({
              ...d,
              fields: { ...d.fields, mobileNumber: { ...d.fields.mobileNumber!, countries: next } },
            }))
          }
          renderTags={(value, getTagProps) =>
            value.map((code, index) => {
              const { key, ...rest } = getTagProps({ index });
              return <Chip key={key} label={resolveCountryName(code, activeLocale, defaultLocale)} size="small" {...rest} />;
            })
          }
          renderInput={(params) => <TextField {...params} label="Countries" placeholder="Add a country" helperText={`Restricted to ${definition.meta.subsidiary}'s own countries when available.`} />}
        />
      )}
    </Stack>
  );
}
