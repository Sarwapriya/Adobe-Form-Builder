import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Chip, Paper, Stack } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SaveIcon from "@mui/icons-material/Save";
import PublishIcon from "@mui/icons-material/Publish";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import DeleteIcon from "@mui/icons-material/Delete";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { FormBuilderPreviewDialog } from "./FormBuilderPreviewDialog";

const STATUS_COLOR = { draft: "default", published: "success", unpublished: "warning" } as const;

/** Preview / Save Draft / Publish / Unpublish / Delete — the standard
 * setLoading→try/await/catch→finally shape every existing admin manager
 * component in this app follows (see e.g. ProjectCodeManager.tsx). Delete works
 * unconditionally, regardless of status/origin/pendingReview — an admin can
 * delete any form (HR-initiated or ad-hoc, draft/published/pending review)
 * directly from here, mirroring what HrFormInitiatorListPage/
 * AdHocFormInitiatorListPage already offer from their own list rows, but
 * previously missing from inside the editor itself (the store's own
 * `deleteForm` action existed but nothing called it). Backend's deleteForm
 * (formBuilderService.ts) already handles both outcomes generically: hard-deletes
 * a never-published form, otherwise soft-deletes (hides) it — no origin or
 * status check blocks either case. */
export function BuilderActionBar() {
  const navigate = useNavigate();
  const status = useFormBuilderStore((s) => s.status);
  const origin = useFormBuilderStore((s) => s.origin);
  const dirty = useFormBuilderStore((s) => s.dirty);
  const saving = useFormBuilderStore((s) => s.saving);
  const publishing = useFormBuilderStore((s) => s.publishing);
  const error = useFormBuilderStore((s) => s.error);
  const validation = useFormBuilderStore((s) => s.validation);
  const saveDraft = useFormBuilderStore((s) => s.saveDraft);
  const publish = useFormBuilderStore((s) => s.publish);
  const unpublish = useFormBuilderStore((s) => s.unpublish);
  const deleteForm = useFormBuilderStore((s) => s.deleteForm);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setNotice(null);
    const ok = await saveDraft();
    if (ok) setNotice("Draft saved.");
  }

  async function handlePublish() {
    setNotice(null);
    const result = await publish();
    if (result.ok) setNotice("Published.");
  }

  async function handleUnpublish() {
    if (!window.confirm("Unpublish this form? Its preview/download links will stop working until it's published again.")) return;
    setNotice(null);
    const ok = await unpublish();
    if (ok) setNotice("Unpublished.");
  }

  async function handleDelete() {
    if (!window.confirm("Delete this form? This can't be undone.")) return;
    setNotice(null);
    setDeleting(true);
    const ok = await deleteForm();
    setDeleting(false);
    if (ok) navigate(origin === "adhoc" ? "/admin/form-builder/adhoc" : "/admin/form-builder/hr");
  }

  return (
    <Paper sx={{ p: 2, borderRadius: 3, position: "sticky", bottom: 16 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip label={status} color={STATUS_COLOR[status]} size="small" />
        {dirty && <Chip label="Unsaved changes" size="small" variant="outlined" />}
        <Button size="small" startIcon={<VisibilityIcon />} onClick={() => setPreviewOpen(true)}>
          Preview
        </Button>
        <Button size="small" variant="outlined" startIcon={<SaveIcon />} disabled={saving} onClick={handleSave}>
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<PublishIcon />}
          disabled={publishing || validation.errors.length > 0}
          onClick={handlePublish}
        >
          {publishing ? "Publishing..." : "Publish"}
        </Button>
        {status === "published" && (
          <Button size="small" color="warning" startIcon={<UnpublishedIcon />} onClick={handleUnpublish}>
            Unpublish
          </Button>
        )}
        <Button size="small" color="error" startIcon={<DeleteIcon />} disabled={deleting} onClick={() => void handleDelete()}>
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </Stack>
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
