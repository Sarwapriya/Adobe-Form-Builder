import type { AnswerDefinition, ConsentDefinition, ControlType, FormVariant, QuestionDefinition } from "@formbuilder/shared";

const DEFAULT_LOCALE = "en_GB";

/** Matches domIds.ts's consentExtraId() convention — kept in sync since the reference
 * FF.js/OC.js's mapParam() greps for this exact "consentExtra" prefix. */
export function createConsent(order: number): ConsentDefinition {
  return { id: `consentExtra${order}`, order, textByLocale: { [DEFAULT_LOCALE]: "I agree to the" }, required: false, visibleInVariants: ["ff"] };
}

/** Renumbers order (and re-derives sequential "consentExtraN" ids) after an
 * insert/delete/reorder — same reasoning as renumberQuestions/renumberAnswers. */
export function renumberConsents(consents: ConsentDefinition[]): ConsentDefinition[] {
  return consents.map((c, i) => ({ ...c, id: `consentExtra${i + 1}`, order: i + 1 }));
}

/** `visibleInVariants` absent means "Full Form only" for every consent-style field
 * (PrivacyPolicyMeta/ConsentToggleMeta/ConsentDefinition) — unlike questions, which
 * default to "both" — since that's the only behavior any of them has ever had (see
 * each type's own doc comment in formDefinition.ts). */
export function consentVariants(c: { visibleInVariants?: FormVariant[] }): FormVariant[] {
  return c.visibleInVariants ?? ["ff"];
}

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
    visibleInVariants: ["ff", "oc"],
  };
}

/** `visibleInVariants` is optional/absent on Excel-sourced or pre-existing questions
 * (see formDefinition.ts) — treat absence as "visible in both" everywhere the UI needs
 * to read it, matching what pageTemplate.ts/formDefinitionValidator.ts do at the
 * generation/validation layer. */
export function questionVariants(q: Pick<QuestionDefinition, "visibleInVariants">): FormVariant[] {
  return q.visibleInVariants ?? ["ff", "oc"];
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
