export type ConditionOperator = "equals" | "notEquals" | "contains" | "isEmpty" | "isNotEmpty";

export type ConditionAction = "show" | "hide" | "enable" | "disable" | "require" | "optional";

export interface ConditionRule {
  id: string;
  sourceFieldId: string;
  operator: ConditionOperator;
  value?: string;
  action: ConditionAction;
}

// Pure, dependency-free by design: codegen embeds this function's runtime
// source (fn.toString()) verbatim into generated form.js, so the same logic
// that drives the React preview also runs unmodified in the framework-free output.
export function evaluateCondition(operator: ConditionOperator, currentValue: string, comparisonValue?: string): boolean {
  switch (operator) {
    case "equals":
      return currentValue === comparisonValue;
    case "notEquals":
      return currentValue !== comparisonValue;
    case "contains":
      return currentValue.includes(comparisonValue ?? "");
    case "isEmpty":
      return currentValue.trim().length === 0;
    case "isNotEmpty":
      return currentValue.trim().length > 0;
    default:
      return true;
  }
}
