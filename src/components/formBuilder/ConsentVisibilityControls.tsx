import { Box, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import type { FormVariant } from "@formbuilder/shared";

const VARIANT_LABEL: Record<FormVariant, string> = { ff: "Full Form", oc: "One-Click" };

/**
 * Shared "Required" + "Shown in" controls for all three consent-style fields
 * (Privacy Policy, Marketing Opt-in, and each admin-added consent) — same shape and
 * same defaults-when-absent semantics (see PrivacyPolicyMeta/ConsentToggleMeta/
 * ConsentDefinition in formDefinition.ts), so factored out once rather than
 * duplicated three times. The "Shown in" variant picker itself only renders when the
 * form has more than one variant enabled — a form with just one (every ad-hoc form,
 * always Full Form only — see MyAdHocFormEditorPage/FormBuilderEditorPage, neither of
 * which ever renders VariantConfigPanel for an ad-hoc form) has nothing to pick
 * between, so showing a permanently-disabled "One-Click" switch would be pure clutter
 * rather than a real choice.
 */
export function ConsentVisibilityControls({
  required,
  visibleInVariants,
  formVariants,
  onRequiredChange,
  onVariantChange,
}: {
  required: boolean;
  visibleInVariants: FormVariant[];
  formVariants: FormVariant[];
  onRequiredChange: (required: boolean) => void;
  onVariantChange: (variant: FormVariant, checked: boolean) => void;
}) {
  return (
    <Stack spacing={1.5}>
      <FormControlLabel
        control={<Switch checked={required} onChange={(e) => onRequiredChange(e.target.checked)} />}
        label="Required (must be checked before Submit)"
      />
      {formVariants.length > 1 && (
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>
            Shown in
          </Typography>
          <Stack direction="row" spacing={1}>
            {(["ff", "oc"] as FormVariant[]).map((variant) => (
              <FormControlLabel
                key={variant}
                control={
                  <Switch
                    size="small"
                    disabled={!formVariants.includes(variant)}
                    checked={visibleInVariants.includes(variant)}
                    onChange={(e) => onVariantChange(variant, e.target.checked)}
                  />
                }
                label={VARIANT_LABEL[variant]}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
