import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import DomainIcon from "@mui/icons-material/Domain";
import { ApiError } from "../../api/apiClient";
import { createSubsidiary, listAllSubsidiaries, type Subsidiary } from "../../api/adminApi";

/**
 * Inline admin panel for creating subsidiaries — just a named picklist, no
 * open/closed toggle here. Per-subsidiary upload restrictions are always
 * scoped to a specific project code — see SubsidiaryProjectBlockManager
 * below, which this list feeds (its Subsidiary dropdown). Lives on
 * ConfigurationPage.
 */
export function SubsidiaryManager() {
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create subsidiary");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <DomainIcon fontSize="small" color="primary" />
        <Typography variant="subtitle1" fontWeight={700}>
          Subsidiaries
        </Typography>
      </Stack>

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
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {subsidiaries.map((s) => (
            <Chip key={s.id} label={s.name} />
          ))}
        </Stack>
      )}
    </Paper>
  );
}
