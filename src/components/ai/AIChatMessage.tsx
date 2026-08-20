import { Box, Typography } from "@mui/material";
import type { AiChatMessage as AiChatMessageData } from "../../store/aiChatStore";
import { CampaignReferenceCard } from "./CampaignReferenceCard";

const RTL_TEXT_PATTERN = new RegExp("[\\u0591-\\u07FF\\u200F\\uFB1D-\\uFDFD\\uFE70-\\uFEFC]");

/**
 * Arabic/Hebrew/Syriac/Thaana Unicode-range heuristic for flipping one chat
 * bubble's own text direction. This app has no app-shell-level RTL handling
 * anywhere today, and `src/utils/localeDir.ts` only works from a known
 * *locale code* (e.g. "ar_SA"), not raw freeform chat text — so each bubble
 * independently detects its own content instead of relying on any shared
 * per-page `dir`.
 */
function containsRtlText(text: string): boolean {
  return RTL_TEXT_PATTERN.test(text);
}

/** One chat bubble — user right-aligned/accent color, assistant left-aligned/
 * neutral, plain-text with newlines preserved (no markdown dependency exists
 * in this repo, and none is being added for this feature). Assistant turns
 * that came back with campaign search hits (see aiChatStore.sendMessage)
 * render a CampaignReferenceCard per hit underneath the bubble. */
export function AIChatMessage({
  message,
  onUseAsTemplate,
}: {
  message: AiChatMessageData;
  onUseAsTemplate?: (formId: string) => void;
}) {
  const isUser = message.role === "user";
  const dir = containsRtlText(message.text) ? "rtl" : "ltr";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", mb: 1.5 }}>
      <Box
        dir={dir}
        sx={{
          maxWidth: "88%",
          px: 1.5,
          py: 1,
          borderRadius: 2,
          bgcolor: isUser ? "primary.main" : "action.hover",
          color: isUser ? "primary.contrastText" : "text.primary",
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {message.text}
        </Typography>
      </Box>
      {message.references && message.references.length > 0 && (
        <Box sx={{ mt: 1, width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
          {message.references.map((ref) => (
            <CampaignReferenceCard key={ref.formId} reference={ref} onUseAsTemplate={onUseAsTemplate} />
          ))}
        </Box>
      )}
    </Box>
  );
}
