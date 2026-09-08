import type { KeyboardEvent, ReactNode } from "react";
import { Box, Paper, Typography } from "@mui/material";

/**
 * One stat tile on the Dashboard landing page (Total Campaigns, Draft,
 * Pending Review, ...) — a bare `Paper` picks up the app's own card styling
 * (rounded corners, border, shadow) from the theme automatically, so this
 * only needs to lay out the icon/value/label.
 *
 * Optionally selectable: passing `onClick` turns the tile into a toggle (the
 * admin dashboard uses this to filter the "Subsidiary Activity" chart below
 * to whichever stat is currently selected) — `selected` draws the active
 * ring. Without `onClick` the tile stays a plain, non-interactive stat.
 */
export function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  onClick,
  selected,
}: {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number | string;
  onClick?: () => void;
  selected?: boolean;
}) {
  const interactive = !!onClick;
  return (
    <Paper
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      sx={{
        p: 2.25,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        minWidth: 0,
        cursor: interactive ? "pointer" : undefined,
        outline: "2px solid",
        outlineColor: selected ? "primary.main" : "transparent",
        outlineOffset: -1,
        transition: interactive ? "outline-color 0.15s, box-shadow 0.15s" : undefined,
        "&:hover": interactive ? { boxShadow: 3 } : undefined,
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: iconBg,
          color: iconColor,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h4" fontWeight={700} letterSpacing={-0.5} lineHeight={1}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
    </Paper>
  );
}
