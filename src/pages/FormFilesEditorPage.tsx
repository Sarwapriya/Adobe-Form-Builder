import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CodeIcon from "@mui/icons-material/Code";
import SaveIcon from "@mui/icons-material/Save";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import { PageHeader } from "../components/common/PageHeader";
import { CodeEditor, type CodeEditorHandle } from "../components/formBuilder/CodeEditor";
import { QaRunDialog } from "../components/admin/QaRunDialog";
import type { QaRunVariant } from "../api/qaApi";
import { useFormFilesStore } from "../store/formFilesStore";
import { getFormDetail, type FormDetail, type GeneratedFileSummary } from "../api/formBuilderApi";
import { showToast } from "../store/toastStore";
import { useConfirm } from "../hooks/useConfirm";

const TYPE_LABEL: Record<string, string> = {
  html: "HTML",
  js: "Behavior JS",
  "data-js": "Data JS",
  css: "Stylesheet",
};

/**
 * The "Edit Files" window — opened in its own browser tab (see
 * BuilderActionBar.tsx's Edit Files button, `window.open`) per form, never
 * mounted alongside FormBuilderEditorPage. Lists every generated file
 * belonging to the form's *published* version (any type), and lets an admin
 * hand-edit one and save it. Saving overwrites the file on disk in place —
 * Preview, Download and Deploy already read that same file directly
 * (preview_service.py / form_builder_service.py), so nothing else needs to
 * change for the edit to take effect; never opening this page, or opening
 * it without saving, leaves the form exactly as it was. "Run QA" (top
 * right) runs the real Playwright QA suite against the actual saved files
 * (reusing the same in-place preview the Preview button renders) — the one
 * QA path that reflects a hand-edit, since every other QA entry point in
 * the app regenerates from the FormDefinition and never sees one.
 */
export function FormFilesEditorPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormDetail | null>(null);
  const [formLoading, setFormLoading] = useState(true);

  const files = useFormFilesStore((s) => s.files);
  const selectedFileId = useFormFilesStore((s) => s.selectedFileId);
  const content = useFormFilesStore((s) => s.content);
  const originalContent = useFormFilesStore((s) => s.originalContent);
  const loading = useFormFilesStore((s) => s.loading);
  const loadingContent = useFormFilesStore((s) => s.loadingContent);
  const saving = useFormFilesStore((s) => s.saving);
  const error = useFormFilesStore((s) => s.error);
  const load = useFormFilesStore((s) => s.load);
  const selectFile = useFormFilesStore((s) => s.selectFile);
  const setContent = useFormFilesStore((s) => s.setContent);
  const save = useFormFilesStore((s) => s.save);
  const discard = useFormFilesStore((s) => s.discard);
  const reset = useFormFilesStore((s) => s.reset);

  const { confirm, confirmDialog } = useConfirm();
  const dirty = content !== originalContent;
  const [qaDialogOpen, setQaDialogOpen] = useState(false);
  const availableVariants: QaRunVariant[] = form?.published?.config.variants ?? [];

  // CodeMirror owns undo/redo history itself (see CodeEditor.tsx) — these
  // just mirror its current depth so the toolbar buttons know when to
  // enable, and `editorKey` forces a fresh editor instance (fresh history)
  // on every file switch or Discard, so "Undo" can never reach back into a
  // previous file's content or past a just-discarded edit.
  const editorRef = useRef<CodeEditorHandle>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [editorInstance, setEditorInstance] = useState(0);

  useEffect(() => {
    if (!id) return;
    void load(id);
    setFormLoading(true);
    getFormDetail(id)
      .then(setForm)
      .finally(() => setFormLoading(false));
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (error) showToast(error, "error");
  }, [error]);

  async function handleSelect(fileId: string) {
    if (fileId === selectedFileId) return;
    if (dirty) {
      const confirmed = await confirm({
        title: "Discard changes?",
        message: "This file has unsaved changes. Switch files and discard them?",
        confirmLabel: "Discard",
      });
      if (!confirmed) return;
    }
    setCanUndo(false);
    setCanRedo(false);
    void selectFile(fileId);
  }

  function handleDiscard() {
    discard();
    setEditorInstance((n) => n + 1);
    setCanUndo(false);
    setCanRedo(false);
  }

  async function handleSave() {
    const ok = await save();
    if (ok) showToast("File saved.", "success");
  }

  const selectedFile = files.find((f) => f.id === selectedFileId) ?? null;
  const grouped = files.reduce<Record<string, GeneratedFileSummary[]>>((acc, f) => {
    (acc[f.fileType] ??= []).push(f);
    return acc;
  }, {});

  if (formLoading || loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (files.length === 0) {
    return (
      <Box>
        <PageHeader icon={<CodeIcon />} title="Edit Files" subtitle={form?.name} />
        <Typography color="text.secondary">
          This form has no published files yet — publish it first, then come back here to hand-edit the generated output.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        icon={<CodeIcon />}
        title="Edit Files"
        subtitle={
          <>
            {form?.name}
            {form?.projectCode ? ` · ${form.projectCode}` : ""}
          </>
        }
        titleNoWrap
        action={
          <Tooltip title={dirty ? "Tests the last saved version — save your edits first to include them" : ""}>
            <span>
              <Button
                variant="outlined"
                startIcon={<PlayCircleOutlineIcon />}
                disabled={availableVariants.length === 0}
                onClick={() => setQaDialogOpen(true)}
              >
                Run QA
              </Button>
            </span>
          </Tooltip>
        }
      />

      <Paper
        sx={{
          display: "flex",
          // Bounded to the viewport (roughly "below the page header, above
          // the page's own bottom padding") so a long file scrolls inside
          // the editor itself — the Paper's own fixed height, not the whole
          // page growing to fit every line — which is also what keeps the
          // Save/Discard bar at a stable position instead of being pushed
          // far down the page past the floating AI Assistant button.
          height: "calc(100vh - 230px)",
          minHeight: 420,
          overflow: "hidden",
          // Same reservation as BuilderActionBar.tsx — the floating AI
          // Assistant launcher is fixed to every page's bottom-right corner.
          mr: { xs: 0, sm: "220px" },
        }}
      >
        <Box sx={{ width: 260, flexShrink: 0, borderRight: 1, borderColor: "divider", overflowY: "auto" }}>
          {Object.entries(grouped).map(([type, group]) => (
            <Box key={type}>
              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ display: "block", px: 2, pt: 1.5, pb: 0.5, fontSize: "0.68rem", letterSpacing: "0.06em" }}
              >
                {TYPE_LABEL[type] ?? type}
              </Typography>
              <List dense disablePadding>
                {group.map((f) => (
                  <ListItemButton key={f.id} selected={f.id === selectedFileId} onClick={() => void handleSelect(f.id)} sx={{ py: 0.5 }}>
                    <ListItemText primaryTypographyProps={{ fontFamily: "monospace", fontSize: "0.78rem", noWrap: true }} primary={f.fileName} />
                    {f.editedAt && (
                      <Box
                        title="Hand-edited"
                        sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "secondary.main", flexShrink: 0, ml: 1 }}
                      />
                    )}
                  </ListItemButton>
                ))}
              </List>
            </Box>
          ))}
        </Box>

        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="subtitle2" sx={{ fontFamily: "monospace" }} noWrap>
              {selectedFile?.fileName}
            </Typography>
            {selectedFile?.editedAt && (
              <Chip size="small" variant="outlined" label={`edited ${new Date(selectedFile.editedAt).toLocaleString()}`} />
            )}
            {dirty && <Chip size="small" label="Unsaved changes" />}
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Undo (Ctrl+Z)">
              <span>
                <IconButton size="small" disabled={!canUndo} onClick={() => editorRef.current?.undo()}>
                  <UndoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Y)">
              <span>
                <IconButton size="small" disabled={!canRedo} onClick={() => editorRef.current?.redo()}>
                  <RedoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          <Box
            sx={{
              flex: 1,
              m: 2,
              display: "flex",
              minHeight: 0,
              border: 1,
              borderColor: "divider",
              borderRadius: 1.5,
              overflow: "hidden",
            }}
          >
            {loadingContent ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              selectedFile && (
                <CodeEditor
                  key={`${selectedFileId}-${editorInstance}`}
                  ref={editorRef}
                  value={content}
                  fileType={selectedFile.fileType}
                  onChange={setContent}
                  onHistoryChange={(u, r) => {
                    setCanUndo(u);
                    setCanRedo(r);
                  }}
                />
              )
            )}
          </Box>

          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: "divider" }}>
            <Button size="small" disabled={!dirty || saving} onClick={handleDiscard}>
              Discard
            </Button>
            <Button size="small" variant="contained" startIcon={<SaveIcon />} disabled={!dirty || saving} onClick={() => void handleSave()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </Stack>
        </Box>
      </Paper>
      {confirmDialog}
      {id && (
        <QaRunDialog
          subject={{ kind: "published", formId: id }}
          availableVariants={availableVariants}
          open={qaDialogOpen}
          onClose={() => setQaDialogOpen(false)}
        />
      )}
    </Box>
  );
}
