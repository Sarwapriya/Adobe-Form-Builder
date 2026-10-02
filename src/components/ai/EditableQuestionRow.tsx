import { Box, Checkbox, Chip, Stack, TextField } from "@mui/material";
import type { ControlType } from "@formbuilder/shared";
import { CONTROL_TYPE_LABEL } from "../formBuilder/formBuilderHelpers";

export interface EditableAnswer {
  text: string;
  keep: boolean;
}

/**
 * One question's editable row — a checkbox to keep/drop it, an editable
 * heading field, and (for choice questions) each answer as its own
 * checkbox + editable text field. Purely presentational: the caller owns
 * all state and decides what "keep" even means (dropping a question before
 * it's ever included, vs. revising one already in a saved proposal).
 * Shared by ProposalCard (editing a validated AIFormProposal) and the
 * guided campaign wizard's Questions step (editing a search result or a
 * freshly drafted question before it's added to the wizard's own list) so
 * both present an identical editing experience.
 */
export function EditableQuestionRow({
  heading,
  controlType,
  required,
  reused,
  keep,
  answers,
  onToggleKeep,
  onHeadingChange,
  onToggleAnswer,
  onAnswerTextChange,
}: {
  heading: string;
  controlType: ControlType;
  required: boolean;
  reused: boolean;
  keep: boolean;
  answers: EditableAnswer[];
  onToggleKeep: () => void;
  onHeadingChange: (value: string) => void;
  onToggleAnswer: (index: number) => void;
  onAnswerTextChange: (index: number, value: string) => void;
}) {
  return (
    <Box sx={{ opacity: keep ? 1 : 0.5 }}>
      <Stack direction="row" spacing={0.5} alignItems="flex-start">
        <Checkbox
          size="small"
          checked={keep}
          onChange={onToggleKeep}
          sx={{ p: 0.5, mt: 0.5 }}
          inputProps={{ "aria-label": `Keep question: ${heading}` }}
        />
        <Stack spacing={0.5} sx={{ flexGrow: 1 }}>
          <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip label={CONTROL_TYPE_LABEL[controlType]} size="small" variant="outlined" />
            {required && <Chip label="Required" size="small" variant="outlined" />}
            {reused && <Chip label="Reused" size="small" color="info" variant="outlined" />}
          </Stack>
          <TextField size="small" fullWidth value={heading} disabled={!keep} onChange={(e) => onHeadingChange(e.target.value)} />
          {answers.length > 0 && (
            <Stack spacing={0.5} sx={{ pl: 1 }}>
              {answers.map((answer, index) => (
                <Stack key={index} direction="row" spacing={0.5} alignItems="center">
                  <Checkbox
                    size="small"
                    checked={answer.keep}
                    disabled={!keep}
                    onChange={() => onToggleAnswer(index)}
                    sx={{ p: 0.5 }}
                    inputProps={{ "aria-label": `Keep answer: ${answer.text}` }}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    value={answer.text}
                    disabled={!keep || !answer.keep}
                    onChange={(e) => onAnswerTextChange(index, e.target.value)}
                  />
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
