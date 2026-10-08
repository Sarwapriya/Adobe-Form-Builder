import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Button, Chip, CircularProgress, List, ListItemButton, ListItemText, Paper, Stack, TextField, Typography } from "@mui/material";
import CodeIcon from "@mui/icons-material/Code";
import SaveIcon from "@mui/icons-material/Save";
import { PageHeader } from "../components/common/PageHeader";
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
 * it without saving, leaves the form exactly as it was.
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
    void selectFile(fileId);
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
      />

      <Paper sx={{ display: "flex", minHeight: 480, overflow: "hidden" }}>
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
          </Stack>

          <Box sx={{ flex: 1, p: 2, display: "flex", minHeight: 0 }}>
            {loadingContent ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <TextField
                multiline
                fullWidth
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
                InputProps={{
                  sx: {
                    fontFamily: '"Roboto Mono", monospace',
                    fontSize: "0.82rem",
                    alignItems: "flex-start",
                    height: "100%",
                    "& textarea": { height: "100% !important", overflowY: "auto !important" },
                  },
                }}
                sx={{ flex: 1, "& .MuiInputBase-root": { height: "100%" } }}
              />
            )}
          </Box>

          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: "divider" }}>
            <Button size="small" disabled={!dirty || saving} onClick={discard}>
              Discard
            </Button>
            <Button size="small" variant="contained" startIcon={<SaveIcon />} disabled={!dirty || saving} onClick={() => void handleSave()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </Stack>
        </Box>
      </Paper>
      {confirmDialog}
    </Box>
  );
}
