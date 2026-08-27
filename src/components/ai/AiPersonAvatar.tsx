import { Avatar } from "@mui/material";
import aiAvatarImg from "../../assets/aiAvatar.jpg";

/**
 * The "someone's available to help" half of AIChatButton's paired avatars
 * (see AiBotAvatar for the AI half) — a user-supplied headshot, bundled
 * locally (src/assets/aiAvatar.jpg) rather than hotlinked, so this doesn't
 * depend on a third-party CDN staying up. The green ring matches the visual
 * reference this was asked to follow.
 */
export function AiPersonAvatar({ size = 30 }: { size?: number }) {
  return (
    <Avatar
      src={aiAvatarImg}
      alt="AI Assistant"
      sx={{
        width: size,
        height: size,
        outline: "2px solid #22c55e",
        outlineOffset: "1px",
      }}
    />
  );
}
