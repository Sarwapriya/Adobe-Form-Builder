import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type { ContinueWorkingItem } from "../../api/subsidiaryFormsApi";

/** The mockup's "Continue Working" cards showed a fabricated % complete —
 * there's no real completeness metric, so this shows an honest validation
 * status (from `validateFormDefinition`) instead. */
export function ContinueWorkingCard({ item }: { item: ContinueWorkingItem }) {
  const ready = item.issueCount === 0;
  return (
    <Paper variant="outlined" sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={700} noWrap>
          {item.name}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Last edited {new Date(item.updatedAt).toLocaleDateString()}
        </Typography>
      </Box>
      <Typography variant="caption" fontWeight={700} color={ready ? "success.main" : "warning.main"}>
        {ready ? "Ready to submit" : `${item.issueCount} issue${item.issueCount === 1 ? "" : "s"} to resolve`}
      </Typography>
      <Stack direction="row" alignItems="center" justifyContent="flex-end">
        <Button component={RouterLink} to={`/my-forms/adhoc/${item.id}`} size="small" variant="outlined">
          Continue
        </Button>
      </Stack>
    </Paper>
  );
}
