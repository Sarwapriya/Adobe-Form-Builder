import { useEffect, useMemo, useState } from "react";
import { Box, Dialog, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { applyContribution, generateSolution, resolveFileNames, type ContributionContent, type FormVariant } from "@formbuilder/shared";
import { buildPreviewDocument } from "../../codegen/previewDocument";
import { useFormContributionStore } from "../../store/formContributionStore";

/**
 * Client-side preview of the published form with this session's in-progress
 * contribution (translations + new questions/consents, not yet submitted) merged
 * on top — lets a subsidiary user see exactly what they're proposing before
 * submitting. Reuses `applyContribution` (the exact merge `approveContribution`
 * runs server-side) and the same `generateSolution`/`buildPreviewDocument` pair
 * FormBuilderPreviewDialog uses, so there's still exactly one rendering
 * implementation — this just feeds it a merged-but-unsaved definition instead of
 * a saved draft.
 */
export function ContributionPreviewDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const baseDefinition = useFormContributionStore((s) => s.baseDefinition);
  const baseConfig = useFormContributionStore((s) => s.baseConfig);
  const translations = useFormContributionStore((s) => s.translations);
  const newQuestions = useFormContributionStore((s) => s.newQuestions);
  const newConsents = useFormContributionStore((s) => s.newConsents);
  const workingLocale = useFormContributionStore((s) => s.locale);

  const [variant, setVariant] = useState<FormVariant>("ff");
  const [locale, setLocale] = useState<string>("");
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  const availableVariants = baseConfig?.variants ?? ["ff"];

  const definition = useMemo(() => {
    if (!baseDefinition) return null;
    const content: ContributionContent = {
      translations: Array.from(translations.values()).filter((t) => t.value.trim() !== ""),
      newQuestions,
      newConsents,
    };
    return applyContribution(baseDefinition, content);
  }, [baseDefinition, translations, newQuestions, newConsents]);

  // Default to a locale that actually has one of this session's in-progress
  // translations whenever the dialog opens — preferring the "Translating into"
  // locale if it's one of them, else whichever locale the translations were
  // actually entered under. Falling back to `workingLocale` alone (the currently
  // selected editing locale) would show blank/default content whenever the user
  // switched that dropdown to look around *after* translating, e.g. translated
  // into fr_FR, then flipped "Translating into" to de_DE without typing anything
  // — Preview would open on de_DE and look like translations don't work at all.
  useEffect(() => {
    if (!open || !baseDefinition) return;
    const translatedLocales = new Set(Array.from(translations.values()).filter((t) => t.value.trim() !== "").map((t) => t.locale));
    const firstTranslatedLocale: string | undefined = translatedLocales.values().next().value;
    const fallback = workingLocale || baseDefinition.meta.defaultLocale;
    const next = workingLocale && translatedLocales.has(workingLocale) ? workingLocale : (firstTranslatedLocale ?? fallback);
    setLocale(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
    const doc = buildPreviewDocument(files, variant, locale, fileNames);
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setIframeUrl(url);
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, definition, baseConfig, variant, locale]);

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
          {iframeUrl && <iframe key={iframeUrl} src={iframeUrl} title="Contribution preview" style={{ border: "none", flexGrow: 1, width: "100%" }} />}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
