import type { ReactNode } from "react";
import { Box, Stack, Typography, type SxProps, type Theme } from "@mui/material";

/** The bare-icon + subtitle1/700 title (+ optional caption) pattern used at
 * the top of each Configuration sub-panel — previously copy-pasted verbatim
 * into each panel's own JSX. */
export function SectionHeader({
  icon,
  title,
  subtitle,
  action,
  sx,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box sx={sx}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: subtitle ? 0.5 : 1.5 }}>
        {icon}
        <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: action ? 1 : 0 }}>
          {title}
        </Typography>
        {action}
      </Stack>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
