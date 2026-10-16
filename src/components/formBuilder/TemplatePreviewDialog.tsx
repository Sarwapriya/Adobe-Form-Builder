import { useEffect, useState } from "react";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { generateSolution, resolveFileNames, type BuilderConfig, type FormDefinition, type FormVariant } from "@formbuilder/shared";
import { buildPreviewDocument } from "../../codegen/previewDocument";
import { useThemeModeStore } from "../../store/themeModeStore";
import { useResponsiveDialogProps } from "../../hooks/useResponsiveDialog";

/**
 * Read-only preview of a *template's* content — same rendering pipeline as
 * FormBuilderPreviewDialog.tsx (generateSolution/buildPreviewDocument), but
 * fed by props instead of the live `useFormBuilderStore` draft, so browsing a
 * template never touches whatever the user currently has open in the
 * builder. Nothing here is editable.
 */
export function TemplatePreviewDialog({
  open,
  onClose,
  definition,
  config,
}: {
  open: boolean;
  onClose: () => void;
  definition: FormDefinition | null;
  config: BuilderConfig | null;
}) {
  const previewColorScheme = useThemeModeStore((s) => s.mode);
  const responsiveDialogProps = useResponsiveDialogProps();
  const [variant, setVariant] = useState<FormVariant>("ff");
  const [locale, setLocale] = useState<string>(definition?.meta.defaultLocale ?? "en_GB");
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const availableVariants = config?.variants ?? ["ff"];

  useEffect(() => {
    if (!open) return;
    if (!availableVariants.includes(variant)) setVariant(availableVariants[0]);
    setLocale(definition?.meta.defaultLocale ?? "en_GB");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, definition]);

  useEffect(() => {
    if (!open || !definition || !config) return;
    if (!availableVariants.includes(variant)) return;
    setGenError(null);
    try {
      const previewConfig = { ...config, variants: [variant] };
      const files = generateSolution(definition, previewConfig);
      const fileNames = resolveFileNames(definition, previewConfig);
      const doc = buildPreviewDocument(files, variant, locale, fileNames, previewColorScheme);
      const blob = new Blob([doc], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setIframeUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch (err) {
      setIframeUrl(null);
      setGenError(err instanceof Error ? err.message : "Failed to build the preview.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, definition, config, variant, locale, previewColorScheme]);

  return (
    <Dialog {...responsiveDialogProps} open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: "90vh" } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ flexGrow: 1 }}>Template preview</Box>
        {availableVariants.length > 1 && (
          <TextField select size="small" label="Variant" value={variant} onChange={(e) => setVariant(e.target.value as FormVariant)} sx={{ minWidth: 140 }}>
            <MenuItem value="ff">Full Form</MenuItem>
            <MenuItem value="oc">One-Click</MenuItem>
          </TextField>
        )}
        {(definition?.locales.length ?? 0) > 1 && (
          <TextField select size="small" label="Locale" value={locale} onChange={(e) => setLocale(e.target.value)} sx={{ minWidth: 180 }}>
            {definition!.locales.map((l) => (
              <MenuItem key={l.code} value={l.code}>
                {l.label} ({l.code})
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
          {genError && (
            <Box sx={{ p: 3 }}>
              <Box component="pre" sx={{ color: "error.main", whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                Couldn't build the preview: {genError}
              </Box>
            </Box>
          )}
          {!genError && iframeUrl && <iframe key={iframeUrl} src={iframeUrl} title="Template preview" style={{ border: "none", flexGrow: 1, width: "100%" }} />}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
