import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Chip, Paper, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SaveIcon from "@mui/icons-material/Save";
import PublishIcon from "@mui/icons-material/Publish";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { downloadFormZip } from "../../api/formBuilderApi";
import { ApiError } from "../../api/apiClient";
import { downloadBlob } from "../../utils/download";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { useSaveShortcut } from "../../hooks/useSaveShortcut";
import { unsavedChangesBlinkSx } from "./unsavedChangesBlinkSx";
import { FormBuilderPreviewDialog } from "./FormBuilderPreviewDialog";

const STATUS_COLOR = { draft: "default", published: "success", unpublished: "warning" } as const;

/** Preview / Save Draft / Publish / Unpublish / Download / Delete — the standard
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
 * status check blocks either case.
 *
 * Download only ever appears once `status === "published"` — same condition
 * gating Unpublish — because that's exactly when the backend has a published
 * `FormVersion` with real generated files on disk to zip (formBuilderService's
 * `buildFormZip`/`publishForm`; an ad-hoc form reaches "published" the moment
 * an admin approves it via AdHocReviewPanel, which calls publishForm directly).
 * A draft or unpublished form has nothing generated to download.
 *
 * This bar's own "Publish" button always says "Publish" — it's how an admin
 * pushes their *own* edits (made directly in this editor) live for subsidiary
 * users to see, first time or the hundredth time. That's a distinct action
 * from ContributionReviewPanel's own button just above this bar, which only
 * ever appears once there's an *approved subsidiary contribution* waiting to
 * go live and is labeled "Deploy" specifically — admins were confusing the
 * two when both said "Publish" in two places on the same page. See that
 * component's own doc comment for the full reasoning.
 *
 * While there's an approved-but-not-live contribution and the admin hasn't
 * touched anything else since (`!dirty`), this Publish button is disabled —
 * ContributionReviewPanel's Deploy button is the one correct action at that
 * point, and having both active invited clicking the wrong one. The moment
 * the admin edits anything themselves (`dirty` flips true again), Publish
 * re-enables and ContributionReviewPanel hides its own Deploy button (see
 * that component) — from then on there's a real edit of the admin's own on
 * top of the merged contribution, so Publish is once again the one action
 * that covers everything in the current draft. */
export function BuilderActionBar() {
  const navigate = useNavigate();
  const formId = useFormBuilderStore((s) => s.formId);
  const status = useFormBuilderStore((s) => s.status);
  const origin = useFormBuilderStore((s) => s.origin);
  const name = useFormBuilderStore((s) => s.name);
  const dirty = useFormBuilderStore((s) => s.dirty);
  const contributions = useFormBuilderStore((s) => s.contributions);
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
  const [noticeSeverity, setNoticeSeverity] = useState<"success" | "warning">("success");
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // An approved contribution the admin hasn't deployed yet — see this
  // component's own doc comment for why this disables Publish specifically
  // while there are no further edits of the admin's own on top of it.
  const hasAwaitingContribution = contributions.some((c) => c.status === "approved" && !c.publishedAt);

  async function handleSave() {
    setNotice(null);
    const ok = await saveDraft();
    if (ok) {
      setNoticeSeverity("success");
      setNotice("Draft saved.");
    }
  }

  useSaveShortcut(() => void handleSave(), dirty && !saving);

  async function handlePublish() {
    setNotice(null);
    const result = await publish();
    if (result.ok) {
      if (result.deployment && !result.deployment.ok) {
        setNoticeSeverity("warning");
        setNotice(
          `Published. SFTP delivery to the campaign server failed (${result.deployment.error}) — this is expected off the office network; retry once connected.`,
        );
      } else {
        setNoticeSeverity("success");
        setNotice("Published.");
      }
    }
  }

  async function handleUnpublish() {
    if (!window.confirm("Unpublish this form? Its preview/download links will stop working until it's published again.")) return;
    setNotice(null);
    const ok = await unpublish();
    if (ok) {
      setNoticeSeverity("success");
      setNotice("Unpublished.");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this form? This can't be undone.")) return;
    setNotice(null);
    setDeleting(true);
    const ok = await deleteForm();
    setDeleting(false);
    if (ok) navigate(origin === "adhoc" ? "/admin/form-builder/adhoc" : "/admin/form-builder/hr");
  }

  async function handleDownload() {
    if (!formId) return;
    setDownloadError(null);
    setDownloading(true);
    try {
      const blob = await downloadFormZip(formId);
      const safeName = (name || "form").replace(/[^a-zA-Z0-9._-]+/g, "-");
      downloadBlob(blob, `${safeName}.zip`);
    } catch (err) {
      setDownloadError(err instanceof ApiError ? err.message : "Download failed");
    } finally {
      setDownloading(false);
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
        // The page's own cards use theme.ts's default flat elevation-0 Paper
        // (see MuiPaper overrides) so this sticky action toolbar needs its own,
        // stronger treatment to actually read as a distinct, floating bar
        // rather than blending into the page behind it — a real drop shadow
        // (via the `elevation` prop above) plus an accent-tinted border.
        border: `1px solid ${alpha(t.palette.primary.main, 0.4)}`,
      })}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip label={status} color={STATUS_COLOR[status]} size="small" />
        {dirty && <Chip label="Unsaved changes" size="small" variant="outlined" />}
        <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => setPreviewOpen(true)}>
          Preview
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<SaveIcon />}
          disabled={saving}
          onClick={handleSave}
          sx={unsavedChangesBlinkSx(dirty && !saving)}
        >
          {saving ? "Saving..." : "Save Draft"}
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<PublishIcon />}
          disabled={publishing || validation.errors.length > 0 || (hasAwaitingContribution && !dirty)}
          onClick={handlePublish}
        >
          {publishing ? "Publishing..." : "Publish"}
        </Button>
        {status === "published" && (
          <Button size="small" color="warning" startIcon={<UnpublishedIcon />} onClick={handleUnpublish}>
            Unpublish
          </Button>
        )}
        {status === "published" && (
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />} disabled={downloading} onClick={() => void handleDownload()}>
            {downloading ? "Downloading..." : "Download"}
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
      {downloadError && (
        <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }} onClose={() => setDownloadError(null)}>
          {downloadError}
        </Alert>
      )}
      {notice && !error && (
        <Alert severity={noticeSeverity} sx={{ mt: 1.5, borderRadius: 2 }} onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      <FormBuilderPreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </Paper>
  );
}
