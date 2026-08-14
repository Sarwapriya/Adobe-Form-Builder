import { Box, CircularProgress } from "@mui/material";

/** Centered loading spinner in a padded box — standardizes the various
 * Configuration sub-panels' previously-bare, un-centered `<CircularProgress
 * size={20} />` into one consistent, centered treatment. */
export function LoadingState({ size = 24, py = 3 }: { size?: number; py?: number }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py }}>
      <CircularProgress size={size} />
    </Box>
  );
}
