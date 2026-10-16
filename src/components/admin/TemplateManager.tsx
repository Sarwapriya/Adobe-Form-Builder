import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import { ApiError } from "../../api/apiClient";
import {
  deleteTemplate,
  getTemplateDetail,
  listTemplates,
  updateTemplate,
  type TemplateDetail,
  type TemplateScope,
  type TemplateSummary,
} from "../../api/templatesApi";
import { listSubsidiaries, type Subsidiary } from "../../api/subsidiariesApi";
import { isAdminRole, useAuthStore } from "../../auth/authStore";
import { SectionHeader } from "../common/SectionHeader";
import { LoadingState } from "../common/LoadingState";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { useResponsiveDialogProps } from "../../hooks/useResponsiveDialog";
import { showToast } from "../../store/toastStore";
import { TemplatePreviewDialog } from "../formBuilder/TemplatePreviewDialog";

const SCOPE_LABEL: Record<TemplateScope, string> = { USER: "Personal", SUBSIDIARY: "Subsidiary", GLOBAL: "Global" };

/**
 * Template Management — every template visible to the caller (server-
 * filtered, see `app/routers/templates.py`), with Preview/Edit/Delete.
 * Edit/Delete are only *rendered* for a template this user actually owns
 * (or any template, for a superadmin) — a client-side convenience so no one
 * sees a button that would just 403; the backend enforces the real rule
 * regardless of what this component shows. Mounted both on the admin
 * Configuration page and on a subsidiary user's own "My Templates" page —
 * identical component, since the backend's own visibility rules already
 * produce the right list for either caller.
 */
export function TemplateManager() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = isAdminRole(user?.role);
  const canManage = (t: TemplateSummary) => user?.role === "superadmin" || t.createdByUserId === user?.id;

  const responsiveDialogProps = useResponsiveDialogProps();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [loading, setLoading] = useState(true);

  const [previewTemplate, setPreviewTemplate] = useState<TemplateDetail | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);

  const [editTemplate, setEditTemplate] = useState<TemplateSummary | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editScope, setEditScope] = useState<TemplateScope>("USER");
  const [editTargetSubsidiaryName, setEditTargetSubsidiaryName] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<TemplateSummary | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [rows, subs] = await Promise.all([listTemplates(), isAdmin ? listSubsidiaries() : Promise.resolve([])]);
      setTemplates(rows);
      setSubsidiaries(subs);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to load templates", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePreview(t: TemplateSummary) {
    setPreviewLoadingId(t.id);
    try {
      setPreviewTemplate(await getTemplateDetail(t.id));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to load template", "error");
    } finally {
      setPreviewLoadingId(null);
    }
  }

  function openEdit(t: TemplateSummary) {
    setEditTemplate(t);
    setEditName(t.name);
    setEditDescription(t.description ?? "");
    setEditCategory(t.category ?? "");
    setEditScope(t.scope);
    setEditTargetSubsidiaryName(t.subsidiaryName ?? "");
  }

  const editScopeOptions: TemplateScope[] = isAdmin ? ["USER", "SUBSIDIARY", "GLOBAL"] : ["USER", "SUBSIDIARY"];
  const editNeedsTargetSubsidiary = isAdmin && editScope === "SUBSIDIARY";

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editTemplate || !editName.trim()) return;
    setSaving(true);
    try {
      await updateTemplate(editTemplate.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        category: editCategory.trim() || undefined,
        scope: editScope,
        targetSubsidiaryName: editNeedsTargetSubsidiary ? editTargetSubsidiaryName : undefined,
      });
      setEditTemplate(null);
      await refresh();
      showToast("Template updated.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to update template", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      await deleteTemplate(confirmDelete.id);
      setConfirmDelete(null);
      await refresh();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete template", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader
        icon={<ViewModuleIcon fontSize="small" color="primary" />}
        title="Templates"
        subtitle={`Reusable form configurations — saved from the Form Builder's "Save as Template" button, and used from any "New Form" dialog's "Use Existing Template" option.`}
      />

      {loading ? (
        <LoadingState />
      ) : templates.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No templates yet.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {templates.map((t) => (
            <Box key={t.id} sx={{ p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Stack direction="row" alignItems="flex-start" spacing={1}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {t.name}
                  </Typography>
                  {t.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {t.description}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={SCOPE_LABEL[t.scope]} variant="outlined" />
                    {t.subsidiaryName && <Chip size="small" label={t.subsidiaryName} variant="outlined" />}
                    {t.category && <Chip size="small" label={t.category} variant="outlined" />}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    {t.createdByUsername ? `By ${t.createdByUsername} · ` : ""}
                    Updated {new Date(t.updatedAt).toLocaleString()}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon fontSize="small" />}
                    disabled={previewLoadingId === t.id}
                    onClick={() => void handlePreview(t)}
                  >
                    Preview
                  </Button>
                  {canManage(t) && (
                    <>
                      <Button size="small" startIcon={<EditIcon fontSize="small" />} onClick={() => openEdit(t)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon fontSize="small" />}
                        disabled={deletingId === t.id}
                        onClick={() => setConfirmDelete(t)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      <TemplatePreviewDialog
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        definition={previewTemplate?.definition ?? null}
        config={previewTemplate?.config ?? null}
      />

      <Dialog {...responsiveDialogProps} open={!!editTemplate} onClose={() => setEditTemplate(null)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={handleSaveEdit}>
          <DialogTitle>Edit Template</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField label="Template name" size="small" autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} required />
              <TextField
                label="Description (optional)"
                size="small"
                multiline
                minRows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
              <TextField label="Category (optional)" size="small" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
              <TextField
                select
                label="Who can use this template"
                size="small"
                value={editScope}
                onChange={(e) => setEditScope(e.target.value as TemplateScope)}
              >
                {editScopeOptions.map((s) => (
                  <MenuItem key={s} value={s}>
                    {SCOPE_LABEL[s]}
                  </MenuItem>
                ))}
              </TextField>
              {editNeedsTargetSubsidiary && (
                <TextField
                  select
                  label="Subsidiary"
                  size="small"
                  value={editTargetSubsidiaryName}
                  onChange={(e) => setEditTargetSubsidiaryName(e.target.value)}
                  required
                >
                  {subsidiaries.map((s) => (
                    <MenuItem key={s.id} value={s.name}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditTemplate(null)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={!editName.trim() || saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete template"
        message={
          <>
            Delete <strong>{confirmDelete?.name}</strong>? Campaigns already created from it are not affected.
          </>
        }
        confirmLabel="Delete"
        loading={!!confirmDelete && deletingId === confirmDelete.id}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </Paper>
  );
}
