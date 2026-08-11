import { Autocomplete, Chip, Stack, TextField, Typography } from "@mui/material";
import { CALLING_CODES, resolveLocalizedText } from "@formbuilder/shared";
import { useFormBuilderStore } from "../../store/formBuilderStore";

const FIELD_LABEL: Record<string, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  email: "Email",
  mobileNumber: "Mobile Number",
};

/** Config drawer content for a predefined profile field. Mobile Number gets an
 * extra country picker (driving both the generated form's calling-code
 * dropdown and its runtime validation — see buildDataJs.ts's synthesized
 * "BUILDER" subsidiary table); the other three are label-only, since
 * renderProfileField.ts hardcodes their required-ness/validation pattern. */
export function ProfileFieldEditorPanel({ fieldKey }: { fieldKey: "firstName" | "lastName" | "email" | "mobileNumber" }) {
  const definition = useFormBuilderStore((s) => s.definition);
  const updateDefinition = useFormBuilderStore((s) => s.updateDefinition);
  const defaultLocale = definition?.meta.defaultLocale ?? "en_GB";
  const field = definition?.fields[fieldKey];

  if (!field) return null;

  const label = resolveLocalizedText(field.labelByLocale, defaultLocale, defaultLocale);

  function patchLabel(value: string) {
    updateDefinition((d) => ({
      ...d,
      fields: { ...d.fields, [fieldKey]: { ...d.fields[fieldKey], labelByLocale: { ...d.fields[fieldKey]?.labelByLocale, [defaultLocale]: value } } },
    }));
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" fontWeight={700}>
        {FIELD_LABEL[fieldKey]}
      </Typography>
      <TextField label="Label" size="small" fullWidth value={label} onChange={(e) => patchLabel(e.target.value)} />

      {fieldKey === "mobileNumber" && definition?.fields.mobileNumber && (
        <Autocomplete
          multiple
          size="small"
          options={CALLING_CODES.map((c) => c.countryCode)}
          getOptionLabel={(code) => CALLING_CODES.find((c) => c.countryCode === code)?.countryName ?? code}
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
              return <Chip key={key} label={code} size="small" {...rest} />;
            })
          }
          renderInput={(params) => <TextField {...params} label="Countries" placeholder="Add a country" />}
        />
      )}
    </Stack>
  );
}
