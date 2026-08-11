import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
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
  type Subsidiary,
} from "../../api/adminApi";

/**
 * Inline admin panel for managing subsidiaries: create new ones, disable one
 * (blocks every project code for it in one step — reversible, click to
 * re-enable) or delete one outright (permanent — the chip's own "x"). Lives
 * on ConfigurationPage; per-project restrictions that don't need the whole
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
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <DomainIcon fontSize="small" color="primary" />
        <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>
          Subsidiaries
        </Typography>
        {subsidiaries.length > 0 && (
          <Button size="small" onClick={toggleSelectMode} disabled={bulkUpdating}>
            {selectMode ? "Cancel" : "Select multiple"}
          </Button>
        )}
      </Stack>

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

      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <CircularProgress size={20} />
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
        </>
      )}
    </Paper>
  );
}
