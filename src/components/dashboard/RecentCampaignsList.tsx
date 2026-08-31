import { Box, Chip, Stack, Typography } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import type { RecentCampaignItem, SubsidiaryFormBucket } from "../../api/subsidiaryFormsApi";

const BUCKET_CHIP: Record<SubsidiaryFormBucket, { label: string; color: "warning" | "success" | "error" | "default" }> = {
  pendingReview: { label: "Pending Review", color: "warning" },
  published: { label: "Published", color: "success" },
  changesRequested: { label: "Changes Requested", color: "error" },
  draft: { label: "Draft", color: "default" },
};

export function RecentCampaignsList({ items }: { items: RecentCampaignItem[] }) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No campaigns yet — create your first one from My Forms.
      </Typography>
    );
  }
  return (
    <Stack divider={<Box sx={{ borderBottom: 1, borderColor: "divider" }} />}>
      {items.map((item) => {
        const chip = BUCKET_CHIP[item.bucket];
        return (
          <Stack key={item.id} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1.5 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1.5,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "action.hover",
                color: "primary.main",
              }}
            >
              <DescriptionIcon fontSize="small" />
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {item.name}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                Updated {new Date(item.updatedAt).toLocaleDateString()}
              </Typography>
            </Box>
            <Chip size="small" variant="filled" color={chip.color} label={chip.label} />
          </Stack>
        );
      })}
    </Stack>
  );
}
