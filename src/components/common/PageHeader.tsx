import type { ReactNode } from "react";
import { Box, IconButton, Stack, Typography, type SxProps, type Theme } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

/** The 44x44 icon-chip + h4 title + secondary subtitle pattern used at the
 * top of nearly every page in the app — previously copy-pasted verbatim into
 * each page's own JSX. */
export function PageHeader({
  icon,
  title,
  subtitle,
  action,
  onBack,
  backLabel = "Back",
  titleNoWrap = false,
  sx,
}: {
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  titleNoWrap?: boolean;
  sx?: SxProps<Theme>;
}) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3, ...sx }}>
      {onBack && (
        <IconButton onClick={onBack} aria-label={backLabel}>
          <ArrowBackIcon />
        </IconButton>
      )}
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Stack spacing={0.2} sx={{ minWidth: 0, flexGrow: action ? 1 : 0 }}>
        <Typography variant="h4" component="h1" sx={{ lineHeight: 1.1 }} noWrap={titleNoWrap}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
      {action}
    </Stack>
  );
}
