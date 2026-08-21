import { Avatar } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

/**
 * The AI Assistant's own avatar — a gradient badge (theme's primary→secondary,
 * so it matches whichever role palette is active, see theme.ts) with a
 * sparkle glyph, used instead of a generic robot icon so the bubble/header
 * reads distinctly as "AI" rather than "a bot." Shared by AIChatButton
 * (minimized widget) and AIChatPanel (open header) so both show the same mark.
 */
export function AiBotAvatar({ size = 30 }: { size?: number }) {
  return (
    <Avatar
      sx={(t) => ({
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.secondary.main} 100%)`,
      })}
    >
      <AutoAwesomeIcon sx={{ fontSize: size * 0.55, color: "#fff" }} />
    </Avatar>
  );
}
