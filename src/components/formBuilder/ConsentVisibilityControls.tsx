import { Box, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import type { FormVariant } from "@formbuilder/shared";

const VARIANT_LABEL: Record<FormVariant, string> = { ff: "Full Form", oc: "One-Click" };

/**
 * Shared "Required" + "Shown in" controls for all three consent-style fields
 * (Privacy Policy, Marketing Opt-in, and each admin-added consent) — same shape and
 * same defaults-when-absent semantics (see PrivacyPolicyMeta/ConsentToggleMeta/
 * ConsentDefinition in formDefinition.ts), so factored out once rather than
 * duplicated three times. A variant switch is disabled (not hidden) when the form
 * itself doesn't have that variant enabled — see VariantConfigPanel.
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
    </Stack>
  );
}
