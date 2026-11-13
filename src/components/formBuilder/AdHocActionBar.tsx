import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SaveIcon from "@mui/icons-material/Save";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { useSaveShortcut } from "../../hooks/useSaveShortcut";
import { unsavedChangesBlinkSx } from "./unsavedChangesBlinkSx";
import { ApiError } from "../../api/apiClient";
import { deleteAdHocForm } from "../../api/subsidiaryFormsApi";
import { FormBuilderPreviewDialog } from "./FormBuilderPreviewDialog";
import { SaveAsTemplateDialog } from "./SaveAsTemplateDialog";
import { showToast } from "../../store/toastStore";
import { useConfirm } from "../../hooks/useConfirm";
import { useResponsiveDialogProps } from "../../hooks/useResponsiveDialog";

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
  const definition = useFormBuilderStore((s) => s.definition);
  const config = useFormBuilderStore((s) => s.config);
  const dirty = useFormBuilderStore((s) => s.dirty);
  const saving = useFormBuilderStore((s) => s.saving);
  const publishing = useFormBuilderStore((s) => s.publishing);
  const error = useFormBuilderStore((s) => s.error);
  const validation = useFormBuilderStore((s) => s.validation);
  const saveDraft = useFormBuilderStore((s) => s.saveDraft);
  const submitForReview = useFormBuilderStore((s) => s.submitForReview);
  const updateRequest = useFormBuilderStore((s) => s.updateRequest);
  const requestingUpdate = useFormBuilderStore((s) => s.requestingUpdate);
  const requestUpdate = useFormBuilderStore((s) => s.requestUpdate);

  const { confirm, confirmDialog } = useConfirm();
  const responsiveDialogProps = useResponsiveDialogProps();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestNote, setRequestNote] = useState("");

  useEffect(() => {
    if (error) showToast(error, "error");
  }, [error]);

  // An approved, not-yet-consumed update request is the one thing that
  // reopens editing once published — see form_update_request_service.py's
  // own doc comment. A merely "pending" or "rejected" request still leaves
  // the form locked.
  const hasOpenUpdateRequest = updateRequest?.status === "approved";
  const statusLabel = pendingReview ? "Pending review" : status === "published" ? "Published" : "Draft";
  const statusColor = pendingReview ? "warning" : status === "published" ? "success" : "default";
  // Once approved and published, a campaign is final — same locked treatment
  // as "awaiting review" (see MyAdHocFormEditorPage's matching field-selection
  // gate), just for the opposite reason: nothing left to review, not "not yet"
  // — unless an admin-approved update request has reopened it.
  const readOnly = pendingReview || (status === "published" && !hasOpenUpdateRequest);

  async function handleRequestUpdate() {
    const ok = await requestUpdate(requestNote.trim() || undefined);
    if (ok) {
      setRequestOpen(false);
      setRequestNote("");
      showToast("Update request sent.", "success");
    }
  }

  async function handleSave() {
    const ok = await saveDraft();
    if (ok) showToast("Draft saved.", "success");
  }

  useSaveShortcut(() => void handleSave(), dirty && !saving && !readOnly);

  async function handleSubmit() {
    const confirmed = await confirm({
      title: "Submit for review",
      message: "Submit this form for admin review? You won't be able to edit it again until it's reviewed.",
      confirmLabel: "Submit",
      confirmColor: "primary",
    });
    if (!confirmed) return;
    const ok = await submitForReview();
    if (ok) showToast("Submitted for review.", "success");
  }

  async function handleDelete() {
    if (!formId) return;
    const confirmed = await confirm({
      title: "Delete form",
      message: "Delete this form? It's removed from your list — nothing is erased from the database.",
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteAdHocForm(formId);
      navigate("/my-forms/adhoc");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete form", "error");
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
        <Button size="small" variant="outlined" startIcon={<BookmarkAddIcon />} onClick={() => setSaveAsTemplateOpen(true)}>
          Save as Template
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<SaveIcon />}
          disabled={saving || readOnly}
          onClick={handleSave}
          sx={unsavedChangesBlinkSx(dirty && !saving && !readOnly)}
        >
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<SendIcon />}
          disabled={publishing || readOnly || validation.errors.length > 0}
          onClick={handleSubmit}
        >
          {publishing ? "Submitting..." : "Submit for Review"}
        </Button>
        {status === "draft" && (
          <Button size="small" color="error" startIcon={<DeleteIcon />} disabled={deleting} onClick={() => void handleDelete()}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        )}
        {!pendingReview && status === "published" && !hasOpenUpdateRequest && updateRequest?.status !== "pending" && (
          <Button size="small" startIcon={<LockOpenIcon />} onClick={() => setRequestOpen(true)}>
            Request Update
          </Button>
        )}
      </Stack>
      {pendingReview && (
        <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>
          This form is awaiting admin review — editing is locked until it's approved or rejected.
        </Alert>
      )}
      {!pendingReview && status === "published" && hasOpenUpdateRequest && (
        <Alert severity="success" sx={{ mt: 1.5, borderRadius: 2 }}>
          Update approved — editable until you submit for review again.
        </Alert>
      )}
      {!pendingReview && status === "published" && !hasOpenUpdateRequest && updateRequest?.status === "pending" && (
        <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>
          Update request sent — awaiting admin approval.
        </Alert>
      )}
      {!pendingReview && status === "published" && !hasOpenUpdateRequest && updateRequest?.status === "rejected" && (
        <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            Your update request was rejected{updateRequest.reviewNote ? ":" : "."}
          </Typography>
          {updateRequest.reviewNote}
        </Alert>
      )}
      {!pendingReview && status === "published" && !hasOpenUpdateRequest && !updateRequest && (
        <Alert severity="success" sx={{ mt: 1.5, borderRadius: 2 }}>
          This campaign has been approved and published — it can only be viewed from here on. Need a change? Request
          an update.
        </Alert>
      )}
      {!pendingReview && status !== "published" && reviewNote && (
        <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            An admin rejected your last submission:
          </Typography>
          {reviewNote}
        </Alert>
      )}
      <FormBuilderPreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} />
      <SaveAsTemplateDialog
        open={saveAsTemplateOpen}
        onClose={() => setSaveAsTemplateOpen(false)}
        definition={definition}
        config={config}
      />
      <Dialog {...responsiveDialogProps} open={requestOpen} onClose={() => setRequestOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LockOpenIcon color="primary" fontSize="small" />
          Request update
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Let the admin know what you need to change and why — once approved, you can edit this campaign again
            until you submit for review.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label="What do you need to change? (optional)"
            value={requestNote}
            onChange={(e) => setRequestNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRequestOpen(false)} disabled={requestingUpdate}>
            Cancel
          </Button>
          <Button variant="contained" disabled={requestingUpdate} onClick={() => void handleRequestUpdate()}>
            {requestingUpdate ? "Sending..." : "Send Request"}
          </Button>
        </DialogActions>
      </Dialog>
      {confirmDialog}
    </Paper>
  );
}
