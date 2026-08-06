import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import BadgeIcon from "@mui/icons-material/Badge";
import { ApiError } from "../../api/apiClient";
import { createProjectCode, listAllProjectCodes, setProjectCodeOpen, type ProjectCode } from "../../api/adminApi";

/**
 * Inline admin panel for managing project codes (campaigns): create new ones
 * and toggle a code open/closed. Closing one blocks new uploads against it
 * (enforced server-side — see uploadService.createUpload) without touching
 * uploads already made under it. Lives on AdminDashboardPage; the upload
 * form's own dropdown (any user, open codes only) is a separate endpoint —
 * see projectCodesApi.ts.
 */
export function ProjectCodeManager({ onChange }: { onChange?: () => void } = {}) {
  const [codes, setCodes] = useState<ProjectCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setCodes(await listAllProjectCodes());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load project codes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newCode.trim()) return;

    setCreating(true);
    setError(null);
    try {
      await createProjectCode(newCode.trim());
      setNewCode("");
      await refresh();
      onChange?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create project code");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(code: ProjectCode) {
    setTogglingId(code.id);
    setError(null);
    try {
      await setProjectCodeOpen(code.id, !code.isOpen);
      await refresh();
      onChange?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update project code");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <BadgeIcon fontSize="small" color="primary" />
        <Typography variant="subtitle1" fontWeight={700}>
          Project codes
        </Typography>
      </Stack>

      <Box component="form" onSubmit={handleCreate} sx={{ display: "flex", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
        <TextField
          label="New project code"
          size="small"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
        />
        <Button type="submit" variant="outlined" disabled={!newCode.trim() || creating}>
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
      ) : codes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No project codes yet — add one above so users can select it when uploading.
        </Typography>
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {codes.map((code) => (
            <Chip
              key={code.id}
              label={code.code}
              color={code.isOpen ? "success" : "default"}
              icon={code.isOpen ? <LockOpenIcon /> : <LockIcon />}
              onClick={() => handleToggle(code)}
              disabled={togglingId === code.id}
              title={code.isOpen ? "Open — click to close" : "Closed — click to reopen"}
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
}
