import { useMediaQuery, useTheme } from "@mui/material";

/** Spread onto any `<Dialog>`'s props: makes it full-screen below the "sm"
 * breakpoint (600px) instead of a fixed-maxWidth box with cramped margins on
 * a phone, without touching each dialog's internal content/structure. */
export function useResponsiveDialogProps() {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  return { fullScreen };
}
