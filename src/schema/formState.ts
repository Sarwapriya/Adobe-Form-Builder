import type { FieldDefinition } from "./formDefinition";
import { evaluateCondition } from "./conditions";

export interface FieldUiState {
  visible: boolean;
  enabled: boolean;
  required: boolean;
}

export type FormValues = Record<string, string>;

// Pure: used by the React preview so it evaluates conditions off the exact
// same FormDefinition that Save JSON / Generate Form consume (via exportForm()).
export function computeFieldStates(fields: FieldDefinition[], values: FormValues): Record<string, FieldUiState> {
  const result: Record<string, FieldUiState> = {};

  for (const field of fields) {
    const state: FieldUiState = { visible: true, enabled: true, required: field.required };
    const rule = field.conditions[0];

    if (rule) {
      const currentValue = values[rule.sourceFieldId] ?? "";
      const matches = evaluateCondition(rule.operator, currentValue, rule.value);

      switch (rule.action) {
        case "show":
          state.visible = matches;
          break;
        case "hide":
          state.visible = !matches;
          break;
        case "enable":
          state.enabled = matches;
          break;
        case "disable":
          state.enabled = !matches;
          break;
        case "require":
          state.required = matches ? true : field.required;
          break;
        case "optional":
          state.required = matches ? false : field.required;
          break;
      }
    }

    result[field.id] = state;
  }

  return result;
}
