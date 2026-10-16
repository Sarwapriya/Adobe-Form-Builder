import { Avatar, useTheme } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

/**
 * The AI Assistant's own avatar — a solid badge in the signed-in user's own
 * role color (theme.palette.primary, which createAppTheme already derives
 * from PALETTES per role — deep navy for admin, cyan for subsidiary) with a
 * sparkle glyph, used instead of a generic robot icon so the bubble/header
 * reads distinctly as "AI" rather than "a bot." Shared by AIChatButton
 * (minimized widget) and AIChatPanel (open header) so both show the same
 * mark.
 */
export function AiBotAvatar({ size = 30 }: { size?: number }) {
  const theme = useTheme();
  return (
    <Avatar sx={{ width: size, height: size, backgroundColor: theme.palette.primary.main }}>
      <AutoAwesomeIcon sx={{ fontSize: size * 0.55, color: "#fff" }} />
    </Avatar>
  );
}
