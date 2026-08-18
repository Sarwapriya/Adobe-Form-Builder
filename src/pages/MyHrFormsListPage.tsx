import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import TranslateIcon from "@mui/icons-material/Translate";
import EditOffIcon from "@mui/icons-material/EditOff";
import { ApiError } from "../api/apiClient";
import { listMyForms } from "../api/subsidiaryFormsApi";
import type { FormListItem } from "../api/formBuilderApi";
import { ContributionStatusBar } from "../components/formContribution/ContributionStatusBar";
import { PageHeader } from "../components/common/PageHeader";

/**
 * "HR Forms" — the My Forms submenu page listing every currently *published*
 * form an admin created and allocated to this subsidiary (minus any whose
 * project code is blocked, mirroring the same access rule the upload flow
 * already applies — see backend's formAccessService.ts). Read-only here;
 * clicking one opens the Translate & Extend page, the only way a standard
 * user can contribute to it. Split out from the combined My Forms page into
 * its own sidebar submenu entry, alongside the sibling "Ad-hoc Forms" page
 * (MyAdHocFormsListPage).
 */
export function MyHrFormsListPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listMyForms()
      .then(setForms)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load forms");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Box>
      <PageHeader
        icon={<TranslateIcon />}
        title="HR Forms"
        subtitle="Published forms your admin created and allocated to your subsidiary — add translations, questions, or consents for review."
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
            No HR forms are available for your subsidiary yet.
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
                {form.projectCodeLocked && (
                  <Chip icon={<EditOffIcon />} label="Locked" size="small" color="warning" />
                )}
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
