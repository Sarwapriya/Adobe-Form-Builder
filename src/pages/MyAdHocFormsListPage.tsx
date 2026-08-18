import { useEffect, useState } from "react";
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
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { ApiError } from "../api/apiClient";
import { createAdHocForm, deleteAdHocForm, listMyAdHocForms } from "../api/subsidiaryFormsApi";
import type { FormListItem } from "../api/formBuilderApi";
import { PageHeader } from "../components/common/PageHeader";

type AdHocStatusLabel = "Draft" | "Pending review" | "Rejected" | "Published";

function adHocStatus(form: FormListItem): AdHocStatusLabel {
  if (form.pendingReview) return "Pending review";
  if (form.status === "published") return "Published";
  if (form.reviewNote) return "Rejected";
  return "Draft";
}

const AD_HOC_STATUS_COLOR: Record<AdHocStatusLabel, "default" | "warning" | "error" | "success"> = {
  Draft: "default",
  "Pending review": "warning",
  Rejected: "error",
  Published: "success",
};

/**
 * "Ad-hoc Forms" — the My Forms submenu page for brand-new forms a subsidiary
 * user builds themselves from scratch (see MyAdHocFormEditorPage). An admin
 * reviews and picks the Project Code before one goes live. Split out from the
 * combined My Forms page into its own sidebar submenu entry, alongside the
 * sibling "HR Forms" page (MyHrFormsListPage).
 */
export function MyAdHocFormsListPage() {
  const navigate = useNavigate();
  const [adHocForms, setAdHocForms] = useState<FormListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    setError(null);
    listMyAdHocForms()
      .then(setAdHocForms)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load forms");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const created = await createAdHocForm(newName.trim());
      setCreateOpen(false);
      setNewName("");
      navigate(`/my-forms/adhoc/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create form");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(form: FormListItem) {
    if (!window.confirm(`Delete "${form.name}"? This can't be undone.`)) return;
    setDeletingId(form.id);
    setError(null);
    try {
      await deleteAdHocForm(form.id);
      setAdHocForms((prev) => prev.filter((f) => f.id !== form.id));
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
        subtitle="Brand-new forms you build yourself. An admin reviews each one (and picks its Project Code) before it goes live."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            New Ad-hoc Form
          </Button>
        </Stack>

        {loading ? (
          <CircularProgress size={20} />
        ) : adHocForms.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            None yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {adHocForms.map((form) => {
              const statusLabel = adHocStatus(form);
              return (
                <Box
                  key={form.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/my-forms/adhoc/${form.id}`)}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {form.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Updated {new Date(form.updatedAt).toLocaleString()}
                      {form.projectCode ? ` · ${form.projectCode}` : ""}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Chip label={statusLabel} size="small" color={AD_HOC_STATUS_COLOR[statusLabel]} />
                    {form.status === "draft" && (
                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            size="small"
                            aria-label="Delete"
                            disabled={deletingId === form.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDelete(form);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </Paper>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Ad-hoc Form</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Name"
            sx={{ mt: 1 }}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button variant="contained" disabled={!newName.trim() || creating} onClick={handleCreate}>
            {creating ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
