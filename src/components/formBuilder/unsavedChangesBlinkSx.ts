import { alpha, type Theme } from "@mui/material/styles";

/**
 * Pulses the Save Draft button's border/text color (theme `warning.main` <->
 * `warning.dark`, so it stays visually consistent with whichever accent —
 * admin's maroon or a subsidiary's blue — the rest of the page is using
 * rather than a hardcoded color) while there's something unsaved, so the eye
 * keeps getting drawn back to it until the user actually saves. Shared by
 * BuilderActionBar/AdHocActionBar so both editors blink identically.
 * `prefers-reduced-motion` disables the animation but keeps the static
 * warning color, so the "something's unsaved" signal doesn't disappear
 * entirely for users who've asked for less motion.
 */
export function unsavedChangesBlinkSx(active: boolean) {
  return (theme: Theme) =>
    active
      ? {
          animation: "unsavedChangesBlink 1.3s ease-in-out infinite",
          "@keyframes unsavedChangesBlink": {
            "0%, 100%": {
              borderColor: theme.palette.warning.main,
              color: theme.palette.warning.main,
              boxShadow: `0 0 0 0 ${alpha(theme.palette.warning.main, 0.35)}`,
            },
            "50%": {
              borderColor: theme.palette.warning.dark,
              color: theme.palette.warning.dark,
              boxShadow: `0 0 0 5px ${alpha(theme.palette.warning.main, 0)}`,
            },
          },
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
            borderColor: theme.palette.warning.main,
            color: theme.palette.warning.main,
          },
        }
      : {};
}
