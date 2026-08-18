import { Box, Button, Divider, FormControlLabel, IconButton, Stack, Switch, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { arrayMove } from "@dnd-kit/sortable";
import type { FormVariant } from "@formbuilder/shared";
import { resolveLocalizedText } from "@formbuilder/shared";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { autoPopulateParamName, CONTROL_TYPE_LABEL, createAnswer, questionVariants, renumberAnswers } from "./formBuilderHelpers";

const CHOICE_TYPES = new Set(["radio", "checkbox", "dropdown"]);

/** Config drawer content for a single question — heading/subheading/required,
 * plus (for choice-type questions) an options editor with up/down reordering
 * and add/remove, matching QuestionDefinition.answers' own order-derived
 * id/DOM-key convention (see formBuilderHelpers.renumberAnswers). */
export function QuestionEditorPanel({ questionId }: { questionId: string }) {
  const definition = useFormBuilderStore((s) => s.definition);
  const updateDefinition = useFormBuilderStore((s) => s.updateDefinition);
  const formVariants = useFormBuilderStore((s) => s.config?.variants ?? ["ff", "oc"]);
  const defaultLocale = definition?.meta.defaultLocale ?? "en_GB";
  // Text fields below read/write whichever locale is currently active (see
  // SubsidiaryLocalePicker's "Editing" switcher) — falling back to the default
  // locale's own text for display when the active locale has no text yet.
  // Structural bits (required, options add/remove/reorder, variant visibility)
  // are never per-locale, so they stay untouched by this.
  const activeLocale = useFormBuilderStore((s) => s.activeLocale) || defaultLocale;
  const question = definition?.questions.find((q) => q.id === questionId);

  if (!question) return null;

  const heading = resolveLocalizedText(question.headingByLocale, activeLocale, defaultLocale);
  const subheading = resolveLocalizedText(question.subheadingByLocale, activeLocale, defaultLocale);
  const isChoiceType = CHOICE_TYPES.has(question.controlType);
  const shownIn = questionVariants(question);

  function patchQuestion(patch: Partial<typeof question>) {
    updateDefinition((d) => ({
      ...d,
      questions: d.questions.map((q) => (q.id === questionId ? { ...q, ...patch } : q)),
    }));
  }

  function toggleVariant(variant: FormVariant, checked: boolean) {
    const next = checked ? [...shownIn, variant] : shownIn.filter((v) => v !== variant);
    patchQuestion({ visibleInVariants: next } as Partial<typeof question>);
  }

  function patchAnswerText(answerId: string, text: string) {
    updateDefinition((d) => ({
      ...d,
      questions: d.questions.map((q) =>
        q.id !== questionId
          ? q
          : {
              ...q,
              answers: q.answers.map((a) => (a.id === answerId ? { ...a, textByLocale: { ...a.textByLocale, [activeLocale]: text } } : a)),
            },
      ),
    }));
  }

  function addOption() {
    updateDefinition((d) => ({
      ...d,
      questions: d.questions.map((q) => (q.id !== questionId ? q : { ...q, answers: [...q.answers, createAnswer(q.answers.length + 1)] })),
    }));
  }

  function removeOption(answerId: string) {
    updateDefinition((d) => ({
      ...d,
      questions: d.questions.map((q) =>
        q.id !== questionId ? q : { ...q, answers: renumberAnswers(q.answers.filter((a) => a.id !== answerId)) },
      ),
    }));
  }

  function moveOption(index: number, delta: number) {
    if (!question) return;
    const toIndex = index + delta;
    if (toIndex < 0 || toIndex >= question.answers.length) return;
    updateDefinition((d) => ({
      ...d,
      questions: d.questions.map((q) => (q.id !== questionId ? q : { ...q, answers: renumberAnswers(arrayMove(q.answers, index, toIndex)) })),
    }));
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" fontWeight={700}>
        {question.id} · {CONTROL_TYPE_LABEL[question.controlType]}
      </Typography>

      {activeLocale !== defaultLocale && (
        <Typography variant="caption" color="text.secondary">
          Editing text for <strong>{activeLocale}</strong> — other settings below always apply to every locale.
        </Typography>
      )}
      <TextField
        label="Heading"
        size="small"
        fullWidth
        value={heading}
        onChange={(e) => patchQuestion({ headingByLocale: { ...question.headingByLocale, [activeLocale]: e.target.value } })}
      />
      <TextField
        label="Subheading"
        size="small"
        fullWidth
        value={subheading}
        onChange={(e) => patchQuestion({ subheadingByLocale: { ...question.subheadingByLocale, [activeLocale]: e.target.value } })}
      />
      <FormControlLabel
        control={<Switch checked={question.required} onChange={(e) => patchQuestion({ required: e.target.checked })} />}
        label="Required"
      />

      {isChoiceType && (
        <FormControlLabel
          control={
            <Switch
              checked={!!question.autoPopulateEligible}
              onChange={(e) =>
                patchQuestion(e.target.checked ? { autoPopulateEligible: true } : { autoPopulateEligible: false, autoPopulateEnabled: false })
              }
            />
          }
          label={`Eligible for URL-param auto-populate (One-Click) — reads "${autoPopulateParamName(question.order)}"`}
        />
      )}

      <Box>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>
          Shown in
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
          Which output variant(s) include this question.
        </Typography>
        <Stack direction="row" spacing={1}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                disabled={!formVariants.includes("ff")}
                checked={shownIn.includes("ff")}
                onChange={(e) => toggleVariant("ff", e.target.checked)}
              />
            }
            label="Full Form"
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                disabled={!formVariants.includes("oc")}
                checked={shownIn.includes("oc")}
                onChange={(e) => toggleVariant("oc", e.target.checked)}
              />
            }
            label="One-Click"
          />
        </Stack>
      </Box>

      {isChoiceType && (
        <Box>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Options
          </Typography>
          <Stack spacing={1}>
            {question.answers.map((a, i) => (
              <Stack key={a.id} direction="row" spacing={0.5} alignItems="center">
                <TextField
                  size="small"
                  fullWidth
                  value={resolveLocalizedText(a.textByLocale, activeLocale, defaultLocale)}
                  onChange={(e) => patchAnswerText(a.id, e.target.value)}
                />
                <IconButton size="small" disabled={i === 0} onClick={() => moveOption(i, -1)} aria-label="Move option up">
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" disabled={i === question.answers.length - 1} onClick={() => moveOption(i, 1)} aria-label="Move option down">
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => removeOption(a.id)} aria-label="Remove option">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
          <Button size="small" startIcon={<AddIcon />} onClick={addOption} sx={{ mt: 1 }}>
            Add option
          </Button>
        </Box>
      )}
    </Stack>
  );
}
