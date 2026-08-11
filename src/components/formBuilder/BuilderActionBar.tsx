import { useState } from "react";
import { Alert, Button, Chip, Paper, Stack } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SaveIcon from "@mui/icons-material/Save";
import PublishIcon from "@mui/icons-material/Publish";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { FormBuilderPreviewDialog } from "./FormBuilderPreviewDialog";

const STATUS_COLOR = { draft: "default", published: "success", unpublished: "warning" } as const;

/** Preview / Save Draft / Publish / Unpublish — the standard
 * setLoading→try/await/catch→finally shape every existing admin manager
 * component in this app follows (see e.g. ProjectCodeManager.tsx). */
export function BuilderActionBar() {
  const status = useFormBuilderStore((s) => s.status);
  const dirty = useFormBuilderStore((s) => s.dirty);
  const saving = useFormBuilderStore((s) => s.saving);
  const publishing = useFormBuilderStore((s) => s.publishing);
  const error = useFormBuilderStore((s) => s.error);
  const validation = useFormBuilderStore((s) => s.validation);
  const saveDraft = useFormBuilderStore((s) => s.saveDraft);
  const publish = useFormBuilderStore((s) => s.publish);
  const unpublish = useFormBuilderStore((s) => s.unpublish);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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
