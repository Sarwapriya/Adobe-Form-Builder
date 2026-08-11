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

  useEffect(() => {
    if (!open || !definition || !config) return;
    const previewConfig = { ...config, variants: [variant] };
    const files = generateSolution(definition, previewConfig);
    const fileNames = resolveFileNames(definition, previewConfig);
    const doc = buildPreviewDocument(files, variant, locale, fileNames);
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setIframeUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [open, definition, config, variant, locale]);

  const availableVariants = config?.variants ?? ["ff"];

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
          {iframeUrl && <iframe key={iframeUrl} src={iframeUrl} title="Form preview" style={{ border: "none", flexGrow: 1, width: "100%" }} />}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
