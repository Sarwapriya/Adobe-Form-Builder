import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Box, Button, Chip, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import DeleteIcon from "@mui/icons-material/Delete";
import { ApiError } from "../../api/apiClient";
import {
  deleteSubsidiaryRecaptchaConfig,
  listAllSubsidiaryRecaptchaConfigs,
  upsertSubsidiaryRecaptchaConfig,
  type SubsidiaryRecaptchaConfig,
} from "../../api/adminApi";
import { listSubsidiaries, type Subsidiary } from "../../api/subsidiariesApi";
import { SectionHeader } from "../common/SectionHeader";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { LoadingState } from "../common/LoadingState";
import { showToast } from "../../store/toastStore";

/**
 * Reference table of each subsidiary's Google reCAPTCHA v2 site key — one
 * key per subsidiary (not per locale, unlike SubsidiaryPrivacyLinkManager —
 * reCAPTCHA site keys are domain-scoped, not language-scoped). The form
 * builder's reCAPTCHA toggle (BuilderCanvas.tsx) reads this to warn when
 * it's turned on for a subsidiary with no key configured yet; the key
 * itself is resolved onto the generated data.js at publish time, never
 * typed into the builder directly. Adding a key for a subsidiary that
 * already has one replaces it in place, so there's no separate "edit"
 * action.
 */
export function SubsidiaryRecaptchaConfigManager() {
  const [configs, setConfigs] = useState<SubsidiaryRecaptchaConfig[]>([]);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [loading, setLoading] = useState(true);

  const [subsidiaryName, setSubsidiaryName] = useState("");
  const [siteKey, setSiteKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SubsidiaryRecaptchaConfig | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [configRows, subsidiaryRows] = await Promise.all([listAllSubsidiaryRecaptchaConfigs(), listSubsidiaries()]);
      setConfigs(configRows);
      setSubsidiaries(subsidiaryRows);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to load reCAPTCHA configs", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const trimmedSiteKey = siteKey.trim();
  const canSave = !!subsidiaryName && !!trimmedSiteKey;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await upsertSubsidiaryRecaptchaConfig(subsidiaryName, trimmedSiteKey);
      setSiteKey("");
      await refresh();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to save reCAPTCHA config", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setDeletingId(id);
    try {
      await deleteSubsidiaryRecaptchaConfig(id);
      setConfirmDelete(null);
      await refresh();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to remove reCAPTCHA config", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader
        icon={<VerifiedUserIcon fontSize="small" color="primary" />}
        title="reCAPTCHA site keys"
        subtitle={
          'The Google reCAPTCHA v2 site key for each subsidiary — the form builder reads this when an admin/subsidiary ' +
          'user turns on the "I\'m not a robot" checkbox for a campaign, so it never needs typing per form.'
        }
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
          label="Site key"
          size="small"
          placeholder="6Lc...AbCd"
          sx={{ minWidth: 320, flexGrow: 1 }}
          value={siteKey}
          onChange={(e) => setSiteKey(e.target.value)}
          inputProps={{ dir: "ltr" }}
        />
        <Button type="submit" variant="outlined" disabled={!canSave || saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </Box>

      {loading ? (
        <LoadingState />
      ) : configs.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No reCAPTCHA site keys configured yet.
        </Typography>
      ) : (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {configs.map((c) => (
            <Tooltip key={c.id} title={c.siteKey}>
              <Chip
                label={c.subsidiaryName}
                onDelete={deletingId === c.id ? undefined : () => setConfirmDelete(c)}
                deleteIcon={
                  <Tooltip title="Remove">
                    <DeleteIcon fontSize="small" />
                  </Tooltip>
                }
              />
            </Tooltip>
          ))}
        </Stack>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Remove reCAPTCHA site key"
        message={
          <>
            Remove the reCAPTCHA site key for <strong>{confirmDelete?.subsidiaryName}</strong>? Any campaign with
            reCAPTCHA already turned on will start showing a broken widget until a new key is added.
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
