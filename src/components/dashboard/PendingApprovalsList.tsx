import { alpha, Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ScheduleIcon from "@mui/icons-material/Schedule";
import type { PendingApprovalItem } from "../../api/formBuilderApi";

/** Both a pending ad-hoc-form review and a pending contribution are reviewed
 * from the same place — that form's own editor page (AdHocReviewPanel /
 * ContributionReviewPanel both live on FormBuilderEditorPage). */
export function PendingApprovalsList({ items }: { items: PendingApprovalItem[] }) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nothing waiting on you right now.
      </Typography>
    );
  }
  return (
    <Stack divider={<Box sx={{ borderBottom: 1, borderColor: "divider" }} />}>
      {items.map((item) => (
        <Stack key={`${item.type}-${item.formId}-${item.submittedAt}`} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: (t) => alpha(t.palette.warning.main, 0.14),
              color: "warning.dark",
            }}
          >
            <ScheduleIcon fontSize="small" />
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {item.formName}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {item.subsidiaryId} &middot; {item.type === "adhoc_review" ? "awaiting review" : "contribution pending"} &middot;{" "}
              {new Date(item.submittedAt).toLocaleDateString()}
            </Typography>
          </Box>
          <Button component={RouterLink} to={`/admin/form-builder/${item.formId}`} size="small" variant="outlined" sx={{ flexShrink: 0 }}>
            Review
          </Button>
        </Stack>
      ))}
    </Stack>
  );
}
