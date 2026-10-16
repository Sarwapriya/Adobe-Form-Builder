import { Avatar } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { AI_ACCENT } from "../../app/theme";

/**
 * The AI Assistant's own avatar — a solid badge in the app's dedicated AI
 * purple accent (AI_ACCENT, theme.ts — same for every role, since the AI
 * experience itself doesn't vary by role) with a sparkle glyph, used instead
 * of a generic robot icon so the bubble/header reads distinctly as "AI"
 * rather than "a bot." Shared by AIChatButton (minimized widget) and
 * AIChatPanel (open header) so both show the same mark.
 */
export function AiBotAvatar({ size = 30 }: { size?: number }) {
  return (
    <Avatar sx={{ width: size, height: size, backgroundColor: AI_ACCENT.main }}>
      <AutoAwesomeIcon sx={{ fontSize: size * 0.55, color: "#fff" }} />
    </Avatar>
  );
}
