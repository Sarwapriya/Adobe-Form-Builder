import { useEffect, useMemo, useState } from "react";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { applyContribution, generateSolution, resolveFileNames, type BuilderConfig, type FormDefinition, type FormVariant } from "@formbuilder/shared";
import { buildPreviewDocument } from "../../codegen/previewDocument";
import type { ContributionSummary } from "../../api/formBuilderApi";
import { useThemeModeStore } from "../../store/themeModeStore";

/**
 * Admin-facing preview of a single subsidiary contribution merged onto the
 * form's current draft — reuses `applyContribution` (the same merge
 * `approveContribution` runs on the server) so what a reviewer sees here is
 * exactly what "Approve & Publish" would produce, and the same
 * `generateSolution`/`buildPreviewDocument` pair every other preview in this app
 * uses. Defaults the locale picker to whichever locale the contribution's own
 * translations target — a reviewer opening this for a submitted translation
 * shouldn't have to hunt through the locale dropdown to find the content they're
 * actually meant to be reviewing.
 */
export function ContributionMergePreviewDialog({
  open,
  onClose,
  contribution,
  baseDefinition,
  baseConfig,
}: {
  open: boolean;
  onClose: () => void;
  contribution: ContributionSummary | null;
  baseDefinition: FormDefinition | null;
  baseConfig: BuilderConfig | null;
}) {
  const [variant, setVariant] = useState<FormVariant>("ff");
  const [locale, setLocale] = useState<string>("");
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const previewColorScheme = useThemeModeStore((s) => s.mode);

  const availableVariants = baseConfig?.variants ?? ["ff"];

  const definition = useMemo(() => {
    if (!baseDefinition || !contribution) return null;
    return applyContribution(baseDefinition, contribution.content);
  }, [baseDefinition, contribution]);

  useEffect(() => {
    if (!open || !baseDefinition || !contribution) return;
    setLocale(contribution.content.translations[0]?.locale ?? baseDefinition.meta.defaultLocale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contribution?.id]);

  useEffect(() => {
    if (!open) return;
    if (!availableVariants.includes(variant)) setVariant(availableVariants[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, availableVariants.join(",")]);

  useEffect(() => {
    if (!open || !definition || !baseConfig || !locale) return;
    if (!availableVariants.includes(variant)) return;
    const previewConfig = { ...baseConfig, variants: [variant] };
    const files = generateSolution(definition, previewConfig);
    const fileNames = resolveFileNames(definition, previewConfig);
    const doc = buildPreviewDocument(files, variant, locale, fileNames, previewColorScheme);
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setIframeUrl(url);
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, definition, baseConfig, variant, locale, previewColorScheme]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: "90vh" } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ flexGrow: 1 }}>Preview with contribution applied</Box>
        {availableVariants.length > 1 && (
          <TextField select size="small" label="Variant" value={variant} onChange={(e) => setVariant(e.target.value as FormVariant)} sx={{ minWidth: 140 }}>
            <MenuItem value="ff">Full Form</MenuItem>
            <MenuItem value="oc">One-Click</MenuItem>
          </TextField>
        )}
        {(definition?.locales.length ?? 0) > 1 && (
          <TextField select size="small" label="Locale" value={locale} onChange={(e) => setLocale(e.target.value)} sx={{ minWidth: 140 }}>
            {definition!.locales.map((l) => (
              <MenuItem key={l.code} value={l.code}>
                {l.label}
              </MenuItem>
            ))}
          </TextField>
        )}
        <IconButton onClick={onClose} aria-label="Close preview">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, display: "flex" }}>
        <Stack sx={{ flexGrow: 1 }}>
          {iframeUrl && <iframe key={iframeUrl} src={iframeUrl} title="Contribution preview" style={{ border: "none", flexGrow: 1, width: "100%" }} />}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
