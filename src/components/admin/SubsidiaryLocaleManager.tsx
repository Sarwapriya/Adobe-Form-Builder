import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import DeleteIcon from "@mui/icons-material/Delete";
import { isRtlLangSubtag, langDisplayName } from "@formbuilder/shared";
import { ApiError } from "../../api/apiClient";
import { addSubsidiaryLocale, deleteSubsidiaryLocale, listAllSubsidiaryLocales } from "../../api/adminApi";
import type { SubsidiaryLocale } from "../../api/subsidiaryLocalesApi";
import { listSubsidiaries, type Subsidiary } from "../../api/subsidiariesApi";
import { SectionHeader } from "../common/SectionHeader";
import { LoadingState } from "../common/LoadingState";

const LOCALE_CODE_PATTERN = /^[a-zA-Z]{2,3}_[A-Z]{2}$/;

/**
 * The master list of which locale codes each subsidiary's users may pick from —
 * read by admin's own Form Initiator (a convenience picker alongside free text,
 * see LocaleManagerPanel.tsx) and, restricted with no free text, a subsidiary
 * user's own ad-hoc form builder (see SubsidiaryLocalePicker.tsx). Exactly one
 * locale per subsidiary should be marked "fallback" — adding a new fallback for
 * a subsidiary that already has one replaces it (server-enforced, see
 * subsidiaryLocaleService.addSubsidiaryLocale).
 */
export function SubsidiaryLocaleManager() {
  const [locales, setLocales] = useState<SubsidiaryLocale[]>([]);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subsidiaryName, setSubsidiaryName] = useState("");
  const [code, setCode] = useState("");
  const [isFallback, setIsFallback] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [localeRows, subsidiaryRows] = await Promise.all([listAllSubsidiaryLocales(), listSubsidiaries()]);
      setLocales(localeRows);
      setSubsidiaries(subsidiaryRows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load subsidiary locales");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const trimmedCode = code.trim();
    if (!subsidiaryName || !LOCALE_CODE_PATTERN.test(trimmedCode)) return;

    setCreating(true);
    setError(null);
    try {
      const langSubtag = trimmedCode.split("_")[0].toLowerCase();
      await addSubsidiaryLocale({
        subsidiaryName,
        code: trimmedCode,
        langSubtag,
        isRtl: isRtlLangSubtag(langSubtag),
        label: langDisplayName(langSubtag),
        isFallback,
      });
      setCode("");
      setIsFallback(false);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add locale");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      await deleteSubsidiaryLocale(id);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove locale");
    } finally {
      setDeletingId(null);
    }
  }

  const bySubsidiary = new Map<string, SubsidiaryLocale[]>();
  for (const l of locales) {
    const list = bySubsidiary.get(l.subsidiaryName) ?? [];
    list.push(l);
    bySubsidiary.set(l.subsidiaryName, list);
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader
        icon={<LanguageIcon fontSize="small" color="primary" />}
        title="Subsidiary locales"
        subtitle='Which locale codes each subsidiary’s users may pick from, in Form Initiator and in a subsidiary user’s own ad-hoc forms. One per subsidiary is the "fallback".'
      />

      <Box component="form" onSubmit={handleCreate} sx={{ display: "flex", gap: 1.5, mb: 1.5, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          select
          label="Subsidiary"
          size="small"
          sx={{ minWidth: 160 }}
          value={subsidiaryName}
          onChange={(e) => setSubsidiaryName(e.target.value)}
          disabled={subsidiaries.length === 0}
        >
          {subsidiaries.map((s) => (
            <MenuItem key={s.id} value={s.name}>
              {s.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Locale code"
          size="small"
          placeholder="ar_AE"
          sx={{ minWidth: 140 }}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button
          size="small"
          variant={isFallback ? "contained" : "outlined"}
          onClick={() => setIsFallback((v) => !v)}
        >
          Fallback
        </Button>
        <Button type="submit" variant="outlined" disabled={!subsidiaryName || !LOCALE_CODE_PATTERN.test(code.trim()) || creating}>
          {creating ? "Adding..." : "Add"}
        </Button>
      </Box>

      {error && !loading && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingState />
      ) : locales.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No subsidiary locales configured yet.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {Array.from(bySubsidiary.entries()).map(([name, rows]) => (
            <Box key={name}>
              <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                {name}
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {rows.map((l) => (
                  <Chip
                    key={l.id}
                    label={l.isFallback ? `${l.code} (fallback)` : l.code}
                    color={l.isFallback ? "primary" : "default"}
                    onDelete={deletingId === l.id ? undefined : () => handleDelete(l.id)}
                    deleteIcon={
                      <Tooltip title="Remove">
                        <DeleteIcon fontSize="small" />
                      </Tooltip>
                    }
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
