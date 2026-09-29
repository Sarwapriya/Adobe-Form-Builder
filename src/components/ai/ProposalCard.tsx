import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Checkbox, Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import type { AIFormProposal, AIProposalQuestionPatch } from "@formbuilder/shared";
import { CONTROL_TYPE_LABEL } from "../formBuilder/formBuilderHelpers";
import { useAiChatStore } from "../../store/aiChatStore";

interface AnswerEdit {
  keep: boolean;
  text: string;
}

interface QuestionEdit {
  keep: boolean;
  heading: string;
  answers: AnswerEdit[];
}

function toEdits(proposal: AIFormProposal): QuestionEdit[] {
  return proposal.questions.map((q) => ({
    keep: true,
    heading: q.heading,
    answers: q.answers.map((text) => ({ keep: true, text })),
  }));
}

function toPatch(edits: QuestionEdit[]): AIProposalQuestionPatch[] {
  return edits.map((q) => ({
    keep: q.keep,
    heading: q.heading,
    answers: q.answers.map((a) => ({ keep: a.keep, text: a.text })),
  }));
}

/**
 * Preview of a new campaign draft the assistant proposed. The backend has
 * already validated it (validate_form) before it can reach this card. The
 * user can check/uncheck a question or answer to drop it, or edit its text,
 * right here — "Update proposal" applies the edit directly (revise_proposal,
 * no LLM call) and replaces the card with the newly validated version.
 * Nothing is saved to a real campaign until "Approve & Save", which approves
 * exactly the version shown and saves it (aiChatStore.approveAndSaveProposal).
 */
export function ProposalCard({ proposal }: { proposal: AIFormProposal }) {
  const navigate = useNavigate();
  const approveAndSave = useAiChatStore((s) => s.approveAndSaveProposal);
  const reviseProposal = useAiChatStore((s) => s.reviseProposal);
  const saving = useAiChatStore((s) => s.savingProposal);
  const revising = useAiChatStore((s) => s.revisingProposal);
  const reusedCount = proposal.questions.filter((q) => q.reused).length;

  const baseline = toEdits(proposal);
  const [edits, setEdits] = useState<QuestionEdit[]>(baseline);

  // Re-seed local edit state whenever a different (or newly revised) version arrives.
  useEffect(() => {
    setEdits(toEdits(proposal));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal.id, proposal.version]);

  const dirty = JSON.stringify(edits) !== JSON.stringify(baseline);

  async function handleApprove() {
    const result = await approveAndSave(proposal.id);
    if (result) navigate(result.route);
  }

  async function handleUpdate() {
    await reviseProposal(proposal.id, toPatch(edits));
  }

  function toggleQuestion(index: number) {
    setEdits((prev) => prev.map((q, i) => (i === index ? { ...q, keep: !q.keep } : q)));
  }

  function setHeading(index: number, heading: string) {
    setEdits((prev) => prev.map((q, i) => (i === index ? { ...q, heading } : q)));
  }

  function toggleAnswer(qIndex: number, aIndex: number) {
    setEdits((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, answers: q.answers.map((a, j) => (j === aIndex ? { ...a, keep: !a.keep } : a)) } : q
      )
    );
  }

  function setAnswerText(qIndex: number, aIndex: number, text: string) {
    setEdits((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, answers: q.answers.map((a, j) => (j === aIndex ? { ...a, text } : a)) } : q
      )
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.25, mt: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ flexGrow: 1 }}>
          {proposal.name}
        </Typography>
        <Chip label={`v${proposal.version}`} size="small" />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        {proposal.subsidiary}
        {proposal.projectCode ? ` · ${proposal.projectCode}` : " · no project code yet"} · {proposal.questions.length} question
        {proposal.questions.length === 1 ? "" : "s"} ({reusedCount} reused from existing campaigns)
      </Typography>

      {proposal.saved ? (
        <>
          <Box component="ol" sx={{ pl: 2.5, m: 0, mb: 1 }}>
            {proposal.questions.map((q, index) => (
              <Box component="li" key={`${proposal.id}-${index}`} sx={{ mb: 0.75 }}>
                <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="body2" fontWeight={600}>
                    {q.heading}
                    {q.required ? " *" : ""}
                  </Typography>
                  <Chip label={CONTROL_TYPE_LABEL[q.controlType]} size="small" variant="outlined" />
                  {q.reused && <Chip label="Reused" size="small" color="info" variant="outlined" />}
                </Stack>
                {q.answers.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Options: {q.answers.join(", ")}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
          <Typography variant="caption" color="success.main">
            Saved as a draft.
          </Typography>
        </>
      ) : (
        <>
          <Stack spacing={1} sx={{ mb: 1 }}>
            {proposal.questions.map((q, qIndex) => {
              const edit = edits[qIndex];
              if (!edit) return null;
              return (
                <Box key={`${proposal.id}-${qIndex}`} sx={{ opacity: edit.keep ? 1 : 0.5 }}>
                  <Stack direction="row" spacing={0.5} alignItems="flex-start">
                    <Checkbox
                      size="small"
                      checked={edit.keep}
                      onChange={() => toggleQuestion(qIndex)}
                      sx={{ p: 0.5, mt: 0.5 }}
                      inputProps={{ "aria-label": `Keep question: ${q.heading}` }}
                    />
                    <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Chip label={CONTROL_TYPE_LABEL[q.controlType]} size="small" variant="outlined" />
                        {q.required && <Chip label="Required" size="small" variant="outlined" />}
                        {q.reused && <Chip label="Reused" size="small" color="info" variant="outlined" />}
                      </Stack>
                      <TextField
                        size="small"
                        fullWidth
                        value={edit.heading}
                        disabled={!edit.keep}
                        onChange={(e) => setHeading(qIndex, e.target.value)}
                      />
                      {edit.answers.length > 0 && (
                        <Stack spacing={0.5} sx={{ pl: 1 }}>
                          {edit.answers.map((answer, aIndex) => (
                            <Stack key={aIndex} direction="row" spacing={0.5} alignItems="center">
                              <Checkbox
                                size="small"
                                checked={answer.keep}
                                disabled={!edit.keep}
                                onChange={() => toggleAnswer(qIndex, aIndex)}
                                sx={{ p: 0.5 }}
                                inputProps={{ "aria-label": `Keep answer: ${answer.text}` }}
                              />
                              <TextField
                                size="small"
                                fullWidth
                                value={answer.text}
                                disabled={!edit.keep || !answer.keep}
                                onChange={(e) => setAnswerText(qIndex, aIndex, e.target.value)}
                              />
                            </Stack>
                          ))}
                        </Stack>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Stack>

          {proposal.warnings.length > 0 && (
            <Alert severity="info" sx={{ mb: 1, py: 0 }}>
              {proposal.warnings.join(" ")}
            </Alert>
          )}

          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" disabled={!dirty || revising || saving} onClick={() => void handleUpdate()}>
              {revising ? "Updating..." : "Update proposal"}
            </Button>
            <Button size="small" variant="contained" disabled={dirty || saving || revising} onClick={() => void handleApprove()}>
              {saving ? "Saving..." : "Approve & Save"}
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            {dirty
              ? "Click Update proposal to apply your edits before approving."
              : "Check/uncheck or edit a question or answer above, or tell the assistant what to change."}
          </Typography>
        </>
      )}
    </Paper>
  );
}
