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
import TranslateIcon from "@mui/icons-material/Translate";
import EditOffIcon from "@mui/icons-material/EditOff";
import AddIcon from "@mui/icons-material/Add";
import { ApiError } from "../api/apiClient";
import { createAdHocForm, listMyAdHocForms, listMyForms } from "../api/subsidiaryFormsApi";
import type { FormListItem } from "../api/formBuilderApi";
import { ContributionStatusBar } from "../components/formContribution/ContributionStatusBar";
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
 * Landing page for a subsidiary-scoped standard user's own view of forms —
 * split into two clearly-separate categories:
 *  - "Ad-hoc Forms": brand-new forms this user builds themselves from scratch
 *    (see MyAdHocFormEditorPage) — an admin reviews and picks the Project Code
 *    before one goes live.
 *  - "HR Forms": every currently *published* form an admin created and
 *    allocated to this subsidiary (minus any whose project code is blocked,
 *    mirroring the same access rule the upload flow already applies — see
 *    backend's formAccessService.ts). Read-only here; clicking one opens the
 *    Translate & Extend page, the only way a standard user can contribute to it.
 */
export function MyFormsListPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [adHocForms, setAdHocForms] = useState<FormListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  function refresh() {
    setLoading(true);
    setError(null);
    Promise.all([listMyForms(), listMyAdHocForms()])
      .then(([published, adHoc]) => {
        setForms(published);
        setAdHocForms(adHoc);
      })
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

  return (
    <Box>
      <PageHeader
        icon={<TranslateIcon />}
        title="My Forms"
        subtitle="Ad-hoc forms you build yourself, and HR forms your admin created and allocated to your subsidiary."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Ad-hoc Forms
            </Typography>
            <Typography variant="caption" color="text.secondary">
              A brand-new form you build yourself. An admin reviews it (and picks its Project Code) before it goes live.
            </Typography>
          </Box>
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
                  <Chip label={statusLabel} size="small" color={AD_HOC_STATUS_COLOR[statusLabel]} />
                </Box>
              );
            })}
          </Stack>
        )}
      </Paper>

      <Box sx={{ mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={700}>
          HR Forms
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Published forms your admin created and allocated to your subsidiary — add translations, questions, or
          consents for review.
        </Typography>
      </Box>

      {loading ? (
        <CircularProgress size={24} />
      ) : forms.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No HR forms are available for your subsidiary yet.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1}>
          {forms.map((form) => (
            <Paper key={form.id} sx={{ p: 2, cursor: "pointer" }} onClick={() => navigate(`/my-forms/${form.id}`)}>
              <Stack direction="row" alignItems="center" gap={2}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {form.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {form.subsidiaryId}
                    {form.projectCode ? ` · ${form.projectCode}` : ""} · Updated {new Date(form.updatedAt).toLocaleString()}
                  </Typography>
                </Box>
                {form.projectCodeLocked && (
                  <Chip icon={<EditOffIcon />} label="Locked" size="small" color="warning" />
                )}
                {form.publishedVersionNumber != null && <Chip label={`v${form.publishedVersionNumber}`} size="small" variant="outlined" />}
              </Stack>
              {form.myContributionProgress && (
                <Box sx={{ mt: 1.5, maxWidth: 360 }}>
                  <ContributionStatusBar progress={form.myContributionProgress} />
                </Box>
              )}
            </Paper>
          ))}
        </Stack>
      )}

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
