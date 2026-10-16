import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { BuilderConfig, FormDefinition } from "@formbuilder/shared";
import { ApiError } from "../../api/apiClient";
import { createTemplate, type TemplateScope } from "../../api/templatesApi";
import { listSubsidiaries, type Subsidiary } from "../../api/subsidiariesApi";
import { isAdminRole, useAuthStore } from "../../auth/authStore";
import { useResponsiveDialogProps } from "../../hooks/useResponsiveDialog";
import { showToast } from "../../store/toastStore";

const SCOPE_OPTIONS: Array<{ value: TemplateScope; label: string; helper: string }> = [
  { value: "USER", label: "Just me", helper: "Only you can see and use this template." },
  { value: "SUBSIDIARY", label: "My subsidiary", helper: "Everyone in your subsidiary can see and use it." },
  { value: "GLOBAL", label: "Every subsidiary", helper: "Every subsidiary can see and use it." },
];

/**
 * "Save as Template" — snapshots whatever is *currently* in the builder
 * (the `definition`/`config` passed in as props, read by the caller from
 * `useFormBuilderStore` at click time) as a new, independent template row.
 * Never touches the form being edited, and never publishes/creates a
 * campaign — purely a template save. Scope options are role-aware: a
 * subsidiary user only ever sees "Just me"/"My subsidiary" (their own
 * subsidiary, not selectable); an admin/superadmin also sees "Every
 * subsidiary" and, for a subsidiary-targeted template, a subsidiary picker.
 * The server re-derives/validates all of this regardless (see
 * `app/routers/templates.py`'s `_resolve_scope`) — this is convenience UI,
 * not the actual authorization boundary.
 */
export function SaveAsTemplateDialog({
  open,
  onClose,
  definition,
  config,
}: {
  open: boolean;
  onClose: () => void;
  definition: FormDefinition | null;
  config: BuilderConfig | null;
}) {
  const responsiveDialogProps = useResponsiveDialogProps();
  const user = useAuthStore((s) => s.user);
  const isAdmin = isAdminRole(user?.role);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [scope, setScope] = useState<TemplateScope>("USER");
  const [targetSubsidiaryName, setTargetSubsidiaryName] = useState("");
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
    setCategory("");
    setScope("USER");
    setTargetSubsidiaryName("");
  }, [open]);

  useEffect(() => {
    if (!open || !isAdmin) return;
    listSubsidiaries().then(setSubsidiaries).catch(() => undefined);
  }, [open, isAdmin]);

  const scopeOptions = isAdmin ? SCOPE_OPTIONS : SCOPE_OPTIONS.filter((o) => o.value !== "GLOBAL");
  const needsTargetSubsidiary = isAdmin && scope === "SUBSIDIARY";
  const canSave = !!name.trim() && !!definition && !!config && (!needsTargetSubsidiary || !!targetSubsidiaryName);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!canSave || !definition || !config) return;
    setSaving(true);
    try {
      await createTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        scope,
        targetSubsidiaryName: needsTargetSubsidiary ? targetSubsidiaryName : undefined,
        definition,
        config,
      });
      showToast("Template saved.", "success");
      onClose();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to save template", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog {...responsiveDialogProps} open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Box component="form" onSubmit={handleSave}>
        <DialogTitle>Save as Template</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Saves the form exactly as it currently looks in the builder, including any unsaved changes, as a new,
              independent template — the form you're editing is untouched.
            </Alert>
            <TextField
              label="Template name"
              size="small"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextField
              label="Description (optional)"
              size="small"
              multiline
              minRows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <TextField
              label="Category (optional)"
              size="small"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <TextField
              select
              label="Who can use this template"
              size="small"
              value={scope}
              onChange={(e) => setScope(e.target.value as TemplateScope)}
            >
              {scopeOptions.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="caption" color="text.secondary">
              {scopeOptions.find((o) => o.value === scope)?.helper}
            </Typography>
            {needsTargetSubsidiary && (
              <TextField
                select
                label="Subsidiary"
                size="small"
                value={targetSubsidiaryName}
                onChange={(e) => setTargetSubsidiaryName(e.target.value)}
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
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!canSave || saving}>
            {saving ? "Saving..." : "Save Template"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
