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
import VisibilityIcon from "@mui/icons-material/Visibility";
import CancelIcon from "@mui/icons-material/Cancel";
import PublishIcon from "@mui/icons-material/Publish";
import { resolveLocalizedText } from "@formbuilder/shared";
import {
  approveContribution,
  FormInvalidError,
  listFormContributions,
  publishForm as apiPublishForm,
  rejectContribution,
  type ContributionSummary,
} from "../../api/formBuilderApi";
import { ApiError } from "../../api/apiClient";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { ContributionMergePreviewDialog } from "./ContributionMergePreviewDialog";
import { ContributionDetails } from "./ContributionDetails";

type RowStatus = "pending" | "awaitingPublish" | "published" | "rejected";

function rowStatus(c: ContributionSummary): RowStatus {
  if (c.status === "pending") return "pending";
  if (c.status === "rejected") return "rejected";
  return c.publishedAt ? "published" : "awaitingPublish";
}

const ROW_STATUS_LABEL: Record<RowStatus, string> = {
  pending: "Pending",
  awaitingPublish: "Approved — awaiting publish",
  published: "Published",
  rejected: "Rejected",
};

const ROW_STATUS_COLOR: Record<RowStatus, "warning" | "info" | "success" | "error"> = {
  pending: "warning",
  awaitingPublish: "info",
  published: "success",
  rejected: "error",
};

function describeContent(c: ContributionSummary, defaultLocale: string): string {
  const parts: string[] = [];
  if (c.content.translations.length > 0) parts.push(`${c.content.translations.length} translation${c.content.translations.length === 1 ? "" : "s"}`);
  if (c.content.newQuestions.length > 0) {
    parts.push(
      c.content.newQuestions.map((q) => `question "${resolveLocalizedText(q.headingByLocale, defaultLocale, defaultLocale) || q.id}"`).join(", "),
    );
  }
  if (c.content.newConsents.length > 0) parts.push(`${c.content.newConsents.length} new consent${c.content.newConsents.length === 1 ? "" : "s"}`);
  return parts.length > 0 ? parts.join(" · ") : "No changes";
}

/**
 * Admin-facing review queue for a form's subsidiary-submitted contributions
 * (translations + additive questions/consents — see formContributionService.ts's
 * own doc comment). Approve and Publish are deliberately separate actions:
 * Approve just merges the contribution onto the current draft, so an admin can
 * approve several submissions before going live with all of them in one Publish —
 * the same "Publish" action used everywhere else in the builder, which also
 * stamps every now-live approved contribution's `publishedAt`. Rejecting leaves
 * the form untouched. Lives on FormBuilderEditorPage, below the main editor.
 */
export function ContributionReviewPanel({ formId }: { formId: string }) {
  const definition = useFormBuilderStore((s) => s.definition);
  const config = useFormBuilderStore((s) => s.config);
  const reloadForm = useFormBuilderStore((s) => s.loadForm);
  const [contributions, setContributions] = useState<ContributionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewContribution, setPreviewContribution] = useState<ContributionSummary | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ContributionSummary | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setContributions(await listFormContributions(formId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load contributions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  async function handleApprove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await approveContribution(formId, id);
      await Promise.all([refresh(), reloadForm(formId)]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to approve contribution");
    } finally {
      setBusyId(null);
    }
  }

  async function handlePublish() {
    setBusyId("__publish__");
    setError(null);
    try {
      await apiPublishForm(formId);
      await Promise.all([refresh(), reloadForm(formId)]);
    } catch (err) {
      if (err instanceof FormInvalidError) {
        setError("Publish failed — the current draft has validation errors (see the panel above). Fix them and try again.");
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to publish");
      }
    } finally {
      setBusyId(null);
    }
  }

  function openRejectDialog(c: ContributionSummary) {
    setRejectNote("");
    setRejectTarget(c);
  }

  async function handleRejectConfirm() {
    if (!rejectTarget) return;
    const id = rejectTarget.id;
    setBusyId(id);
    setError(null);
    try {
      await rejectContribution(formId, id, rejectNote.trim() || undefined);
      setRejectTarget(null);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reject contribution");
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

  if (contributions.length === 0) return null;

  const defaultLocale = definition?.meta.defaultLocale ?? "en_GB";
  const pending = contributions.filter((c) => c.status === "pending");
  const awaitingPublish = contributions.filter((c) => rowStatus(c) === "awaitingPublish");
  const finished = contributions.filter((c) => {
    const s = rowStatus(c);
    return s === "published" || s === "rejected";
  });

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
        Subsidiary contributions
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
        Translations and additions submitted by subsidiary users. Approve merges a submission onto the current draft;
        nothing goes live until you separately Publish — approve as many as you like first, then publish them all at
        once.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {awaitingPublish.length > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 1.5, borderRadius: 2 }}
          action={
            <Button
              size="small"
              variant="contained"
              startIcon={<PublishIcon />}
              disabled={busyId === "__publish__"}
              onClick={handlePublish}
            >
              {busyId === "__publish__" ? "Publishing..." : "Publish"}
            </Button>
          }
        >
          {awaitingPublish.length} approved contribution{awaitingPublish.length === 1 ? "" : "s"} not live yet.
        </Alert>
      )}

      <Stack spacing={1.5} divider={<Divider />}>
        {pending.map((c) => (
          <Box key={c.id}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
              <Chip label={ROW_STATUS_LABEL.pending} size="small" color={ROW_STATUS_COLOR.pending} />
              <Typography variant="caption" color="text.secondary">
                {new Date(c.submittedAt).toLocaleString()}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {describeContent(c, defaultLocale)}
            </Typography>
            {c.note && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Note: {c.note}
              </Typography>
            )}
            {expandedIds.has(c.id) && <ContributionDetails content={c.content} />}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button size="small" onClick={() => toggleExpanded(c.id)}>
                {expandedIds.has(c.id) ? "Hide details" : "Show details"}
              </Button>
              <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setPreviewContribution(c)}>
                Preview
              </Button>
              <Button size="small" variant="contained" disabled={busyId === c.id} onClick={() => handleApprove(c.id)}>
                {busyId === c.id ? "Approving..." : "Approve"}
              </Button>
              <Button size="small" color="error" disabled={busyId === c.id} onClick={() => openRejectDialog(c)}>
                Reject
              </Button>
            </Stack>
          </Box>
        ))}

        {awaitingPublish.map((c) => (
          <Box key={c.id}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
              <Chip label={ROW_STATUS_LABEL.awaitingPublish} size="small" color={ROW_STATUS_COLOR.awaitingPublish} />
              <Typography variant="caption" color="text.secondary">
                {new Date(c.submittedAt).toLocaleString()}
                {c.reviewedAt ? ` · approved ${new Date(c.reviewedAt).toLocaleString()}` : ""}
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {describeContent(c, defaultLocale)}
            </Typography>
            {expandedIds.has(c.id) && <ContributionDetails content={c.content} />}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button size="small" onClick={() => toggleExpanded(c.id)}>
                {expandedIds.has(c.id) ? "Hide details" : "Show details"}
              </Button>
              <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setPreviewContribution(c)}>
                Preview
              </Button>
            </Stack>
          </Box>
        ))}

        {finished.map((c) => {
          const status = rowStatus(c);
          return (
            <Box key={c.id}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                <Chip label={ROW_STATUS_LABEL[status]} size="small" color={ROW_STATUS_COLOR[status]} />
                <Typography variant="caption" color="text.secondary">
                  {new Date(c.submittedAt).toLocaleString()}
                  {c.reviewedAt ? ` · reviewed ${new Date(c.reviewedAt).toLocaleString()}` : ""}
                  {c.publishedAt ? ` · published ${new Date(c.publishedAt).toLocaleString()}` : ""}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {describeContent(c, defaultLocale)}
              </Typography>
              {c.reviewNote && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  Review note: {c.reviewNote}
                </Typography>
              )}
              {expandedIds.has(c.id) && <ContributionDetails content={c.content} />}
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" onClick={() => toggleExpanded(c.id)}>
                  {expandedIds.has(c.id) ? "Hide details" : "Show details"}
                </Button>
                <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setPreviewContribution(c)}>
                  Preview
                </Button>
              </Stack>
            </Box>
          );
        })}
      </Stack>

      <ContributionMergePreviewDialog
        open={!!previewContribution}
        onClose={() => setPreviewContribution(null)}
        contribution={previewContribution}
        baseDefinition={definition}
        baseConfig={config}
      />

      <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CancelIcon color="error" fontSize="small" />
          Reject contribution
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Let the subsidiary user know why this submission is being rejected — they'll see this note, and can then
            revise and resubmit it.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="Reason for rejecting (optional)"
            placeholder="e.g. the French translation for Q2 doesn't match the intended meaning..."
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectTarget(null)} disabled={busyId === rejectTarget?.id}>
            Cancel
          </Button>
          <Button variant="contained" color="error" disabled={busyId === rejectTarget?.id} onClick={handleRejectConfirm}>
            {busyId === rejectTarget?.id ? "Rejecting..." : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
