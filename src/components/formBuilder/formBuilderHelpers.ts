import type { AnswerDefinition, ControlType, QuestionDefinition } from "@formbuilder/shared";

const DEFAULT_LOCALE = "en_GB";

export function createAnswer(order: number): AnswerDefinition {
  return { id: `A${order}`, order, textByLocale: { [DEFAULT_LOCALE]: `Option ${order}` } };
}

const CHOICE_TYPES: ControlType[] = ["radio", "checkbox", "dropdown"];

export function createQuestion(controlType: ControlType, order: number): QuestionDefinition {
  return {
    id: `Q${order}`,
    order,
    controlType,
    headingByLocale: { [DEFAULT_LOCALE]: "New question" },
    subheadingByLocale: {},
    required: true,
    answers: CHOICE_TYPES.includes(controlType) ? [createAnswer(1), createAnswer(2)] : [],
  };
}

/** Renumbers `order` (and re-derives sequential ids matching the existing
 * Q<n>/A<n> convention) to stay contiguous after an insert/delete/reorder —
 * both the DOM ids and the generated data.js lookup keys derive from `order`,
 * not the original id, so a gap would silently desync them (see domIds.ts). */
export function renumberQuestions(questions: QuestionDefinition[]): QuestionDefinition[] {
  return questions.map((q, i) => ({ ...q, id: `Q${i + 1}`, order: i + 1 }));
}

export function renumberAnswers(answers: AnswerDefinition[]): AnswerDefinition[] {
  return answers.map((a, i) => ({ ...a, id: `A${i + 1}`, order: i + 1 }));
}

export const CONTROL_TYPE_LABEL: Record<ControlType, string> = {
  text: "Textarea",
  shortText: "Text",
  dropdown: "Dropdown",
  radio: "Radio",
  checkbox: "Checkbox",
};
