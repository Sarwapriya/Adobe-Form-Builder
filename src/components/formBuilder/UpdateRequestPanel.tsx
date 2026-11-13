import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import {
  approveUpdateRequest,
  listUpdateRequests,
  rejectUpdateRequest,
  type UpdateRequestSummary,
} from "../../api/formBuilderApi";
import { ApiError } from "../../api/apiClient";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { showToast } from "../../store/toastStore";
import { useResponsiveDialogProps } from "../../hooks/useResponsiveDialog";

const STATUS_LABEL: Record<UpdateRequestSummary["status"], string> = {
  pending: "Pending",
  approved: "Approved — editable now",
  rejected: "Rejected",
  consumed: "Consumed (changes published)",
};

const STATUS_COLOR: Record<UpdateRequestSummary["status"], "warning" | "success" | "error" | "default"> = {
  pending: "warning",
  approved: "success",
  rejected: "error",
  consumed: "default",
};

/**
 * Admin-facing review queue for "Request Update" submissions — a subsidiary
 * user's ask to edit a form that's currently locked for their own editing
 * (an ad-hoc form once published, or a Translate & Extend contribution once
 * the form's been deployed — see form_update_request_service.py's own doc
 * comment). Approving re-opens that one subsidiary's edit window until the
 * next time this form is actually republished (publish_form consumes it
 * automatically then — no admin action needed to "close" it again). Lives on
 * FormBuilderEditorPage, alongside AdHocReviewPanel/ContributionReviewPanel.
 *
 * Only renders once there's at least one request for this form, same
 * "nothing to show, don't take up space" convention as ContributionReviewPanel.
 */
export function UpdateRequestPanel({ formId }: { formId: string }) {
  const reloadForm = useFormBuilderStore((s) => s.loadForm);
  const responsiveDialogProps = useResponsiveDialogProps();
  const [requests, setRequests] = useState<UpdateRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<UpdateRequestSummary | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  async function refresh() {
    try {
      setRequests(await listUpdateRequests(formId));
    } catch {
      // Non-fatal — the form itself already loaded fine.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  async function handleApprove(id: string) {
    setBusyId(id);
    try {
      await approveUpdateRequest(formId, id);
      await Promise.all([refresh(), reloadForm(formId)]);
      showToast("Update request approved.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to approve update request", "error");
    } finally {
      setBusyId(null);
    }
  }

  function openRejectDialog(r: UpdateRequestSummary) {
    setRejectNote("");
    setRejectTarget(r);
  }

  async function handleRejectConfirm() {
    if (!rejectTarget) return;
    const id = rejectTarget.id;
    setBusyId(id);
    try {
      await rejectUpdateRequest(formId, id, rejectNote.trim() || undefined);
      setRejectTarget(null);
      await refresh();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to reject update request", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <CircularProgress size={20} />
      </Paper>
    );
  }

  if (requests.length === 0) return null;

  const pending = requests.filter((r) => r.status === "pending");
  const resolved = requests.filter((r) => r.status !== "pending");

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3, borderLeft: "4px solid", borderColor: "warning.main" }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
        Update requests
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
        A subsidiary user asked to edit this form after it was locked (published, or — for Translate &amp; Extend —
        deployed). Approving reopens their edit window until the next time you publish this form.
      </Typography>

      {pending.length > 0 && (
        <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>
          {pending.length} update request{pending.length === 1 ? "" : "s"} awaiting your review.
        </Alert>
      )}

      <Stack spacing={1.5} divider={<Divider />}>
        {pending.map((r) => (
          <Box key={r.id}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
              <Chip label={`${STATUS_LABEL[r.status]} · ${r.subsidiaryId}`} size="small" color={STATUS_COLOR[r.status]} />
              <Typography variant="caption" color="text.secondary">
                {new Date(r.requestedAt).toLocaleString()}
              </Typography>
            </Stack>
            {r.note && (
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {r.note}
              </Typography>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="contained"
                startIcon={<CheckCircleIcon />}
                disabled={busyId === r.id}
                onClick={() => void handleApprove(r.id)}
              >
                {busyId === r.id ? "Approving..." : "Approve"}
              </Button>
              <Button size="small" color="error" startIcon={<CancelIcon />} disabled={busyId === r.id} onClick={() => openRejectDialog(r)}>
                Reject
              </Button>
            </Stack>
          </Box>
        ))}

        {resolved.map((r) => (
          <Box key={r.id}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
              <Chip label={`${STATUS_LABEL[r.status]} · ${r.subsidiaryId}`} size="small" color={STATUS_COLOR[r.status]} />
              <Typography variant="caption" color="text.secondary">
                {new Date(r.requestedAt).toLocaleString()}
                {r.reviewedAt ? ` · reviewed ${new Date(r.reviewedAt).toLocaleString()}` : ""}
                {r.consumedAt ? ` · consumed ${new Date(r.consumedAt).toLocaleString()}` : ""}
              </Typography>
            </Stack>
            {r.note && (
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {r.note}
              </Typography>
            )}
            {r.reviewNote && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Review note: {r.reviewNote}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>

      <Dialog {...responsiveDialogProps} open={!!rejectTarget} onClose={() => setRejectTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CancelIcon color="error" fontSize="small" />
          Reject update request
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Let the subsidiary user know why — they can submit a new request afterward.
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
          <Button onClick={() => setRejectTarget(null)} disabled={busyId === rejectTarget?.id}>
            Cancel
          </Button>
          <Button variant="contained" color="error" disabled={busyId === rejectTarget?.id} onClick={() => void handleRejectConfirm()}>
            {busyId === rejectTarget?.id ? "Rejecting..." : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
