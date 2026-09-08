import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Box, IconButton, TextField } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useAiChatStore } from "../../store/aiChatStore";

/** Multiline input pinned to the bottom of AIChatPanel — Enter sends,
 * Shift+Enter inserts a newline, disabled while a request is in flight. No
 * streaming (out of scope per the plan), so "loading" just means "waiting
 * for the one-shot POST /ai/chat response." */
export function AIChatInput({ loading }: { loading: boolean }) {
  const sendMessage = useAiChatStore((s) => s.sendMessage);
  const open = useAiChatStore((s) => s.open);
  const [text, setText] = useState("");
  // The actual <textarea> DOM node (multiline TextField) — must be wired via
  // TextField's `inputRef` prop, not `ref` (which would instead point at the
  // MUI root wrapper <div>, whose .focus() is a no-op on a non-focusable
  // element — the bug this fixes: focus was never actually restored).
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Restore focus to the input once the request finishes — disabled={loading}
  // removes focus when it flips true, so we put it back when it flips false,
  // letting the user keep typing without clicking back into the box. Also
  // re-focuses whenever the panel itself is (re)opened — AIChatPanel stays
  // mounted the whole time (AppLayout.tsx just toggles its CSS display), so
  // a plain mount-only effect would only ever fire once and never again after
  // minimizing/reopening.
  useEffect(() => {
    if (open && !loading) {
      inputRef.current?.focus();
    }
  }, [open, loading]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setText("");
    void sendMessage(trimmed);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, p: 1.5 }}>
      <TextField
        size="small"
        fullWidth
        multiline
        maxRows={4}
        placeholder="Ask the AI assistant..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        inputRef={inputRef}
      />
      <IconButton color="primary" onClick={handleSend} disabled={loading || !text.trim()} aria-label="Send message">
        <SendIcon />
      </IconButton>
    </Box>
  );
}
