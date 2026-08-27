import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { approveAdHocForm, FormInvalidError, rejectAdHocForm } from "../../api/formBuilderApi";
import { listOpenProjectCodes, type ProjectCode } from "../../api/projectCodesApi";
import { ApiError } from "../../api/apiClient";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { QaRunDialog } from "../admin/QaRunDialog";

/**
 * Admin review queue for a subsidiary user's own "ad-hoc" form submission (see
 * formBuilderService.submitAdHocFormForReview) — shown on FormBuilderEditorPage
 * only while `pendingReview` is true. Distinct from ContributionReviewPanel,
 * which reviews translations/additions merged onto an *existing* published
 * form: here there's exactly one pending submission (the form itself), and
 * Approve is the one point a Project Code gets attached — never asked of the
 * subsidiary user who built it.
 */
export function AdHocReviewPanel({ formId }: { formId: string }) {
  const submittedForReviewAt = useFormBuilderStore((s) => s.submittedForReviewAt);
  const loadForm = useFormBuilderStore((s) => s.loadForm);
  const subsidiaryId = useFormBuilderStore((s) => s.subsidiaryId);

  const [projectCodes, setProjectCodes] = useState<ProjectCode[]>([]);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const [selectedProjectCode, setSelectedProjectCode] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!approveOpen) return;
    // Scoped to this subsidiary's own enabled project codes (see
    // SubsidiaryProjectCodeAccessManager on the Configuration page) — no
    // fallback to the unfiltered list if every open code happens to be
    // disabled for this subsidiary; that's now a deliberate admin choice to
    // surface (approveAdHocForm's own assertNotBlocked would reject the pick
    // server-side regardless), not something to silently work around here.
    listOpenProjectCodes(subsidiaryId)
      .then(setProjectCodes)
      .catch(() => setProjectCodes([]));
  }, [approveOpen, subsidiaryId]);

  async function handleApproveConfirm() {
    if (!selectedProjectCode) return;
    setBusy(true);
    setError(null);
    try {
      await approveAdHocForm(formId, selectedProjectCode);
      setApproveOpen(false);
      await loadForm(formId);
    } catch (err) {
      if (err instanceof FormInvalidError) {
        setError("Approve failed — this draft has validation errors. Open the form below, fix them, then try again.");
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to approve");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRejectConfirm() {
    setBusy(true);
    setError(null);
    try {
      await rejectAdHocForm(formId, rejectNote.trim() || undefined);
      setRejectOpen(false);
      await loadForm(formId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reject");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3, borderLeft: "4px solid", borderColor: "warning.main" }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
        Ad-hoc submission awaiting review
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
        This form was created by a subsidiary user via My Forms
        {submittedForReviewAt ? `, submitted ${new Date(submittedForReviewAt).toLocaleString()}` : ""}. Approving requires
        picking a Project Code (never asked of the subsidiary user) and publishes the form immediately; rejecting sends it
        back to them, editable again.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={1}>
        <Button size="small" variant="contained" startIcon={<CheckCircleIcon />} onClick={() => setApproveOpen(true)}>
          Approve
        </Button>
        <Button size="small" color="error" startIcon={<CancelIcon />} onClick={() => setRejectOpen(true)}>
          Reject
        </Button>
        <Button size="small" startIcon={<PlayArrowIcon />} onClick={() => setQaOpen(true)}>
          Run QA
        </Button>
      </Stack>

      {qaOpen && (
        <QaRunDialog
          subject={{ kind: "adhoc", formId }}
          availableVariants={["ff"]}
          open={qaOpen}
          onClose={() => setQaOpen(false)}
        />
      )}

      <Dialog open={approveOpen} onClose={() => setApproveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CheckCircleIcon color="success" fontSize="small" />
          Approve &amp; publish
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>Pick the project code this campaign belongs to.</DialogContentText>
          <TextField
            select
            fullWidth
            size="small"
            label="Project Code"
            value={selectedProjectCode}
            onChange={(e) => setSelectedProjectCode(e.target.value)}
          >
            {projectCodes.map((pc) => (
              <MenuItem key={pc.id} value={pc.code}>
                {pc.code}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setApproveOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="contained" disabled={busy || !selectedProjectCode} onClick={handleApproveConfirm}>
            {busy ? "Approving..." : "Approve & Publish"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CancelIcon color="error" fontSize="small" />
          Reject submission
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Let the subsidiary user know why — they&apos;ll see this note, and can then revise and resubmit it.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Reason for rejecting (optional)"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="contained" color="error" disabled={busy} onClick={handleRejectConfirm}>
            {busy ? "Rejecting..." : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
