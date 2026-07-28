import type { ConditionAction, ConditionOperator, FieldDefinition } from "../../schema";
import { defaultLocaleOf, resolveLocalizedText } from "../../schema";
import { useFormStore } from "../../store/formStore";
import { newId } from "../../utils/id";

interface Props {
  field: FieldDefinition;
}

const OPERATORS: ConditionOperator[] = ["equals", "notEquals", "contains", "isEmpty", "isNotEmpty"];
const ACTIONS: ConditionAction[] = ["show", "hide", "enable", "disable", "require", "optional"];
const NEEDS_VALUE: ConditionOperator[] = ["equals", "notEquals", "contains"];

export function ConditionEditor({ field }: Props) {
  const fields = useFormStore((s) => s.fields);
  const locales = useFormStore((s) => s.locales);
  const updateField = useFormStore((s) => s.updateField);
  const defaultLocale = defaultLocaleOf(locales).code;

  const otherFields = fields.filter((f) => f.id !== field.id);
  const rule = field.conditions[0];

  function setRule(next: Partial<NonNullable<typeof rule>>) {
    if (!rule) return;
    updateField(field.id, { conditions: [{ ...rule, ...next }] });
  }

  function enableCondition() {
    if (otherFields.length === 0) return;
    updateField(field.id, {
      conditions: [{ id: newId("cond"), sourceFieldId: otherFields[0].id, operator: "equals", value: "", action: "show" }],
    });
  }

  function disableCondition() {
    updateField(field.id, { conditions: [] });
  }

  if (otherFields.length === 0) {
    return (
      <div className="condition-editor">
        <span className="field-group-label">Conditional logic</span>
        <p className="hint-text">Add another field first to reference it in a condition.</p>
      </div>
    );
  }

  return (
    <div className="condition-editor">
      <label className="field-group inline">
        <input type="checkbox" checked={Boolean(rule)} onChange={(e) => (e.target.checked ? enableCondition() : disableCondition())} />
        <span>Conditional logic</span>
      </label>

      {rule && (
        <div className="condition-rule-row">
          <span>IF</span>
          <select value={rule.sourceFieldId} onChange={(e) => setRule({ sourceFieldId: e.target.value })}>
            {otherFields.map((f) => (
              <option key={f.id} value={f.id}>
                {resolveLocalizedText(f.label, defaultLocale, defaultLocale) || f.name}
              </option>
            ))}
          </select>
          <select value={rule.operator} onChange={(e) => setRule({ operator: e.target.value as ConditionOperator })}>
            {OPERATORS.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
          {NEEDS_VALUE.includes(rule.operator) && (
            <input type="text" value={rule.value ?? ""} onChange={(e) => setRule({ value: e.target.value })} placeholder="value" />
          )}
          <span>THEN</span>
          <select value={rule.action} onChange={(e) => setRule({ action: e.target.value as ConditionAction })}>
            {ACTIONS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
          <span>this field</span>
        </div>
      )}
    </div>
  );
}
