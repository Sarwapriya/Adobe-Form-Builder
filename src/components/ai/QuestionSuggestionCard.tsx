import { useState } from "react";
import { Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import type { AIActionSummary, AddQuestionArgs } from "@formbuilder/shared";
import { CONTROL_TYPE_LABEL } from "../formBuilder/formBuilderHelpers";
import { useAiChatStore } from "../../store/aiChatStore";
import { useFormBuilderStore } from "../../store/formBuilderStore";

/**
 * One SUGGEST_QUESTIONS-derived ADD_QUESTION pending action, rendered as a
 * lighter-weight suggestion card (heading, control type, options preview for
 * choice types) rather than the generic AIActionCard — Add/Edit/Reject
 * instead of a bare Add/Cancel. "Edit" stays intentionally simple (just the
 * heading text) rather than reproducing QuestionEditorPanel.tsx's full
 * editor, which is already available immediately after the question lands
 * in the draft.
 *
 * There's no "update a pending action's proposed content" endpoint on the
 * backend — only confirm/reject — so an edited heading is applied as a
 * follow-up local patch after confirming: aiChatStore's ADD_QUESTION
 * transform always appends the new question and renumbers (see
 * formBuilderHelpers.renumberQuestions), so the newly added question is
 * reliably the last one in `definition.questions` right after confirm
 * resolves.
 */
export function QuestionSuggestionCard({ action }: { action: AIActionSummary }) {
  const confirmAction = useAiChatStore((s) => s.confirmAction);
  const rejectAction = useAiChatStore((s) => s.rejectAction);
  const updateDefinition = useFormBuilderStore((s) => s.updateDefinition);
  const defaultLocale = useFormBuilderStore((s) => s.definition?.meta.defaultLocale ?? "en_GB");

  const { question } = action.data as AddQuestionArgs;
  const originalHeading = question.headingByLocale[defaultLocale] ?? Object.values(question.headingByLocale)[0] ?? "";

  const [editing, setEditing] = useState(false);
  const [heading, setHeading] = useState(originalHeading);
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    setBusy(true);
    try {
      const response = await confirmAction(action.id);
      const edited = heading.trim();
      if (response && edited && edited !== originalHeading) {
        updateDefinition((d) => {
          const last = d.questions[d.questions.length - 1];
          if (!last) return d;
          return {
            ...d,
            questions: d.questions.map((q) =>
              q.id === last.id ? { ...q, headingByLocale: { ...q.headingByLocale, [defaultLocale]: edited } } : q,
            ),
          };
        });
      }
    } finally {
      setBusy(false);
    }
  }

  const optionsPreview = question.answers
    .map((a) => a.textByLocale[defaultLocale] ?? Object.values(a.textByLocale)[0] ?? "")
    .filter(Boolean)
    .join(", ");

  return (
    <Paper variant="outlined" sx={{ p: 1.25, mb: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <Chip label={CONTROL_TYPE_LABEL[question.controlType]} size="small" />
        {editing ? (
          <TextField size="small" value={heading} onChange={(e) => setHeading(e.target.value)} fullWidth autoFocus />
        ) : (
          <Typography variant="body2" fontWeight={600} sx={{ flexGrow: 1 }}>
            {heading}
          </Typography>
        )}
      </Stack>
      {optionsPreview && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          Options: {optionsPreview}
        </Typography>
      )}
      <Stack direction="row" spacing={1}>
        <Button size="small" variant="contained" disabled={busy} onClick={() => void handleAdd()}>
          {busy ? "Adding..." : "Add"}
        </Button>
        <Button size="small" disabled={busy} onClick={() => setEditing((e) => !e)}>
          {editing ? "Done" : "Edit"}
        </Button>
        <Button size="small" color="inherit" disabled={busy} onClick={() => void rejectAction(action.id)}>
          Reject
        </Button>
      </Stack>
    </Paper>
  );
}
