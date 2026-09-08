import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import LockIcon from "@mui/icons-material/Lock";

export type FormStatusTone = "draft" | "pending" | "approved" | "rejected" | "locked";

/** Literal RGB values, not MUI's theme `success`/`warning`/`error` tokens — a
 * subsidiary user should be able to tell a form's state at a glance without
 * reading the label, so each tone gets its own clearly distinct, saturated
 * color rather than the app's usual muted palette. Text color is picked per
 * tone for contrast (amber needs a dark foreground; the rest are dark enough
 * backgrounds for white text). */
const TONE_STYLE: Record<FormStatusTone, { bg: string; fg: string; icon: ReactNode }> = {
  draft: { bg: "rgb(100, 116, 139)", fg: "rgb(255, 255, 255)", icon: <EditNoteIcon fontSize="small" /> },
  pending: { bg: "rgb(245, 158, 11)", fg: "rgb(41, 26, 3)", icon: <HourglassTopIcon fontSize="small" /> },
  approved: { bg: "rgb(22, 163, 74)", fg: "rgb(255, 255, 255)", icon: <CheckCircleIcon fontSize="small" /> },
  rejected: { bg: "rgb(220, 38, 38)", fg: "rgb(255, 255, 255)", icon: <CancelIcon fontSize="small" /> },
  locked: { bg: "rgb(37, 99, 235)", fg: "rgb(255, 255, 255)", icon: <LockIcon fontSize="small" /> },
};

/**
 * Full-width colored status strip for a subsidiary user's own forms —
 * shown at the top of both MyAdHocFormEditorPage (their own ad-hoc campaign)
 * and MyFormTranslatePage (translating/extending an HR-initiated one), so
 * "what state is this form in" is visible immediately, not just as a small
 * chip buried lower on the page. Purely presentational — callers compute
 * `tone`/`label`/`description` from their own store's status fields.
 */
export function FormStatusBar({ tone, label, description }: { tone: FormStatusTone; label: string; description?: string }) {
  const style = TONE_STYLE[tone];
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1,
        mb: 2,
        borderRadius: 2,
        backgroundColor: style.bg,
        color: style.fg,
      }}
    >
      <Box sx={{ display: "flex", color: "inherit" }}>{style.icon}</Box>
      <Typography variant="subtitle2" fontWeight={700} sx={{ color: "inherit" }}>
        {label}
      </Typography>
      {description && (
        <Typography variant="caption" sx={{ color: "inherit", opacity: 0.9 }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}
