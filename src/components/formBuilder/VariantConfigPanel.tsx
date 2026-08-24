import { Alert, Box, Paper, Stack, Switch, Typography } from "@mui/material";
import type { FormVariant } from "@formbuilder/shared";
import { useFormBuilderStore } from "../../store/formBuilderStore";

interface VariantCardProps {
  title: string;
  description: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  warning?: string;
}

function VariantCard({ title, description, checked, onToggle, warning }: VariantCardProps) {
  return (
    <Box
      sx={{
        flex: "1 1 240px",
        minWidth: 220,
        p: 1.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: checked ? "primary.main" : "rgba(20, 22, 33, 0.12)",
        bgcolor: checked ? "rgba(20, 40, 160, 0.04)" : "transparent",
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <Box>
          <Typography variant="body2" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        </Box>
        <Switch checked={checked} onChange={(e) => onToggle(e.target.checked)} />
      </Stack>
      {checked && warning && (
        <Alert severity="warning" sx={{ mt: 1, py: 0, borderRadius: 2 }}>
          {warning}
        </Alert>
      )}
    </Box>
  );
}

/**
 * Each output variant is its own card with its own enable switch and its own
 * explanation/warnings — configured separately rather than as two switches
 * bundled under the campaign-copy panel, since Full Form and One-Click are
 * materially different forms (different profile fields, see pageTemplate.ts's
 * `renderProfileFields` call) that just happen to share one question set.
 */
export function VariantConfigPanel() {
  const definition = useFormBuilderStore((s) => s.definition);
  const config = useFormBuilderStore((s) => s.config);
  const updateConfig = useFormBuilderStore((s) => s.updateConfig);

  if (!definition || !config) return null;
  const variants = config.variants ?? ["ff", "oc"];
  const mobileNumber = definition.fields.mobileNumber;
  const hasMobileNumber =
    !!mobileNumber &&
    (mobileNumber.countries.length > 0 || Object.values(mobileNumber.countriesByLocale ?? {}).some((c) => (c?.length ?? 0) > 0));
  const hasProfileFields = !!(definition.fields.firstName || definition.fields.lastName || definition.fields.email);

  function toggle(variant: FormVariant, checked: boolean) {
    if (checked) {
      if (!variants.includes(variant)) updateConfig({ variants: [...variants, variant] });
      return;
    }
    // At least one variant must always stay selected — unchecking the last one is a no-op.
    if (variants.length > 1) updateConfig({ variants: variants.filter((v) => v !== variant) });
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
        Form variants
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
        Each variant is generated and published independently. At least one must stay enabled.
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <VariantCard
          title="Full Form"
          description="Collects First Name, Last Name, Email, and Mobile Number, plus your questions below."
          checked={variants.includes("ff")}
          onToggle={(checked) => toggle("ff", checked)}
          warning={!hasProfileFields ? "No name/email fields are enabled — add them in Predefined fields below, or Full Form will look sparse." : undefined}
        />
        <VariantCard
          title="One-Click Form"
          description="Collects only a Mobile Number (no name/email), plus your questions below — for a faster, single-step signup."
          checked={variants.includes("oc")}
          onToggle={(checked) => toggle("oc", checked)}
          warning={!hasMobileNumber ? "Enable Mobile Number in Predefined fields (with at least one country) — otherwise One-Click has no input field to submit." : undefined}
        />
      </Stack>
    </Paper>
  );
}
