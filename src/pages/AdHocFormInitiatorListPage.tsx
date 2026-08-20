import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import { ApiError } from "../api/apiClient";
import { deleteForm, listForms, type FormListItem, type FormStatus } from "../api/formBuilderApi";
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
 * "Ad-hoc Forms" — the Form Initiator submenu page for subsidiary-initiated
 * submissions (origin: "adhoc", see MyAdHocFormEditorPage on the subsidiary
 * side), fully separate from the sibling "HR Form Initiator" submenu page
 * (HrFormInitiatorListPage), which only ever covers admin-authored forms.
 * No "New Form" button here — an admin never creates an ad-hoc form directly,
 * only reviews (AdHocReviewPanel, on the shared FormBuilderEditorPage) what a
 * subsidiary user has already submitted.
 */
export function AdHocFormInitiatorListPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FormStatus | "">("");
  const [pendingReviewOnly, setPendingReviewOnly] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteForm, setConfirmDeleteForm] = useState<FormListItem | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const result = await listForms({
        status: statusFilter || undefined,
        pendingReview: pendingReviewOnly || undefined,
        origin: "adhoc",
      });
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
  }, [statusFilter, pendingReviewOnly]);

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
        title="Ad-hoc Forms"
        subtitle="Forms subsidiary users built themselves via My Forms — review, pick a Project Code, and approve or reject."
      />

      <Paper sx={{ p: 2, mb: 2, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          select
          label="Status"
          size="small"
          sx={{ minWidth: 180 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FormStatus | "")}
          InputLabelProps={{ shrink: true }}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <FormControlLabel
          control={<Checkbox checked={pendingReviewOnly} onChange={(e) => setPendingReviewOnly(e.target.checked)} />}
          label="Pending review only"
        />
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
            No ad-hoc forms yet.
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
              {form.pendingReview && <Chip label="Pending review" size="small" color="warning" />}
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
    </Box>
  );
}
