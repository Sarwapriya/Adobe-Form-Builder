import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Box, Button, Chip, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import PolicyIcon from "@mui/icons-material/Policy";
import DeleteIcon from "@mui/icons-material/Delete";
import { ApiError } from "../../api/apiClient";
import {
  deleteSubsidiaryPrivacyLink,
  listAllSubsidiaryPrivacyLinks,
  upsertSubsidiaryPrivacyLink,
  type SubsidiaryPrivacyLink,
} from "../../api/adminApi";
import { listSubsidiaries, type Subsidiary } from "../../api/subsidiariesApi";
import { SectionHeader } from "../common/SectionHeader";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { LoadingState } from "../common/LoadingState";
import { showToast } from "../../store/toastStore";

const LOCALE_CODE_PATTERN = /^[a-zA-Z]{2,3}_[A-Z]{2}$/;

/**
 * Reference table of each subsidiary+locale's real Privacy Policy URL (e.g.
 * "SGE"/"ar_AE" -> https://www.samsung.com/ae_ar/info/privacy/) — the form
 * builder's Privacy Policy consent field reads this to auto-fill its Link URL
 * instead of a user typing/guessing the right regional URL (see
 * ProfileFieldEditorPanel.tsx). Adding the same (subsidiary, locale) pair
 * again replaces the URL in place, so there's no separate "edit" action.
 */
export function SubsidiaryPrivacyLinkManager() {
  const [links, setLinks] = useState<SubsidiaryPrivacyLink[]>([]);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [loading, setLoading] = useState(true);

  const [subsidiaryName, setSubsidiaryName] = useState("");
  const [localeCode, setLocaleCode] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SubsidiaryPrivacyLink | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [linkRows, subsidiaryRows] = await Promise.all([listAllSubsidiaryPrivacyLinks(), listSubsidiaries()]);
      setLinks(linkRows);
      setSubsidiaries(subsidiaryRows);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to load privacy links", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const trimmedUrl = url.trim();
  const isUrlValid = trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://");
  const canSave = !!subsidiaryName && LOCALE_CODE_PATTERN.test(localeCode.trim()) && isUrlValid;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await upsertSubsidiaryPrivacyLink(subsidiaryName, localeCode.trim(), trimmedUrl);
      setLocaleCode("");
      setUrl("");
      await refresh();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to save privacy link", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setDeletingId(id);
    try {
      await deleteSubsidiaryPrivacyLink(id);
      setConfirmDelete(null);
      await refresh();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to remove privacy link", "error");
    } finally {
      setDeletingId(null);
    }
  }

  const bySubsidiary = new Map<string, SubsidiaryPrivacyLink[]>();
  for (const l of links) {
    const list = bySubsidiary.get(l.subsidiaryName) ?? [];
    list.push(l);
    bySubsidiary.set(l.subsidiaryName, list);
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader
        icon={<PolicyIcon fontSize="small" color="primary" />}
        title="Privacy Policy links"
        subtitle="The real regional Privacy Policy URL for each subsidiary + locale — the form builder auto-fills the Privacy Policy consent's Link URL from this instead of a user typing it."
      />

      <Box component="form" onSubmit={handleSave} sx={{ display: "flex", gap: 1.5, mb: 1.5, flexWrap: "wrap", alignItems: "center" }}>
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
          value={localeCode}
          onChange={(e) => setLocaleCode(e.target.value)}
        />
        <TextField
          label="Privacy Policy URL"
          size="small"
          placeholder="https://www.samsung.com/ae/info/privacy/"
          sx={{ minWidth: 320, flexGrow: 1 }}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button type="submit" variant="outlined" disabled={!canSave || saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </Box>

      {loading ? (
        <LoadingState />
      ) : links.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No privacy links configured yet.
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
                  <Tooltip key={l.id} title={l.url}>
                    <Chip
                      label={l.localeCode}
                      onDelete={deletingId === l.id ? undefined : () => setConfirmDelete(l)}
                      deleteIcon={
                        <Tooltip title="Remove">
                          <DeleteIcon fontSize="small" />
                        </Tooltip>
                      }
                    />
                  </Tooltip>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Remove privacy link"
        message={
          <>
            Remove the Privacy Policy URL for <strong>{confirmDelete?.localeCode}</strong> under{" "}
            <strong>{confirmDelete?.subsidiaryName}</strong>? Forms will no longer auto-fill it for that locale.
          </>
        }
        confirmLabel="Remove"
        loading={!!confirmDelete && deletingId === confirmDelete.id}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </Paper>
  );
}
