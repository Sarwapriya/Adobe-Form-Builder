import { useState } from "react";
import { Alert, Box, Button, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { isRtlLangSubtag, langDisplayName, migrateDefaultLocale } from "@formbuilder/shared";
import { useFormBuilderStore } from "../../store/formBuilderStore";

const LOCALE_CODE_PATTERN = /^[a-zA-Z]{2,3}_[A-Z]{2}$/;

/**
 * Admin-managed list of the form's locales, entirely driven by what's added here —
 * every locale is equally addable/removable/reorderable, and the form is built from
 * whatever ends up in this list (no locale is specially protected). The first one
 * in the list is used as the fallback wherever a translation is missing; whenever
 * reordering or removing changes which locale that is, `migrateDefaultLocale`
 * (see localeMigration.ts) backfills the new fallback's text from the old one so
 * the form keeps rendering the same content instead of going blank.
 */
export function LocaleManagerPanel() {
  const definition = useFormBuilderStore((s) => s.definition);
  const updateDefinition = useFormBuilderStore((s) => s.updateDefinition);
  const [newCode, setNewCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!definition) return null;
  const locales = definition.locales;

  function addLocale() {
    const code = newCode.trim();
    if (!LOCALE_CODE_PATTERN.test(code)) {
      setError('Use the format "<lang>_<COUNTRY>", e.g. "ar_AE" or "fr_FR".');
      return;
    }
    if (locales.some((l) => l.code === code)) {
      setError(`"${code}" is already on this form.`);
      return;
    }
    const langSubtag = code.split("_")[0].toLowerCase();
    setError(null);
    setNewCode("");
    updateDefinition((d) => ({
      ...d,
      locales: [
        ...d.locales,
        { code, langSubtag, isRtl: isRtlLangSubtag(langSubtag), sourceColumn: "builder" as const, label: langDisplayName(langSubtag) },
      ],
    }));
  }

  function removeLocale(code: string) {
    if (locales.length <= 1) return;
    if (!window.confirm(`Remove "${code}"?`)) return;
    updateDefinition((d) => {
      const remaining = d.locales.filter((l) => l.code !== code);
      const wasDefault = d.meta.defaultLocale === code;
      const migrated = wasDefault ? migrateDefaultLocale(d, remaining[0].code, { removeOldLocale: true }) : d;
      return { ...migrated, locales: remaining };
    });
  }

  function moveLocale(index: number, delta: number) {
    const toIndex = index + delta;
    if (toIndex < 0 || toIndex >= locales.length) return;
    updateDefinition((d) => {
      const reordered = [...d.locales];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(toIndex, 0, moved);
      const newDefaultCode = reordered[0].code;
      const migrated = newDefaultCode !== d.meta.defaultLocale ? migrateDefaultLocale(d, newDefaultCode) : d;
      return { ...migrated, locales: reordered };
    });
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
        Locales
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
        The form is built from whichever locales you add here. The first one is used as the fallback wherever a
        translation is missing — reorder to change which one that is; content automatically follows so the form
        keeps showing the same text under the new fallback.
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 1.5 }}>
        {locales.map((l, i) => (
          <Box key={l.code} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.25 }}>
            <Typography variant="body2">
              {l.code}
              {i === 0 && (
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  (fallback)
                </Typography>
              )}
            </Typography>
            <Stack direction="row" spacing={0}>
              <IconButton size="small" aria-label="Move up" disabled={i === 0} onClick={() => moveLocale(i, -1)}>
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label="Move down" disabled={i === locales.length - 1} onClick={() => moveLocale(i, 1)}>
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label="Remove locale" disabled={locales.length <= 1} onClick={() => removeLocale(l.code)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        ))}
      </Stack>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <TextField
          size="small"
          placeholder="ar_AE"
          value={newCode}
          onChange={(e) => {
            setNewCode(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && addLocale()}
          sx={{ maxWidth: 160 }}
        />
        <Button size="small" startIcon={<AddIcon />} onClick={addLocale}>
          Add locale
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
}
