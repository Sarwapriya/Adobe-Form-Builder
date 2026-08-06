import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import DeleteIcon from "@mui/icons-material/Delete";
import { ApiError } from "../../api/apiClient";
import {
  createSubsidiaryProjectBlock,
  deleteSubsidiaryProjectBlock,
  listAllSubsidiaries,
  listSubsidiaryProjectBlocks,
  type Subsidiary,
  type SubsidiaryProjectBlock,
} from "../../api/adminApi";
import { listOpenProjectCodes, type ProjectCode } from "../../api/projectCodesApi";

/**
 * Blocks a specific (subsidiary, project code) pair from new uploads — e.g.
 * closing "F2H26" for "SGE" only, while every other subsidiary can still
 * upload it. Independent of, and layered on top of, ProjectCodeManager's own
 * global open/closed toggle above: a project code closed there never appears
 * in this panel's own dropdown either (it's already blocked for everyone, so
 * blocking it again per-subsidiary would be meaningless) — the dropdown
 * always reflects the *current* open project codes, so a newly-added one
 * shows up immediately and a since-closed one disappears.
 */
export function SubsidiaryProjectBlockManager() {
  const [blocks, setBlocks] = useState<SubsidiaryProjectBlock[]>([]);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [projectCodes, setProjectCodes] = useState<ProjectCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subsidiaryName, setSubsidiaryName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [blockRows, subsidiaryRows, codeRows] = await Promise.all([
        listSubsidiaryProjectBlocks(),
        listAllSubsidiaries(),
        listOpenProjectCodes(),
      ]);
      setBlocks(blockRows);
      setSubsidiaries(subsidiaryRows);
      setProjectCodes(codeRows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load subsidiary restrictions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!subsidiaryName || !projectCode) return;

    setCreating(true);
    setError(null);
    try {
      await createSubsidiaryProjectBlock(subsidiaryName, projectCode);
      setProjectCode("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create restriction");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      await deleteSubsidiaryProjectBlock(id);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove restriction");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <BlockIcon fontSize="small" color="primary" />
        <Typography variant="subtitle1" fontWeight={700}>
          Subsidiary upload restrictions
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Block a specific project code from a specific subsidiary — every other subsidiary can still upload it.
      </Typography>

      <Box component="form" onSubmit={handleCreate} sx={{ display: "flex", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
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
          select
          label="Project code"
          size="small"
          sx={{ minWidth: 160 }}
          value={projectCode}
          onChange={(e) => setProjectCode(e.target.value)}
          disabled={projectCodes.length === 0}
        >
          {projectCodes.map((pc) => (
            <MenuItem key={pc.id} value={pc.code}>
              {pc.code}
            </MenuItem>
          ))}
        </TextField>
        <Button type="submit" variant="outlined" disabled={!subsidiaryName || !projectCode || creating}>
          {creating ? "Blocking..." : "Block"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <CircularProgress size={20} />
      ) : blocks.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No restrictions — every subsidiary can upload against every open project code.
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          {blocks.map((b) => (
            <Stack
              key={b.id}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ px: 1.5, py: 0.75, borderRadius: 2, bgcolor: "rgba(20, 22, 33, 0.04)" }}
            >
              <Typography variant="body2">
                <strong>{b.subsidiaryName}</strong> may not upload <strong>{b.projectCode}</strong>
              </Typography>
              <Tooltip title="Remove restriction">
                <IconButton size="small" onClick={() => handleDelete(b.id)} disabled={deletingId === b.id}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
