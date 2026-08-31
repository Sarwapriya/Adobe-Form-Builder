import { alpha, Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import type { ActionRequiredItem } from "../../api/subsidiaryFormsApi";

export function ActionRequiredList({ items }: { items: ActionRequiredItem[] }) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nothing needs your attention right now.
      </Typography>
    );
  }
  return (
    <Stack divider={<Box sx={{ borderBottom: 1, borderColor: "divider" }} />}>
      {items.map((item) => (
        <Stack key={item.id} direction="row" alignItems="flex-start" spacing={1.5} sx={{ py: 1.75 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1.5,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: (t) => alpha(t.palette.error.main, 0.14),
              color: "error.dark",
            }}
          >
            <ErrorOutlineIcon fontSize="small" />
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700}>
              {item.name} &mdash; changes requested
            </Typography>
            <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ mt: 0.25 }}>
              &ldquo;{item.reviewNote}&rdquo;
            </Typography>
          </Box>
          <Button component={RouterLink} to={`/my-forms/adhoc/${item.id}`} size="small" variant="outlined" sx={{ flexShrink: 0, alignSelf: "center" }}>
            Edit
          </Button>
        </Stack>
      ))}
    </Stack>
  );
}
