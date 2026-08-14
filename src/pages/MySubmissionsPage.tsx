import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Chip, CircularProgress, Divider, Paper, Stack, Typography } from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import { ApiError } from "../api/apiClient";
import {
  listMyAllContributions,
  CONTRIBUTION_STATUS_LABEL,
  type ContributionStatus,
  type ContributionSummaryWithForm,
} from "../api/subsidiaryFormsApi";
import { PageHeader } from "../components/common/PageHeader";

const STATUS_COLOR: Record<ContributionStatus, "default" | "success" | "error"> = {
  pending: "default",
  approved: "success",
  rejected: "error",
};

function describeContent(c: ContributionSummaryWithForm): string {
  const parts: string[] = [];
  if (c.content.translations.length > 0) parts.push(`${c.content.translations.length} translation${c.content.translations.length === 1 ? "" : "s"}`);
  if (c.content.newQuestions.length > 0) parts.push(`${c.content.newQuestions.length} new question${c.content.newQuestions.length === 1 ? "" : "s"}`);
  if (c.content.newConsents.length > 0) parts.push(`${c.content.newConsents.length} new consent${c.content.newConsents.length === 1 ? "" : "s"}`);
  return parts.length > 0 ? parts.join(" · ") : "No changes";
}

/**
 * Cross-form history of every contribution this subsidiary user has ever
 * submitted — pending, approved, and rejected alike, newest first. The per-form
 * Translate & Extend page (MyFormTranslatePage) only shows that one form's own
 * "Your submissions" list; this is the consolidated view so a user doesn't have
 * to remember which form a past (especially rejected) submission belonged to in
 * order to check its review note.
 */
export function MySubmissionsPage() {
  const navigate = useNavigate();
  const [contributions, setContributions] = useState<ContributionSummaryWithForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listMyAllContributions()
      .then((result) => {
        if (!cancelled) setContributions(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load submissions");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Maps each formId to the id of its latest (first-seen, since the list is sorted
  // newest-first) contribution — used below to tell an editable "latest" row apart
  // from a superseded, read-only-history one for the same form.
  const firstIndexByForm = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of contributions) {
      if (!map.has(c.formId)) map.set(c.formId, c.id);
    }
    return map;
  }, [contributions]);

  return (
    <Box>
      <PageHeader
        icon={<HistoryIcon />}
        title="My Submissions"
        subtitle="Every translation/question/consent you've submitted for review, across all forms."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <CircularProgress size={24} />
      ) : contributions.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            You haven't submitted anything yet — open a form from "My Forms" to propose translations, questions, or
            consents.
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Stack spacing={1.5} divider={<Divider />}>
            {contributions.map((c) => {
              // The list is globally sorted newest-first, so the first row seen for a
              // given formId is that form's latest submission. Only the latest one is
              // ever editable — MyFormTranslatePage/formContributionStore only ever
              // prefill a rejected *latest* contribution for revising; an older,
              // superseded submission for the same form can never be picked back up
              // (the backend never lets a contribution be edited either — only new
              // ones get created). Reflect that here: superseded rows are shown for
              // record-keeping only, not as something to click into.
              const isLatestForForm = firstIndexByForm.get(c.formId) === c.id;
              const isSuperseded = !isLatestForForm;
              return (
                <Box
                  key={c.id}
                  sx={{ cursor: isSuperseded ? "default" : "pointer", opacity: isSuperseded ? 0.6 : 1 }}
                  onClick={isSuperseded ? undefined : () => navigate(`/my-forms/${c.formId}`)}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ flexGrow: 1 }} noWrap>
                      {c.formName}
                    </Typography>
                    {isSuperseded && <Chip label="Superseded" size="small" variant="outlined" />}
                    <Chip label={CONTRIBUTION_STATUS_LABEL[c.status]} size="small" color={STATUS_COLOR[c.status]} />
                  </Stack>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {describeContent(c)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    Submitted {new Date(c.submittedAt).toLocaleString()}
                    {c.reviewedAt ? ` · reviewed ${new Date(c.reviewedAt).toLocaleString()}` : ""}
                  </Typography>
                  {c.note && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      Your note: {c.note}
                    </Typography>
                  )}
                  {c.reviewNote && (
                    <Typography
                      variant="caption"
                      sx={{ display: "block" }}
                      color={c.status === "rejected" ? "error" : "text.secondary"}
                    >
                      Review note: {c.reviewNote}
                    </Typography>
                  )}
                  {isSuperseded && c.status === "rejected" && (
                    <Typography variant="caption" sx={{ display: "block", fontStyle: "italic" }} color="text.secondary">
                      Superseded by a later submission — this one can no longer be revised.
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}

