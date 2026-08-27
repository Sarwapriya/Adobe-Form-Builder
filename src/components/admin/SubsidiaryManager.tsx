import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Alert, Box, Button, Chip, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DomainIcon from "@mui/icons-material/Domain";
import { ApiError } from "../../api/apiClient";
import {
  createSubsidiary,
  deleteSubsidiary,
  listAllSubsidiaries,
  setSubsidiaryActive,
  setSubsidiaryNotificationEmails,
  type Subsidiary,
} from "../../api/adminApi";
import { SectionHeader } from "../common/SectionHeader";
import { LoadingState } from "../common/LoadingState";
import { NotificationEmailFields } from "../common/NotificationEmailFields";

/**
 * Inline admin panel for managing subsidiaries: create new ones, disable one
 * (blocks every project code for it in one step — reversible, click to
 * re-enable), delete one outright (permanent — the chip's own "x"), or set up
 * to two extra notification recipient addresses per subsidiary. Lives on
 * ConfigurationPage; per-project restrictions that don't need the whole
 * subsidiary blocked are SubsidiaryProjectBlockManager below.
 */
export function SubsidiaryManager({ onChange }: { onChange?: () => void } = {}) {
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [savingEmailsId, setSavingEmailsId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setSubsidiaries(await listAllSubsidiaries());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load subsidiaries");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      await createSubsidiary(newName.trim());
      setNewName("");
      await refresh();
      onChange?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create subsidiary");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(subsidiary: Subsidiary) {
    setTogglingId(subsidiary.id);
    setError(null);
    try {
      await setSubsidiaryActive(subsidiary.id, !subsidiary.isActive);
      await refresh();
      onChange?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update subsidiary");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(subsidiary: Subsidiary) {
    setDeletingId(subsidiary.id);
    setError(null);
    try {
      await deleteSubsidiary(subsidiary.id);
      await refresh();
      onChange?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete subsidiary");
    } finally {
      setDeletingId(null);
    }
  }

  function toggleSelectMode() {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSaveEmails(id: string, notificationEmail1: string, notificationEmail2: string) {
    setSavingEmailsId(id);
    setError(null);
    try {
      await setSubsidiaryNotificationEmails(id, notificationEmail1 || null, notificationEmail2 || null);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update notification emails");
    } finally {
      setSavingEmailsId(null);
    }
  }

  async function handleBulkSetActive(isActive: boolean) {
    if (selectedIds.size === 0) return;
    setBulkUpdating(true);
    setError(null);
    try {
      await Promise.all(Array.from(selectedIds).map((id) => setSubsidiaryActive(id, isActive)));
      setSelectedIds(new Set());
      setSelectMode(false);
      await refresh();
      onChange?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update subsidiaries");
    } finally {
      setBulkUpdating(false);
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader
        icon={<DomainIcon fontSize="small" color="primary" />}
        title="Subsidiaries"
        action={
          subsidiaries.length > 0 && (
            <Button size="small" onClick={toggleSelectMode} disabled={bulkUpdating}>
              {selectMode ? "Cancel" : "Select multiple"}
            </Button>
          )
        }
      />

      {selectMode && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
          <Typography variant="caption" color="text.secondary">
            {selectedIds.size} selected
          </Typography>
          <Button
            size="small"
            variant="outlined"
            color="error"
            disabled={selectedIds.size === 0 || bulkUpdating}
            onClick={() => handleBulkSetActive(false)}
          >
            {bulkUpdating ? "Disabling..." : "Disable selected"}
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="success"
            disabled={selectedIds.size === 0 || bulkUpdating}
            onClick={() => handleBulkSetActive(true)}
          >
            {bulkUpdating ? "Enabling..." : "Enable selected"}
          </Button>
        </Stack>
      )}

      <Box component="form" onSubmit={handleCreate} sx={{ display: "flex", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
        <TextField
          label="New subsidiary"
          size="small"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button type="submit" variant="outlined" disabled={!newName.trim() || creating}>
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
      ) : subsidiaries.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No subsidiaries yet — add one above so users can select it when uploading.
        </Typography>
      ) : (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            {selectMode
              ? "Click chips to select them, then disable or enable them all at once above."
              : "Click a chip to enable/disable it (blocks every project for that subsidiary); click its \"x\" to delete it permanently. Use \"Select multiple\" to disable several at once."}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {subsidiaries.map((s) =>
              selectMode ? (
                <Chip
                  key={s.id}
                  label={s.name}
                  color={selectedIds.has(s.id) ? "primary" : s.isActive ? "success" : "default"}
                  variant={selectedIds.has(s.id) ? "filled" : "outlined"}
                  icon={
                    selectedIds.has(s.id) ? (
                      <CheckCircleIcon />
                    ) : s.isActive ? (
                      <LockOpenIcon />
                    ) : (
                      <LockIcon />
                    )
                  }
                  onClick={() => toggleSelected(s.id)}
                  disabled={bulkUpdating}
                  title={s.isActive ? "Active" : "Disabled"}
                />
              ) : (
                <Chip
                  key={s.id}
                  label={s.name}
                  color={s.isActive ? "success" : "default"}
                  icon={s.isActive ? <LockOpenIcon /> : <LockIcon />}
                  onClick={() => handleToggle(s)}
                  onDelete={() => handleDelete(s)}
                  disabled={togglingId === s.id || deletingId === s.id}
                  title={s.isActive ? "Active — click to disable" : "Disabled — click to enable"}
                />
              ),
            )}
          </Stack>

          {!selectMode && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Notification emails
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Extra notification emails per subsidiary (additional to whichever of that subsidiary's own users
                receive a notification) — leave blank to send only to the subsidiary's own users.
              </Typography>
              <Stack spacing={1}>
                {subsidiaries.map((s) => (
                  <SubsidiaryNotificationRow
                    key={s.id}
                    subsidiary={s}
                    saving={savingEmailsId === s.id}
                    onSave={(email1, email2) => handleSaveEmails(s.id, email1, email2)}
                  />
                ))}
              </Stack>
            </>
          )}
        </>
      )}
    </Paper>
  );
}

function SubsidiaryNotificationRow({
  subsidiary,
  saving,
  onSave,
}: {
  subsidiary: Subsidiary;
  saving: boolean;
  onSave: (notificationEmail1: string, notificationEmail2: string) => void;
}) {
  const [email1, setEmail1] = useState(subsidiary.notificationEmail1 ?? "");
  const [email2, setEmail2] = useState(subsidiary.notificationEmail2 ?? "");

  useEffect(() => {
    setEmail1(subsidiary.notificationEmail1 ?? "");
    setEmail2(subsidiary.notificationEmail2 ?? "");
  }, [subsidiary.notificationEmail1, subsidiary.notificationEmail2]);

  const isDirty = email1 !== (subsidiary.notificationEmail1 ?? "") || email2 !== (subsidiary.notificationEmail2 ?? "");

  return (
    <NotificationEmailFields
      value1={email1}
      value2={email2}
      onValue1Change={setEmail1}
      onValue2Change={setEmail2}
      onSave={() => onSave(email1.trim(), email2.trim())}
      saving={saving}
      dirty={isDirty}
      label1="Notification email 1"
      label2="Notification email 2"
      saveLabel="Save emails"
      leading={
        <Typography variant="body2" fontWeight={600} sx={{ minWidth: 140 }}>
          {subsidiary.name}
        </Typography>
      }
      containerSx={(t) => ({ px: 1.5, py: 1, borderRadius: 2, bgcolor: alpha(t.palette.text.primary, 0.03) })}
    />
  );
}
