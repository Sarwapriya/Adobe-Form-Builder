import { AvatarGroup, Box, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useAiChatStore } from "../../store/aiChatStore";
import { AI_ACCENT } from "../../app/theme";
import { AiBotAvatar } from "./AiBotAvatar";
import { AiPersonAvatar } from "./AiPersonAvatar";

/**
 * Floating widget bubble for the AI Assistant — shown whenever the panel is
 * minimized (AppLayout.tsx renders it on every page, not just the two form
 * editors). Pairs a bot avatar with a person avatar (no real photo is
 * fabricated here — AiPersonAvatar is a stock illustrated glyph standing in
 * for "someone is available to help"). Uses the app's dedicated AI purple
 * accent (AI_ACCENT, theme.ts) rather than the role-based primary/secondary
 * colors — the AI experience is identical for every role, and this app's
 * design brief calls for "subtle purple accents" specifically for AI
 * surfaces. A single-tone fill plus a restrained pulse ring (toned down
 * from a two-color gradient glow) keeps it noticeable without being loud.
 * Clicking it re-opens the panel with its conversation exactly as it was
 * left (see AIChatPanel.tsx).
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
          backgroundColor: AI_ACCENT.main,
          color: "#fff",
          boxShadow: `0 4px 14px ${alpha(AI_ACCENT.main, 0.35)}`,
          "@keyframes aiChatPulse": {
            "0%": { boxShadow: `0 4px 14px ${alpha(AI_ACCENT.main, 0.35)}, 0 0 0 0 ${alpha(AI_ACCENT.main, 0.35)}` },
            "70%": { boxShadow: `0 4px 14px ${alpha(AI_ACCENT.main, 0.35)}, 0 0 0 14px ${alpha(AI_ACCENT.main, 0)}` },
            "100%": { boxShadow: `0 4px 14px ${alpha(AI_ACCENT.main, 0.35)}, 0 0 0 0 ${alpha(AI_ACCENT.main, 0)}` },
          },
          animation: "aiChatPulse 2.4s ease-out infinite",
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          transition: "transform 0.15s ease",
          "&:hover": { transform: "scale(1.04)", boxShadow: `0 6px 18px ${alpha(AI_ACCENT.main, 0.45)}` },
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
