import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Divider, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";
import { useAiChatStore } from "../../store/aiChatStore";
import { AIChatMessage } from "./AIChatMessage";
import { AIChatInput } from "./AIChatInput";
import { AIActionCard } from "./AIActionCard";
import { QuestionSuggestionCard } from "./QuestionSuggestionCard";
import { AiBotAvatar } from "./AiBotAvatar";

/**
 * The floating AI panel's content: header (title + minimize), a scrollable
 * message list, and the input pinned to the bottom (see AppLayout.tsx for
 * where the surrounding floating panel itself is mounted — available on
 * every page, not route-gated). Minimizing just hides the panel behind the
 * AIChatButton bubble again; nothing here is reset, so reopening resumes the
 * conversation exactly where it left off.
 *
 * `AIActionSummary` has no explicit "which tool produced this" discriminator
 * beyond `actionType` — so multiple ADD_QUESTION proposals arriving together
 * in one reply (a SUGGEST_QUESTIONS batch) are told apart from a single
 * plain "add this one question" proposal purely by count: 2+ together read
 * as a suggestion batch (QuestionSuggestionCard + a panel-level "Add All"),
 * while a lone ADD_QUESTION renders through the generic AIActionCard like
 * every other action type.
 */
export function AIChatPanel() {
  const navigate = useNavigate();
  const messages = useAiChatStore((s) => s.messages);
  const pendingActions = useAiChatStore((s) => s.pendingActions);
  const stagedQuestions = useAiChatStore((s) => s.stagedQuestions);
  const loading = useAiChatStore((s) => s.loading);
  const error = useAiChatStore((s) => s.error);
  const formId = useAiChatStore((s) => s.formId);
  const toggleOpen = useAiChatStore((s) => s.toggleOpen);
  const confirmAction = useAiChatStore((s) => s.confirmAction);
  const designForm = useAiChatStore((s) => s.designForm);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pendingActions]);

  const addQuestionActions = pendingActions.filter((a) => a.actionType === "ADD_QUESTION");
  const suggestionGroup = addQuestionActions.length > 1 ? addQuestionActions : [];
  const suggestionIds = new Set(suggestionGroup.map((a) => a.id));
  const otherActions = pendingActions.filter((a) => !suggestionIds.has(a.id));

  const [designName, setDesignName] = useState("");
  const [showDesignForm, setShowDesignForm] = useState(false);

  async function handleAddAll() {
    for (const action of suggestionGroup) {
      await confirmAction(action.id);
    }
  }

  async function handleDesignForm() {
    const result = await designForm(designName);
    if (result) {
      setShowDesignForm(false);
      setDesignName("");
      navigate(result.route);
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.5 }}>
        <AiBotAvatar size={26} />
        <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>
          AI Assistant
        </Typography>
        <Tooltip title="Minimize">
          <IconButton size="small" onClick={toggleOpen} aria-label="Minimize AI Assistant">
            <RemoveIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Divider />

      <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: "auto", px: 2, py: 1.5 }}>
        {messages.length === 0 && pendingActions.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {formId
              ? "Ask about past campaigns, request question suggestions, translations, or edits to this form."
              : "Ask about past campaigns, or open a form to request question suggestions, translations, or edits."}
          </Typography>
        )}

        {messages.map((m) => (
          <AIChatMessage key={m.id} message={m} />
        ))}

        {suggestionGroup.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {suggestionGroup.length} suggested questions
              </Typography>
              <Button size="small" onClick={() => void handleAddAll()}>
                Add All
              </Button>
            </Stack>
            {suggestionGroup.map((action) => (
              <QuestionSuggestionCard key={action.id} action={action} />
            ))}
          </Box>
        )}

        {otherActions.map((action) => (
          <AIActionCard key={action.id} action={action} />
        ))}

        {error && (
          <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
            {error}
          </Typography>
        )}

        {stagedQuestions.length > 0 && !formId && (
          <Box sx={{ mt: 1, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {stagedQuestions.length} question{stagedQuestions.length > 1 ? "s" : ""} ready
              </Typography>
              {showDesignForm ? (
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="outlined" onClick={() => { setShowDesignForm(false); setDesignName(""); }}>
                    Cancel
                  </Button>
                  <Button size="small" variant="contained" onClick={() => void handleDesignForm()} disabled={!designName.trim()}>
                    Create & Design
                  </Button>
                </Stack>
              ) : (
                <Button size="small" variant="contained" onClick={() => setShowDesignForm(true)}>
                  Design Form
                </Button>
              )}
            </Stack>
            {showDesignForm && (
              <TextField
                size="small"
                fullWidth
                label="Form name"
                placeholder="e.g. Handraiser Form"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleDesignForm(); }}
                autoFocus
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        )}
      </Box>

      <Divider />
      <AIChatInput loading={loading} />
    </Box>
  );
}
