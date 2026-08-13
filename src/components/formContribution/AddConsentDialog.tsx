import { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { ConsentDefinition, LocaleCode } from "@formbuilder/shared";
import { useFormContributionStore } from "../../store/formContributionStore";

/** A brand-new consent checkbox this subsidiary user is proposing — same
 * per-locale text convention as AddQuestionDialog (this is genuinely new content,
 * so the submitter provides its own text for every locale the form has, not a
 * translation of something that already exists). Only the default locale is
 * required. Always optional/non-blocking (never gates Submit), same as any other
 * admin-added consent — see ConsentDefinition's own doc comment in
 * formDefinition.ts. */
export function AddConsentDialog({
  open,
  onClose,
  defaultLocale,
  locales,
}: {
  open: boolean;
  onClose: () => void;
  defaultLocale: string;
  locales: string[];
}) {
  const addConsent = useFormContributionStore((s) => s.addConsent);
  const [locale, setLocale] = useState(defaultLocale);
  const [textByLocale, setTextByLocale] = useState<Record<string, string>>({});
  const [linkUrlByLocale, setLinkUrlByLocale] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) setLocale(defaultLocale);
  }, [open, defaultLocale]);

  function reset() {
    setLocale(defaultLocale);
    setTextByLocale({});
    setLinkUrlByLocale({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleAdd() {
    if (!(textByLocale[defaultLocale] ?? "").trim()) return;

    const textEntries = Object.entries(textByLocale)
      .map(([l, v]) => [l, v.trim()] as const)
      .filter(([, v]) => v !== "");
    const linkEntries = Object.entries(linkUrlByLocale)
      .map(([l, v]) => [l, v.trim()] as const)
      .filter(([, v]) => v !== "");

    const consent: ConsentDefinition = {
      id: `new-c-${Date.now()}`,
      order: 0,
      textByLocale: Object.fromEntries(textEntries) as Record<LocaleCode, string>,
      linkUrlByLocale: linkEntries.length > 0 ? (Object.fromEntries(linkEntries) as Record<LocaleCode, string>) : undefined,
      required: false,
      visibleInVariants: ["ff"],
    };
    addConsent(consent);
    handleClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add a consent</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {locales.length > 1 && (
            <TextField select label="Text for locale" size="small" value={locale} onChange={(e) => setLocale(e.target.value)}>
              {locales.map((code) => (
                <MenuItem key={code} value={code}>
                  {code}
                  {code === defaultLocale ? " (default, required)" : ""}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            label={`Consent text (${locale})`}
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={textByLocale[locale] ?? ""}
            onChange={(e) => setTextByLocale((prev) => ({ ...prev, [locale]: e.target.value }))}
            autoFocus
          />
          <TextField
            label={`Link URL (${locale}, optional)`}
            size="small"
            fullWidth
            value={linkUrlByLocale[locale] ?? ""}
            onChange={(e) => setLinkUrlByLocale((prev) => ({ ...prev, [locale]: e.target.value }))}
          />
          {locales.length > 1 && (
            <Typography variant="caption" color="text.secondary">
              Only "{defaultLocale}" is required — fill in the other locales too if you can, or leave them and translate
              later.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" disabled={!(textByLocale[defaultLocale] ?? "").trim()} onClick={handleAdd}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}
