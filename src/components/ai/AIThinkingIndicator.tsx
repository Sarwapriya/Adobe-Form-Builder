import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { keyframes } from "@mui/system";

/** Claude Code-style glyph cycle, drawn as one twinkling star. */
const GLYPHS = ["·", "✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳", "✢"];

/** Generic "working" verbs — cosmetic only. The chat endpoint answers in one
 * response (no streaming), so the indicator deliberately doesn't claim which
 * step (search, validation, …) the backend is on. */
const VERBS = ["Thinking", "Pondering", "Working", "Reviewing", "Considering", "Composing", "Refining"];

const GLYPH_INTERVAL_MS = 120;
const VERB_INTERVAL_MS = 2400;

const shimmer = keyframes`
  0%   { background-position: 100% 0; }
  100% { background-position: -100% 0; }
`;

/**
 * Shown as an assistant-side row in AIChatPanel while a reply is pending
 * (`aiChatStore.loading`): an animated star, a rotating verb with a shimmer
 * sweep, and seconds elapsed. Motion is dropped for `prefers-reduced-motion`.
 */
export function AIThinkingIndicator() {
  const [tick, setTick] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const glyphTimer = window.setInterval(() => setTick((t) => t + 1), GLYPH_INTERVAL_MS);
    const clockTimer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => {
      window.clearInterval(glyphTimer);
      window.clearInterval(clockTimer);
    };
  }, [startedAt]);

  const glyph = GLYPHS[tick % GLYPHS.length];
  const verb = VERBS[Math.floor((tick * GLYPH_INTERVAL_MS) / VERB_INTERVAL_MS) % VERBS.length];

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label="AI Assistant is working on a reply"
      sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, px: 0.5 }}
    >
      <Box
        component="span"
        aria-hidden
        sx={{
          width: 16,
          textAlign: "center",
          fontSize: 16,
          lineHeight: 1,
          color: "warning.main",
          "@media (prefers-reduced-motion: reduce)": { visibility: "hidden" },
        }}
      >
        {glyph}
      </Box>
      <Typography
        variant="body2"
        aria-hidden
        sx={(theme) => ({
          fontWeight: 600,
          color: "transparent",
          backgroundImage: `linear-gradient(90deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.main} 40%, ${theme.palette.warning.light} 50%, ${theme.palette.warning.main} 60%, ${theme.palette.warning.main} 100%)`,
          backgroundSize: "200% 100%",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          animation: `${shimmer} 2s linear infinite`,
          "@media (prefers-reduced-motion: reduce)": { animation: "none", color: theme.palette.warning.main },
        })}
      >
        {verb}…
      </Typography>
      <Typography variant="caption" color="text.secondary" aria-hidden>
        ({elapsed}s)
      </Typography>
    </Box>
  );
}
