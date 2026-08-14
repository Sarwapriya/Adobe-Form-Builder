import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import { ApiError } from "../api/apiClient";
import { createForm, deleteForm, listForms, type FormListItem, type FormStatus } from "../api/formBuilderApi";
import { listSubsidiaries, type Subsidiary } from "../api/subsidiariesApi";
import { listOpenProjectCodes, type ProjectCode } from "../api/projectCodesApi";
import { PageHeader } from "../components/common/PageHeader";
import { ConfirmDialog } from "../components/common/ConfirmDialog";

const STATUS_COLOR: Record<FormStatus, "default" | "success" | "warning"> = {
  draft: "default",
  published: "success",
  unpublished: "warning",
};

const STATUS_OPTIONS: Array<{ value: FormStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
];

/**
 * Admin/superadmin-only landing page for the visual form builder — lists every
 * builder-authored form (fully separate from the Excel-upload-driven Uploads
 * list elsewhere in the app) and lets an admin create a new one, which opens
 * straight into the editor (FormBuilderEditorPage) for its first edit.
 */
export function FormBuilderListPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FormStatus | "">("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [projectCodes, setProjectCodes] = useState<ProjectCode[]>([]);
  const [newName, setNewName] = useState("");
  const [newSubsidiaryId, setNewSubsidiaryId] = useState("");
  const [newProjectCode, setNewProjectCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmDeleteForm, setConfirmDeleteForm] = useState<FormListItem | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const result = await listForms({ status: statusFilter || undefined });
      setForms(result.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load forms");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (!createOpen) return;
    listSubsidiaries().then(setSubsidiaries).catch(() => undefined);
    listOpenProjectCodes().then(setProjectCodes).catch(() => undefined);
  }, [createOpen]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newSubsidiaryId) return;

    setCreating(true);
    setError(null);
    try {
      const form = await createForm({
        name: newName.trim(),
        subsidiaryId: newSubsidiaryId,
        projectCode: newProjectCode || undefined,
      });
      setCreateOpen(false);
      setNewName("");
      setNewSubsidiaryId("");
      setNewProjectCode("");
      navigate(`/admin/form-builder/${form.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create form");
    } finally {
      setCreating(false);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteForm) return;
    setDeletingId(confirmDeleteForm.id);
    setError(null);
    try {
      await deleteForm(confirmDeleteForm.id);
      setConfirmDeleteForm(null);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete form");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Box>
      <PageHeader
        icon={<DesignServicesIcon />}
        title="Form Initiator"
        subtitle="Visually build, preview, and publish web forms — no Excel workbook required."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            New Form
          </Button>
        }
      />

      <Paper sx={{ p: 2, mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          select
          label="Status"
          size="small"
          sx={{ minWidth: 180 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FormStatus | "")}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <CircularProgress size={24} />
      ) : forms.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No forms yet — click "New Form" to create one.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1}>
          {forms.map((form) => (
            <Paper
              key={form.id}
              sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }}
              onClick={() => navigate(`/admin/form-builder/${form.id}`)}
            >
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                  {form.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {form.subsidiaryId}
                  {form.projectCode ? ` · ${form.projectCode}` : ""} · Updated {new Date(form.updatedAt).toLocaleString()}
                </Typography>
              </Box>
              {form.publishedVersionNumber != null && (
                <Chip label={`v${form.publishedVersionNumber}`} size="small" variant="outlined" />
              )}
              <Chip label={form.status} color={STATUS_COLOR[form.status]} size="small" />
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                disabled={deletingId === form.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteForm(form);
                }}
              >
                Delete
              </Button>
            </Paper>
          ))}
        </Stack>
      )}

      <ConfirmDialog
        open={!!confirmDeleteForm}
        title="Delete form"
        message={`Delete "${confirmDeleteForm?.name}"?${confirmDeleteForm && confirmDeleteForm.status !== "draft" ? " Its published output will also be hidden." : ""}`}
        confirmLabel="Delete"
        loading={deletingId === confirmDeleteForm?.id}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteForm(null)}
      />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={handleCreate}>
          <DialogTitle>New Form</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Name"
                size="small"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
              <TextField
                select
                label="Subsidiary"
                size="small"
                value={newSubsidiaryId}
                onChange={(e) => setNewSubsidiaryId(e.target.value)}
                required
              >
                {subsidiaries.map((s) => (
                  <MenuItem key={s.id} value={s.name}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Project Code (optional)"
                size="small"
                value={newProjectCode}
                onChange={(e) => setNewProjectCode(e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {projectCodes.map((pc) => (
                  <MenuItem key={pc.id} value={pc.code}>
                    {pc.code}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!newName.trim() || !newSubsidiaryId || creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
