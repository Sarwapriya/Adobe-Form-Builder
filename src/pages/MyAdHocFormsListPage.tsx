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
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import AddIcon from "@mui/icons-material/Add";
import { ApiError } from "../api/apiClient";
import { createAdHocForm, deleteAdHocForm, listMyAdHocForms } from "../api/subsidiaryFormsApi";
import type { ContributionProgress, FormListItem } from "../api/formBuilderApi";
import { PageHeader } from "../components/common/PageHeader";
import { FormRowIconActions } from "../components/common/FormRowIconActions";
import { ContributionStatusBar } from "../components/formContribution/ContributionStatusBar";

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

/** Same 4-stage bar MyHrFormsListPage shows (see ContributionStatusBar.tsx),
 * built from the ad-hoc form's own status fields instead of a
 * FormContribution row — an ad-hoc form has no separate contribution object,
 * its lifecycle lives directly on the Form itself (submitAdHocFormForReview/
 * approveAdHocForm/rejectAdHocForm in formBuilderService.ts). Unlike the HR
 * contribution flow, "approved" and "published" happen in the same admin
 * click for an ad-hoc form (approveAdHocForm publishes immediately), so
 * `publishedAt` is set to `reviewedAt` too whenever it's actually published —
 * the bar still jumps straight to 100% in one step, just like a
 * simultaneously-approved-and-published contribution would. Returns null
 * (no bar) for a plain draft that's never been submitted — nothing to show
 * progress on yet. */
function adHocProgress(form: FormListItem): ContributionProgress | null {
  if (form.pendingReview) {
    return { status: "pending", submittedAt: form.submittedForReviewAt ?? form.updatedAt, reviewedAt: null, publishedAt: null };
  }
  if (form.status === "published") {
    return { status: "approved", submittedAt: form.submittedForReviewAt ?? form.updatedAt, reviewedAt: form.reviewedAt, publishedAt: form.reviewedAt };
  }
  if (form.reviewNote) {
    return { status: "rejected", submittedAt: form.submittedForReviewAt ?? form.updatedAt, reviewedAt: form.reviewedAt, publishedAt: null };
  }
  return null;
}

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
  /** Set when "New Ad-hoc Form" is opened via a specific row's Copy action
   * (below) — the dialog still asks for a fresh Name; only the
   * questions/fields/consents are cloned from this form. Null for the
   * ordinary "New Ad-hoc Form" button, which creates a blank form exactly
   * as before. */
  const [copySourceForm, setCopySourceForm] = useState<FormListItem | null>(null);
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

  function closeCreateDialog() {
    setCreateOpen(false);
    setNewName("");
    setCopySourceForm(null);
  }

  function handleCopy(form: FormListItem) {
    setCopySourceForm(form);
    setCreateOpen(true);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const created = await createAdHocForm(newName.trim(), copySourceForm?.id);
      closeCreateDialog();
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
              const progress = adHocProgress(form);
              return (
                <Box
                  key={form.id}
                  sx={{
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/my-forms/adhoc/${form.id}`)}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                      <FormRowIconActions
                        copyTooltip="Copy into a new ad-hoc form"
                        onCopy={() => handleCopy(form)}
                        onDelete={form.status === "draft" ? () => void handleDelete(form) : undefined}
                        deleteDisabled={deletingId === form.id}
                      />
                    </Stack>
                  </Box>
                  {progress && (
                    <Box sx={{ mt: 1.5, maxWidth: 360 }}>
                      <ContributionStatusBar progress={progress} />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Stack>
        )}
      </Paper>

      <Dialog open={createOpen} onClose={closeCreateDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{copySourceForm ? "New Ad-hoc Form (copy)" : "New Ad-hoc Form"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {copySourceForm && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Copying questions/fields/consents from <strong>{copySourceForm.name}</strong> — you can still change
                everything afterward.
              </Alert>
            )}
            <TextField
              autoFocus
              fullWidth
              size="small"
              label="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeCreateDialog} disabled={creating}>
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
