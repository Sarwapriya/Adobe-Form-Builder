import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { ApiError } from "../../api/apiClient";
import { listSubsidiaries, type Subsidiary } from "../../api/subsidiariesApi";
import { getTemplateDetail, listTemplates, type TemplateDetail, type TemplateSummary } from "../../api/templatesApi";
import { useResponsiveDialogProps } from "../../hooks/useResponsiveDialog";
import { showToast } from "../../store/toastStore";
import { SubsidiaryLogo } from "../common/SubsidiaryLogo";
import { TemplatePreviewDialog } from "./TemplatePreviewDialog";

const SCOPE_LABEL: Record<TemplateSummary["scope"], string> = {
  USER: "Personal",
  SUBSIDIARY: "Subsidiary",
  GLOBAL: "Global",
};

/**
 * "Use Existing Template" step for a New Form dialog — a searchable list of
 * every template visible to the caller (server-filtered, see
 * `app/routers/templates.py`'s own visibility rules — nothing client-side
 * hides anything here), with a Preview action and a Use action. `onUse`
 * hands back the chosen template's summary; the caller (one of the three
 * "New Form" dialogs) is responsible for actually creating the form with
 * `copyFromTemplateId: template.id` — this dialog never creates anything
 * itself.
 */
export function TemplatePickerDialog({
  open,
  onClose,
  onUse,
}: {
  open: boolean;
  onClose: () => void;
  onUse: (template: TemplateSummary) => void;
}) {
  const responsiveDialogProps = useResponsiveDialogProps();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateDetail | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([listTemplates(), listSubsidiaries()])
      .then(([t, s]) => {
        setTemplates(t);
        setSubsidiaries(s);
      })
      .catch((err) => showToast(err instanceof ApiError ? err.message : "Failed to load templates", "error"))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = templates.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q) ||
      (t.category ?? "").toLowerCase().includes(q)
    );
  });

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

  return (
    <>
      <Dialog {...responsiveDialogProps} open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ flexGrow: 1 }}>Choose a template</Box>
          <IconButton onClick={onClose} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Search templates by name, description, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2 }}
          />
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : filtered.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {templates.length === 0 ? "No templates available yet." : "No templates match your search."}
            </Typography>
          ) : (
            <Stack spacing={1}>
              {filtered.map((t) => (
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
                        {t.subsidiaryName && (
                          <Chip
                            size="small"
                            variant="outlined"
                            label={t.subsidiaryName}
                            icon={
                              <SubsidiaryLogo
                                subsidiary={subsidiaries.find((s) => s.name === t.subsidiaryName)}
                                size={16}
                              />
                            }
                          />
                        )}
                        {t.category && <Chip size="small" label={t.category} variant="outlined" />}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                        {t.createdByUsername ? `By ${t.createdByUsername} · ` : ""}
                        Updated {new Date(t.updatedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Stack spacing={0.5} sx={{ flexShrink: 0 }}>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon fontSize="small" />}
                        disabled={previewLoadingId === t.id}
                        onClick={() => void handlePreview(t)}
                      >
                        Preview
                      </Button>
                      <Button size="small" variant="contained" onClick={() => onUse(t)}>
                        Use
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
      <TemplatePreviewDialog
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        definition={previewTemplate?.definition ?? null}
        config={previewTemplate?.config ?? null}
      />
    </>
  );
}
