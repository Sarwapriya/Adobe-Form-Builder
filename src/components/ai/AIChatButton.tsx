import { AvatarGroup, Box, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useAiChatStore } from "../../store/aiChatStore";
import { AiBotAvatar } from "./AiBotAvatar";
import { AiPersonAvatar } from "./AiPersonAvatar";

/**
 * Floating widget bubble for the AI Assistant — shown whenever the panel is
 * minimized (AppLayout.tsx renders it on every page, not just the two form
 * editors). Pairs a bot avatar with a person avatar (no real photo is
 * fabricated here — AiPersonAvatar is a stock illustrated glyph standing in
 * for "someone is available to help"). Deliberately loud — a solid
 * primary→secondary gradient pill (matching AiBotAvatar's own gradient,
 * the sidebar's active-item pill, and PageHeader's icon badges) plus a
 * wider double pulse ring, rather than a neutral bgcolor="background.paper"
 * chip that blended into the corner. Clicking it re-opens the panel with
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
          gap: 1.25,
          border: `1px solid ${alpha("#ffffff", 0.35)}`,
          cursor: "pointer",
          borderRadius: 999,
          pl: 0.75,
          pr: 2.25,
          py: 0.85,
          backgroundImage: `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.secondary.main} 100%)`,
          color: "#fff",
          boxShadow: `0 6px 20px ${alpha(t.palette.primary.main, 0.55)}`,
          "@keyframes aiChatPulse": {
            "0%": {
              boxShadow: `0 6px 20px ${alpha(t.palette.primary.main, 0.55)}, 0 0 0 0 ${alpha(t.palette.secondary.main, 0.6)}`,
            },
            "70%": {
              boxShadow: `0 6px 20px ${alpha(t.palette.primary.main, 0.55)}, 0 0 0 18px ${alpha(t.palette.secondary.main, 0)}`,
            },
            "100%": {
              boxShadow: `0 6px 20px ${alpha(t.palette.primary.main, 0.55)}, 0 0 0 0 ${alpha(t.palette.secondary.main, 0)}`,
            },
          },
          animation: "aiChatPulse 2s ease-out infinite",
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          transition: "transform 0.15s ease",
          "&:hover": { transform: "scale(1.04)", boxShadow: `0 8px 26px ${alpha(t.palette.primary.main, 0.7)}` },
        })}
      >
        <AvatarGroup
          max={2}
          sx={{ "& .MuiAvatar-root": { width: 34, height: 34, fontSize: 15, borderWidth: 2, borderColor: "#fff" } }}
        >
          <AiPersonAvatar size={34} />
          <AiBotAvatar size={34} />
        </AvatarGroup>
        <Typography variant="body2" fontWeight={800} sx={{ whiteSpace: "nowrap", letterSpacing: 0.2 }}>
          AI Assistant
        </Typography>
      </Box>
    </Tooltip>
  );
}
