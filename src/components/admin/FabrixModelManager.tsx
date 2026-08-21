import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Alert, Box, Button, IconButton, Paper, Stack, Switch, TextField, Tooltip, Typography } from "@mui/material";
import ModelTrainingIcon from "@mui/icons-material/ModelTraining";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { ApiError } from "../../api/apiClient";
import {
  createFabrixModel,
  deleteFabrixModel,
  listFabrixModels,
  moveFabrixModel,
  updateFabrixModel,
  type FabrixModel,
} from "../../api/adminApi";
import { SectionHeader } from "../common/SectionHeader";
import { LoadingState } from "../common/LoadingState";

/**
 * Admin-managed catalog of selectable FabriX LLMs (Configuration > AI
 * Assistant > Models) — every *enabled* row, in the order shown here, is
 * sent together as the chat request's `modelIds` array (see backend
 * fabrixAIService.ts's callFabrixAgent). Listing more than one enabled model
 * is what lets FabriX itself route around/swap past one that's unavailable
 * or token/rate-limited — this app doesn't implement its own retry-with-
 * different-model logic, it just hands FabriX the full priority list.
 */
export function FabrixModelManager() {
  const [models, setModels] = useState<FabrixModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newModelId, setNewModelId] = useState("");
  const [creating, setCreating] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setModels(await listFabrixModels());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load FabriX models");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newModelId.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await createFabrixModel(newName.trim(), newModelId.trim());
      setNewName("");
      setNewModelId("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add model");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(model: FabrixModel) {
    setBusyId(model.id);
    setError(null);
    try {
      await updateFabrixModel(model.id, { isEnabled: !model.isEnabled });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update model");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(model: FabrixModel, direction: "up" | "down") {
    setBusyId(model.id);
    setError(null);
    try {
      await moveFabrixModel(model.id, direction);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reorder model");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(model: FabrixModel) {
    setBusyId(model.id);
    setError(null);
    try {
      await deleteFabrixModel(model.id);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete model");
    } finally {
      setBusyId(null);
    }
  }

  const enabledCount = models.filter((m) => m.isEnabled).length;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader icon={<ModelTrainingIcon fontSize="small" color="primary" />} title="AI Assistant Models" />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Every enabled model below is sent together on each request, in this order — FabriX uses that list to route
        around or fall back past one that's unavailable or hitting a token/rate limit.
      </Typography>

      {error && !loading && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}
      {!loading && models.length > 0 && enabledCount === 0 && (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          No models are enabled — turn at least one on below or the assistant can't respond.
        </Alert>
      )}

      <Box component="form" onSubmit={handleCreate} sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <TextField label="Name" size="small" value={newName} onChange={(e) => setNewName(e.target.value)} sx={{ minWidth: 200 }} />
        <TextField
          label="Model ID"
          size="small"
          value={newModelId}
          onChange={(e) => setNewModelId(e.target.value)}
          sx={{ minWidth: 280 }}
        />
        <Button type="submit" variant="outlined" disabled={!newName.trim() || !newModelId.trim() || creating}>
          {creating ? "Adding..." : "Add"}
        </Button>
      </Box>

      {loading ? (
        <LoadingState />
      ) : models.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No models configured yet — add one above.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {models.map((model, index) => (
            <Stack
              key={model.id}
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: 2,
                bgcolor: "rgba(20, 22, 33, 0.03)",
                opacity: model.isEnabled ? 1 : 0.55,
              }}
            >
              <Stack direction="column" spacing={0}>
                <Tooltip title="Move up">
                  <span>
                    <IconButton size="small" disabled={index === 0 || busyId === model.id} onClick={() => handleMove(model, "up")}>
                      <ArrowUpwardIcon fontSize="inherit" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Move down">
                  <span>
                    <IconButton
                      size="small"
                      disabled={index === models.length - 1 || busyId === model.id}
                      onClick={() => handleMove(model, "down")}
                    >
                      <ArrowDownwardIcon fontSize="inherit" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>

              <Switch checked={model.isEnabled} disabled={busyId === model.id} onChange={() => handleToggle(model)} size="small" />

              <Typography variant="body2" fontWeight={600} sx={{ minWidth: 180 }}>
                {model.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1, fontFamily: "monospace" }} noWrap>
                {model.modelId}
              </Typography>

              <Tooltip title="Delete">
                <span>
                  <IconButton size="small" disabled={busyId === model.id} onClick={() => handleDelete(model)}>
                    <DeleteIcon fontSize="inherit" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
