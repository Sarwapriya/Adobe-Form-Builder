import { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { AnswerDefinition, ControlType, LocaleCode, QuestionDefinition } from "@formbuilder/shared";
import { CONTROL_TYPE_LABEL } from "../formBuilder/formBuilderHelpers";
import { useFormContributionStore } from "../../store/formContributionStore";
import { localeDir } from "../../utils/localeDir";

const ADD_QUESTION_TYPES: ControlType[] = ["shortText", "text", "dropdown", "radio", "checkbox"];
const CHOICE_TYPES: ControlType[] = ["radio", "checkbox", "dropdown"];

/** A brand-new question this subsidiary user is proposing (appended after the
 * form's existing ones once approved — see contribution.ts's applyContribution,
 * which reassigns real ids/order regardless of what's used here as a local key).
 * Since this content is genuinely new (not a translation of something that already
 * exists), the submitter provides its own text for *every* locale the form has —
 * default included, since that's what every other question's own fallback text
 * ultimately resolves to (see resolveLocalizedText). Only the default locale is
 * required; the rest are optional, same as any other locale's coverage. */
export function AddQuestionDialog({
  open,
  onClose,
  defaultLocale,
  locales,
}: {
  open: boolean;
  onClose: () => void;
  defaultLocale: string;
  locales: string[];
}) {
  const addQuestion = useFormContributionStore((s) => s.addQuestion);
  const [locale, setLocale] = useState(defaultLocale);
  const [controlType, setControlType] = useState<ControlType>("shortText");
  const [headingByLocale, setHeadingByLocale] = useState<Record<string, string>>({});
  const [optionCount, setOptionCount] = useState(2);
  const [optionsByLocale, setOptionsByLocale] = useState<Record<string, string[]>>({});
  const [required, setRequired] = useState(true);

  useEffect(() => {
    if (open) setLocale(defaultLocale);
  }, [open, defaultLocale]);

  function reset() {
    setLocale(defaultLocale);
    setControlType("shortText");
    setHeadingByLocale({});
    setOptionCount(2);
    setOptionsByLocale({});
    setRequired(true);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function currentOptions(forLocale: string): string[] {
    const stored = optionsByLocale[forLocale] ?? [];
    return Array.from({ length: optionCount }, (_, i) => stored[i] ?? "");
  }

  function setOption(i: number, value: string) {
    setOptionsByLocale((prev) => {
      const next = currentOptions(locale);
      next[i] = value;
      return { ...prev, [locale]: next };
    });
  }

  function handleAdd() {
    const defaultHeading = (headingByLocale[defaultLocale] ?? "").trim();
    if (!defaultHeading) return;
    const isChoiceType = CHOICE_TYPES.includes(controlType);

    const headingEntries = Object.entries(headingByLocale)
      .map(([l, v]) => [l, v.trim()] as const)
      .filter(([, v]) => v !== "");

    const answers: AnswerDefinition[] = isChoiceType
      ? Array.from({ length: optionCount }, (_, i) => i)
          .filter((i) => (optionsByLocale[defaultLocale]?.[i] ?? "").trim() !== "")
          .map((i, order) => {
            const textByLocale: Record<LocaleCode, string> = {};
            for (const l of locales) {
              const v = (optionsByLocale[l]?.[i] ?? "").trim();
              if (v) textByLocale[l] = v;
            }
            return { id: `A${order + 1}`, order: order + 1, textByLocale };
          })
      : [];

    const localId = `new-q-${Date.now()}`;
    const question: QuestionDefinition = {
      id: localId,
      order: 0,
      controlType,
      headingByLocale: Object.fromEntries(headingEntries),
      subheadingByLocale: {},
      required,
      answers,
      visibleInVariants: ["ff", "oc"],
    };
    addQuestion(question);
    handleClose();
  }

  const isChoiceType = CHOICE_TYPES.includes(controlType);
  const canAdd = (headingByLocale[defaultLocale] ?? "").trim() !== "" && (!isChoiceType || (optionsByLocale[defaultLocale] ?? []).some((o) => o.trim() !== ""));
  const options = currentOptions(locale);
  const dir = localeDir(locale);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add a question</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField select label="Type" size="small" value={controlType} onChange={(e) => setControlType(e.target.value as ControlType)}>
            {ADD_QUESTION_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {CONTROL_TYPE_LABEL[type]}
              </MenuItem>
            ))}
          </TextField>

          {locales.length > 1 && (
            <TextField select label="Text for locale" size="small" value={locale} onChange={(e) => setLocale(e.target.value)}>
              {locales.map((code) => (
                <MenuItem key={code} value={code}>
                  {code}
                  {code === defaultLocale ? " (default, required)" : ""}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            label={`Heading (${locale})`}
            size="small"
            fullWidth
            value={headingByLocale[locale] ?? ""}
            inputProps={{ dir }}
            onChange={(e) => setHeadingByLocale((prev) => ({ ...prev, [locale]: e.target.value }))}
            autoFocus
          />
          {isChoiceType && (
            <Stack spacing={1}>
              {options.map((option, i) => (
                <TextField
                  key={i}
                  label={`Option ${i + 1} (${locale})`}
                  size="small"
                  fullWidth
                  value={option}
                  inputProps={{ dir }}
                  onChange={(e) => setOption(i, e.target.value)}
                />
              ))}
              <Button size="small" onClick={() => setOptionCount((n) => n + 1)}>
                Add another option
              </Button>
            </Stack>
          )}
          {locales.length > 1 && (
            <Typography variant="caption" color="text.secondary">
              Only "{defaultLocale}" is required — fill in the other locales too if you can, or leave them and translate
              later.
            </Typography>
          )}
          <TextField
            select
            label="Required"
            size="small"
            value={required ? "yes" : "no"}
            onChange={(e) => setRequired(e.target.value === "yes")}
          >
            <MenuItem value="yes">Required</MenuItem>
            <MenuItem value="no">Optional</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" disabled={!canAdd} onClick={handleAdd}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}
