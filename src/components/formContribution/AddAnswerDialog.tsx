import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { AnswerDefinition, LocaleCode } from "@formbuilder/shared";
import { localeDir } from "../../utils/localeDir";

/** A brand-new answer option this subsidiary user is proposing for an EXISTING
 * question (not one added via AddQuestionDialog, which carries its own answers
 * already) — appended once approved (see contribution.ts's applyContribution,
 * which reassigns the real id/order regardless of what's used here). Same
 * per-locale text collection as AddQuestionDialog's own options: only the
 * default locale is required. */
export function AddAnswerDialog({
  open,
  onClose,
  defaultLocale,
  locales,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  defaultLocale: string;
  locales: string[];
  onAdd: (answer: AnswerDefinition) => void;
}) {
  const [locale, setLocale] = useState(defaultLocale);
  const [textByLocale, setTextByLocale] = useState<Record<string, string>>({});

  function reset() {
    setLocale(defaultLocale);
    setTextByLocale({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleAdd() {
    const defaultText = (textByLocale[defaultLocale] ?? "").trim();
    if (!defaultText) return;
    const entries = Object.entries(textByLocale)
      .map(([l, v]) => [l, v.trim()] as const)
      .filter(([, v]) => v !== "");
    onAdd({ id: "tmp", order: 0, textByLocale: Object.fromEntries(entries) as Record<LocaleCode, string> });
    handleClose();
  }

  const dir = localeDir(locale);
  const canAdd = (textByLocale[defaultLocale] ?? "").trim() !== "";

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add an option</DialogTitle>
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
            label={`Option text (${locale})`}
            size="small"
            fullWidth
            value={textByLocale[locale] ?? ""}
            inputProps={{ dir }}
            onChange={(e) => setTextByLocale((prev) => ({ ...prev, [locale]: e.target.value }))}
            autoFocus
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
        <Button variant="contained" disabled={!canAdd} onClick={handleAdd}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}
