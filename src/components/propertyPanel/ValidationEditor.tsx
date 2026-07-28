import { useState } from "react";
import type { FieldDefinition, ValidationType } from "../../schema";
import { useFormStore } from "../../store/formStore";
import { FIELD_REGISTRY } from "../../fieldRegistry";
import { newId } from "../../utils/id";

interface Props {
  field: FieldDefinition;
}

const NEEDS_PARAM: ValidationType[] = ["minLength", "maxLength", "regex"];

export function ValidationEditor({ field }: Props) {
  const locales = useFormStore((s) => s.locales);
  const updateField = useFormStore((s) => s.updateField);
  const available = FIELD_REGISTRY[field.type].availableValidations;
  const [pendingType, setPendingType] = useState<ValidationType>(available[0]);

  if (available.length === 0) return null;

  function addRule() {
    updateField(field.id, {
      validations: [...field.validations, { id: newId("val"), type: pendingType, message: {} }],
    });
  }

  function removeRule(id: string) {
    updateField(field.id, { validations: field.validations.filter((v) => v.id !== id) });
  }

  function updateRule(id: string, patch: Partial<FieldDefinition["validations"][number]>) {
    updateField(field.id, { validations: field.validations.map((v) => (v.id === id ? { ...v, ...patch } : v)) });
  }

  return (
    <div className="validation-editor">
      <span className="field-group-label">Validations</span>
      {field.validations.map((rule) => (
        <div key={rule.id} className="validation-rule-row">
          <div className="validation-rule-header">
            <span className="validation-type-tag">{rule.type}</span>
            <button type="button" onClick={() => removeRule(rule.id)} aria-label="Remove validation">
              ✕
            </button>
          </div>
          {NEEDS_PARAM.includes(rule.type) && (
            <input
              type={rule.type === "regex" ? "text" : "number"}
              placeholder={rule.type === "regex" ? "regex pattern" : "length"}
              value={rule.param ?? ""}
              onChange={(e) => updateRule(rule.id, { param: rule.type === "regex" ? e.target.value : Number(e.target.value) })}
            />
          )}
          {locales.map((locale) => (
            <input
              key={locale.code}
              type="text"
              dir={locale.direction}
              placeholder={`${locale.code.toUpperCase()} error message (optional)`}
              value={rule.message[locale.code] ?? ""}
              onChange={(e) => updateRule(rule.id, { message: { ...rule.message, [locale.code]: e.target.value } })}
            />
          ))}
        </div>
      ))}
      <div className="add-validation-row">
        <select value={pendingType} onChange={(e) => setPendingType(e.target.value as ValidationType)}>
          {available.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <button type="button" onClick={addRule}>
          + Add validation
        </button>
      </div>
    </div>
  );
}
