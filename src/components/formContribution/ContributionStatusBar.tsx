import { Box, Stack, Typography } from "@mui/material";
import type { ContributionProgress } from "../../api/formBuilderApi";

const STAGES = ["Submitted", "Reviewed by admin", "Admin approved", "Published"] as const;

/** How many of the 4 stages are complete for a non-rejected contribution.
 * `reviewedAt` and `status === "approved"` both flip on at the same moment (the
 * admin's single "Approve" click), so the bar jumps from stage 1 to stage 3 in one
 * step, then only reaches stage 4 once a later, separate "Publish" click actually
 * carries it live (see formBuilderService.publishForm stamping `publishedAt`). */
function stagesComplete(progress: ContributionProgress): number {
  if (progress.publishedAt) return 4;
  if (progress.status === "approved") return 3;
  if (progress.reviewedAt) return 2;
  return 1;
}

/**
 * A 4-stage status bar for a subsidiary user's latest submission against a form:
 * Submitted → Reviewed by admin → Admin approved → Published. The track fills
 * left-to-right with a gradient as each stage completes. A rejected contribution
 * doesn't fit this forward progression — the review outright ended rather than
 * just pausing partway — so it renders as a fully reset, outlined-red bar instead
 * of a partial gradient fill.
 */
export function ContributionStatusBar({ progress }: { progress: ContributionProgress }) {
  const rejected = progress.status === "rejected";
  const completed = rejected ? 0 : stagesComplete(progress);
  const percent = (completed / STAGES.length) * 100;

  return (
    <Box sx={{ width: "100%" }}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="caption" color={rejected ? "error" : "text.secondary"}>
          {rejected ? "Rejected — resubmit to restart review" : STAGES[completed - 1]}
        </Typography>
        <Typography variant="caption" fontWeight={700} color={rejected ? "error" : "primary"}>
          {rejected ? "0%" : `${Math.round(percent)}%`}
        </Typography>
      </Stack>
      <Box
        sx={{
          width: "100%",
          height: 8,
          borderRadius: 4,
          overflow: "hidden",
          bgcolor: "action.hover",
          ...(rejected && { border: "1.5px solid", borderColor: "error.main", bgcolor: "transparent" }),
        }}
      >
        {!rejected && (
          <Box
            sx={{
              width: `${percent}%`,
              height: "100%",
              borderRadius: 4,
              background: "linear-gradient(90deg, rgb(255, 152, 0) 0%, rgb(33, 150, 243) 55%, rgb(76, 175, 80) 100%)",
              transition: "width 0.3s ease",
            }}
          />
        )}
      </Box>
    </Box>
  );
}
