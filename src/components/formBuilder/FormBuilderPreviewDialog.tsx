import { useEffect, useState } from "react";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { generateSolution, resolveFileNames, type FormVariant } from "@formbuilder/shared";
import { buildPreviewDocument } from "../../codegen/previewDocument";
import { useFormBuilderStore } from "../../store/formBuilderStore";

/**
 * Client-side preview, entirely in-memory against the current draft — reuses
 * the exact `generateSolution`/`buildPreviewDocument` pair the /local wizard's
 * PreviewStep uses, so there is exactly one rendering implementation for what
 * an admin sees vs. what actually gets published. No backend round-trip;
 * only Publish needs the server.
 */
export function FormBuilderPreviewDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const definition = useFormBuilderStore((s) => s.definition);
  const config = useFormBuilderStore((s) => s.config);
  const [variant, setVariant] = useState<FormVariant>("ff");
  const [locale, setLocale] = useState<string>(definition?.meta.defaultLocale ?? "en_GB");
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const availableVariants = config?.variants ?? ["ff"];

  // The dialog's own `variant` state can go stale relative to the form's actual
  // configured variants (e.g. it defaults to "ff", but the admin may have only
  // enabled One-Click) — resync to whatever's actually available whenever the
  // dialog opens or the enabled variants change, so the preview never silently
  // renders a variant the admin didn't ask for.
  useEffect(() => {
    if (!open) return;
    if (!availableVariants.includes(variant)) setVariant(availableVariants[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, availableVariants.join(",")]);

  // The dialog's own `locale` state can likewise go stale relative to the form's
  // actual locale list — e.g. the admin removes the locale currently selected for
  // preview (including the default). Resync to the form's default locale whenever
  // the currently-selected one is no longer on the form, so the preview never asks
  // the generated behavior JS for a locale that doesn't exist in data.js (which
  // throws and breaks the whole iframe rather than just rendering blank).
  const localeCodes = definition?.locales.map((l) => l.code).join(",") ?? "";
  useEffect(() => {
    if (!open || !definition) return;
    if (!definition.locales.some((l) => l.code === locale)) setLocale(definition.meta.defaultLocale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, localeCodes, definition?.meta.defaultLocale]);

  useEffect(() => {
    if (!open || !definition || !config) return;
    if (!availableVariants.includes(variant)) return;
    setGenError(null);
    try {
      const previewConfig = { ...config, variants: [variant] };
      const files = generateSolution(definition, previewConfig);
      const fileNames = resolveFileNames(definition, previewConfig);
      const doc = buildPreviewDocument(files, variant, locale, fileNames);
      const blob = new Blob([doc], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setIframeUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch (err) {
      setIframeUrl(null);
      setGenError(err instanceof Error ? err.message : "Failed to build the preview.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, definition, config, variant, locale]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: "90vh" } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ flexGrow: 1 }}>Preview</Box>
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
          {genError && (
            <Box sx={{ p: 3 }}>
              <Box component="pre" sx={{ color: "error.main", whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                Couldn't build the preview: {genError}
              </Box>
            </Box>
          )}
          {!genError && iframeUrl && <iframe key={iframeUrl} src={iframeUrl} title="Form preview" style={{ border: "none", flexGrow: 1, width: "100%" }} />}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
