import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import TranslateIcon from "@mui/icons-material/Translate";
import { ApiError } from "../api/apiClient";
import { listMyForms } from "../api/subsidiaryFormsApi";
import type { FormListItem } from "../api/formBuilderApi";
import { ContributionStatusBar } from "../components/formContribution/ContributionStatusBar";
import { PageHeader } from "../components/common/PageHeader";

/**
 * Landing page for a subsidiary-scoped standard user's own view of the Form
 * Initiator — every currently *published* form for their subsidiary (minus any
 * whose project code is blocked, mirroring the same access rule the upload flow
 * already applies — see backend's formAccessService.ts). Read-only here; clicking
 * a form opens the Translate & Extend page, the only way a standard user can
 * contribute to it.
 */
export function MyFormsListPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listMyForms()
      .then((result) => {
        if (!cancelled) setForms(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load forms");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box>
      <PageHeader
        icon={<TranslateIcon />}
        title="My Forms"
        subtitle="Published forms for your subsidiary — add translations, questions, or consents for review."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <CircularProgress size={24} />
      ) : forms.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No published forms are available for your subsidiary yet.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1}>
          {forms.map((form) => (
            <Paper key={form.id} sx={{ p: 2, cursor: "pointer" }} onClick={() => navigate(`/my-forms/${form.id}`)}>
              <Stack direction="row" alignItems="center" gap={2}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {form.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {form.subsidiaryId}
                    {form.projectCode ? ` · ${form.projectCode}` : ""} · Updated {new Date(form.updatedAt).toLocaleString()}
                  </Typography>
                </Box>
                {form.publishedVersionNumber != null && <Chip label={`v${form.publishedVersionNumber}`} size="small" variant="outlined" />}
              </Stack>
              {form.myContributionProgress && (
                <Box sx={{ mt: 1.5, maxWidth: 360 }}>
                  <ContributionStatusBar progress={form.myContributionProgress} />
                </Box>
              )}
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
