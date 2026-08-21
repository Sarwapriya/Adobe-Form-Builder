import { Avatar, AvatarGroup, Box, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import PersonIcon from "@mui/icons-material/Person";
import { useAiChatStore } from "../../store/aiChatStore";
import { AiBotAvatar } from "./AiBotAvatar";

/**
 * Floating widget bubble for the AI Assistant — shown whenever the panel is
 * minimized (AppLayout.tsx renders it on every page, not just the two form
 * editors). Pairs a bot avatar with a person avatar (no real photo is
 * fabricated here — PersonIcon stands in for "someone is available to
 * help") and pulses continuously while minimized so it stays noticeable
 * rather than blending into the corner. Clicking it re-opens the panel with
 * its conversation exactly as it was left (see AIChatPanel.tsx).
 */
export function AIChatButton() {
  const open = useAiChatStore((s) => s.open);
  const toggleOpen = useAiChatStore((s) => s.toggleOpen);

  if (open) return null;

  return (
    <Tooltip title="Chat with the AI Assistant" placement="left">
      <Box
        component="button"
        onClick={toggleOpen}
        aria-label="Open AI Assistant"
        sx={(t) => ({
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: t.zIndex.drawer + 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
          border: "none",
          cursor: "pointer",
          borderRadius: 999,
          pl: 0.75,
          pr: 2,
          py: 0.75,
          bgcolor: "background.paper",
          color: "text.primary",
          boxShadow: 4,
          "@keyframes aiChatPulse": {
            "0%": { boxShadow: `0 0 0 0 ${alpha(t.palette.primary.main, 0.55)}` },
            "70%": { boxShadow: `0 0 0 14px ${alpha(t.palette.primary.main, 0)}` },
            "100%": { boxShadow: `0 0 0 0 ${alpha(t.palette.primary.main, 0)}` },
          },
          animation: "aiChatPulse 2.2s ease-out infinite",
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          "&:hover": { boxShadow: 6 },
        })}
      >
        <AvatarGroup max={2} sx={{ "& .MuiAvatar-root": { width: 30, height: 30, fontSize: 14, borderWidth: 2 } }}>
          <Avatar sx={{ bgcolor: "secondary.main" }}>
            <PersonIcon fontSize="small" />
          </Avatar>
          <AiBotAvatar size={30} />
        </AvatarGroup>
        <Typography variant="caption" fontWeight={700} sx={{ whiteSpace: "nowrap" }}>
          AI Assistant
        </Typography>
      </Box>
    </Tooltip>
  );
}
