import { useState, type KeyboardEvent } from "react";
import { Box, IconButton, TextField } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useAiChatStore } from "../../store/aiChatStore";

/** Multiline input pinned to the bottom of AIChatPanel — Enter sends,
 * Shift+Enter inserts a newline, disabled while a request is in flight. No
 * streaming (out of scope per the plan), so "loading" just means "waiting
 * for the one-shot POST /ai/chat response." */
export function AIChatInput({ loading }: { loading: boolean }) {
  const sendMessage = useAiChatStore((s) => s.sendMessage);
  const [text, setText] = useState("");

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
      />
      <IconButton color="primary" onClick={handleSend} disabled={loading || !text.trim()} aria-label="Send message">
        <SendIcon />
      </IconButton>
    </Box>
  );
}
