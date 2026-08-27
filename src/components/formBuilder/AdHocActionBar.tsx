import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { useSaveShortcut } from "../../hooks/useSaveShortcut";
import { unsavedChangesBlinkSx } from "./unsavedChangesBlinkSx";
import { ApiError } from "../../api/apiClient";
import { deleteAdHocForm } from "../../api/subsidiaryFormsApi";
import { FormBuilderPreviewDialog } from "./FormBuilderPreviewDialog";

/** Ad-hoc builder counterpart to BuilderActionBar.tsx — Preview / Save Draft /
 * Submit for Review / Delete, no Publish/Unpublish (a subsidiary user never
 * publishes their own ad-hoc form directly; an admin does, via
 * AdHocReviewPanel's Approve action, after picking the project code). Submit
 * is disabled once the form is already pending review — see
 * MyAdHocFormEditorPage's own locked-fields treatment for the same condition.
 * Delete is only offered while status is still "draft" (covers plain draft,
 * pending review, and rejected-and-editable-again — every pre-publish state);
 * once an admin approves/publishes, status flips to "published" and the
 * server itself would reject the delete anyway (see deleteAdHocForm in
 * formBuilderService.ts) — this just avoids showing a button that would fail. */
export function AdHocActionBar() {
  const navigate = useNavigate();
  const formId = useFormBuilderStore((s) => s.formId);
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
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const statusLabel = pendingReview ? "Pending review" : status === "published" ? "Published" : "Draft";
  const statusColor = pendingReview ? "warning" : status === "published" ? "success" : "default";

  async function handleSave() {
    setNotice(null);
    const ok = await saveDraft();
    if (ok) setNotice("Draft saved.");
  }

  useSaveShortcut(() => void handleSave(), dirty && !saving && !pendingReview);

  async function handleSubmit() {
    if (!window.confirm("Submit this form for admin review? You won't be able to edit it again until it's reviewed.")) return;
    setNotice(null);
    const ok = await submitForReview();
    if (ok) setNotice("Submitted for review.");
  }

  async function handleDelete() {
    if (!formId) return;
    if (!window.confirm("Delete this form? This can't be undone.")) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteAdHocForm(formId);
      navigate("/my-forms/adhoc");
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Failed to delete form");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Paper
      elevation={8}
      sx={(t) => ({
        p: 2,
        borderRadius: 3,
        position: "sticky",
        bottom: 16,
        // Same reasoning as BuilderActionBar.tsx's own sticky toolbar: the
        // page's cards use a flat elevation-0 Paper by default (theme.ts), so
        // this bar needs a real drop shadow + accent-tinted border to read as
        // a distinct, floating action bar rather than blending into the page.
        border: `1px solid ${alpha(t.palette.primary.main, 0.4)}`,
      })}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip label={statusLabel} color={statusColor} size="small" />
        {dirty && <Chip label="Unsaved changes" size="small" variant="outlined" />}
        <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => setPreviewOpen(true)}>
          Preview
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<SaveIcon />}
          disabled={saving || pendingReview}
          onClick={handleSave}
          sx={unsavedChangesBlinkSx(dirty && !saving && !pendingReview)}
        >
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
        {status === "draft" && (
          <Button size="small" color="error" startIcon={<DeleteIcon />} disabled={deleting} onClick={() => void handleDelete()}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        )}
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
      {deleteError && (
        <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }} onClose={() => setDeleteError(null)}>
          {deleteError}
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
