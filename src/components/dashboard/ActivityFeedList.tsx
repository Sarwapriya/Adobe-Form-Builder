import type { ReactNode } from "react";
import { alpha, Box, Stack, Typography } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import type { RecentActivityItem, RecentActivityKind } from "../../api/formBuilderApi";

const KIND_CONFIG: Record<RecentActivityKind, { icon: ReactNode; paletteKey: "info" | "success" | "error" | "warning" }> = {
  submitted_for_review: { icon: <DescriptionIcon fontSize="small" />, paletteKey: "info" },
  published: { icon: <CheckCircleIcon fontSize="small" />, paletteKey: "success" },
  contribution_approved: { icon: <CheckCircleIcon fontSize="small" />, paletteKey: "success" },
  contribution_rejected: { icon: <ErrorOutlineIcon fontSize="small" />, paletteKey: "error" },
  user_created: { icon: <PersonAddAltIcon fontSize="small" />, paletteKey: "warning" },
};

/** A best-effort, synthesized feed — see backend dashboardService.ts's own
 * doc comment (no general audit-log table exists in this app yet). */
export function ActivityFeedList({ items }: { items: RecentActivityItem[] }) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No recent activity.
      </Typography>
    );
  }
  return (
    <Stack divider={<Box sx={{ borderBottom: 1, borderColor: "divider" }} />}>
      {items.map((item, i) => {
        const config = KIND_CONFIG[item.kind];
        return (
          <Stack key={`${item.kind}-${i}`} direction="row" alignItems="flex-start" spacing={1.5} sx={{ py: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: (t) => alpha(t.palette[config.paletteKey].main, 0.14),
                color: `${config.paletteKey}.dark`,
              }}
            >
              {config.icon}
            </Box>
            <Typography variant="body2" fontWeight={700} sx={{ flexGrow: 1, minWidth: 0 }}>
              {item.message}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0, whiteSpace: "nowrap", mt: 0.25 }}>
              {new Date(item.occurredAt).toLocaleDateString()}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
