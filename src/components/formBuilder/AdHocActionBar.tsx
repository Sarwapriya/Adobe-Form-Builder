import { useState } from "react";
import { Alert, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { FormBuilderPreviewDialog } from "./FormBuilderPreviewDialog";

/** Ad-hoc builder counterpart to BuilderActionBar.tsx — Preview / Save Draft /
 * Submit for Review, no Publish/Unpublish (a subsidiary user never publishes
 * their own ad-hoc form directly; an admin does, via AdHocReviewPanel's Approve
 * action, after picking the project code). Submit is disabled once the form is
 * already pending review — see MyAdHocFormEditorPage's own locked-fields
 * treatment for the same condition. */
export function AdHocActionBar() {
  const status = useFormBuilderStore((s) => s.status);
  const pendingReview = useFormBuilderStore((s) => s.pendingReview);
  const reviewNote = useFormBuilderStore((s) => s.reviewNote);
  const dirty = useFormBuilderStore((s) => s.dirty);
  const saving = useFormBuilderStore((s) => s.saving);
  const publishing = useFormBuilderStore((s) => s.publishing);
  const error = useFormBuilderStore((s) => s.error);
  const validation = useFormBuilderStore((s) => s.validation);
  const saveDraft = useFormBuilderStore((s) => s.saveDraft);
  const submitForReview = useFormBuilderStore((s) => s.submitForReview);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const statusLabel = pendingReview ? "Pending review" : status === "published" ? "Published" : "Draft";
  const statusColor = pendingReview ? "warning" : status === "published" ? "success" : "default";

  async function handleSave() {
    setNotice(null);
    const ok = await saveDraft();
    if (ok) setNotice("Draft saved.");
  }

  async function handleSubmit() {
    if (!window.confirm("Submit this form for admin review? You won't be able to edit it again until it's reviewed.")) return;
    setNotice(null);
    const ok = await submitForReview();
    if (ok) setNotice("Submitted for review.");
  }

  return (
    <Paper sx={{ p: 2, borderRadius: 3, position: "sticky", bottom: 16 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip label={statusLabel} color={statusColor} size="small" />
        {dirty && <Chip label="Unsaved changes" size="small" variant="outlined" />}
        <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setPreviewOpen(true)}>
          Preview
        </Button>
        <Button size="small" variant="outlined" startIcon={<SaveIcon />} disabled={saving || pendingReview} onClick={handleSave}>
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<SendIcon />}
          disabled={publishing || pendingReview || validation.errors.length > 0}
          onClick={handleSubmit}
        >
          {publishing ? "Submitting..." : "Submit for Review"}
        </Button>
      </Stack>
      {pendingReview && (
        <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>
          This form is awaiting admin review — editing is locked until it's approved or rejected.
        </Alert>
      )}
      {!pendingReview && reviewNote && (
        <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            An admin rejected your last submission:
          </Typography>
          {reviewNote}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }} onClose={() => useFormBuilderStore.setState({ error: null })}>
          {error}
        </Alert>
      )}
      {notice && !error && (
        <Alert severity="success" sx={{ mt: 1.5, borderRadius: 2 }} onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      <FormBuilderPreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </Paper>
  );
}
