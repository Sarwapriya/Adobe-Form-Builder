<<<<<<< HEAD
import type { FieldDefinition, FieldWidth } from "../../schema";
=======
import type { FieldDefinition, FieldGroup, FieldWidth } from "../../schema";
>>>>>>> 569474c (update project)
import { useFormStore } from "../../store/formStore";
import { FIELD_REGISTRY } from "../../fieldRegistry";
import { LocalizedTextInput } from "./LocalizedTextInput";

interface Props {
  field: FieldDefinition;
}

const WIDTHS: FieldWidth[] = ["full", "half", "third"];
<<<<<<< HEAD

export function CommonPropsEditor({ field }: Props) {
  const locales = useFormStore((s) => s.locales);
  const updateField = useFormStore((s) => s.updateField);
  const descriptor = FIELD_REGISTRY[field.type];

  return (
    <div className="common-props-editor">
      <LocalizedTextInput label="Label" value={field.label} locales={locales} onChange={(label) => updateField(field.id, { label })} />

=======
const MAX_QUESTIONS = 20;

export function CommonPropsEditor({ field }: Props) {
  const locales = useFormStore((s) => s.locales);
  const fields = useFormStore((s) => s.fields);
  const updateField = useFormStore((s) => s.updateField);
  const descriptor = FIELD_REGISTRY[field.type];

  const questionFields = fields.filter((f) => f.group === "question").sort((a, b) => a.order - b.order);
  const questionNumber = questionFields.findIndex((f) => f.id === field.id) + 1;

  return (
    <div className="common-props-editor">
      <label className="field-group">
        <span className="field-group-label">Field group</span>
        <select
          value={field.group}
          onChange={(e) => updateField(field.id, { group: e.target.value as FieldGroup })}
        >
          <option value="profile">Profile field</option>
          <option value="question">Question{field.group === "question" ? ` (Q${questionNumber})` : ""}</option>
        </select>
      </label>

      {field.group === "question" && questionFields.length > MAX_QUESTIONS && (
        <p className="hint-text">
          Warning: {questionFields.length} questions configured — the reference format supports up to Q{MAX_QUESTIONS}.
        </p>
      )}

      <LocalizedTextInput label="Label" value={field.label} locales={locales} onChange={(label) => updateField(field.id, { label })} />

      {field.group === "question" && (
        <LocalizedTextInput
          label="Subheading"
          value={field.subheading}
          locales={locales}
          onChange={(subheading) => updateField(field.id, { subheading })}
        />
      )}

>>>>>>> 569474c (update project)
      {!descriptor.isStructural && (
        <>
          <label className="field-group">
            <span className="field-group-label">Field name (submission key)</span>
            <input type="text" value={field.name} onChange={(e) => updateField(field.id, { name: e.target.value })} />
          </label>

          {descriptor.supportsPlaceholder && (
            <LocalizedTextInput
              label="Placeholder"
              value={field.placeholder}
              locales={locales}
              onChange={(placeholder) => updateField(field.id, { placeholder })}
            />
          )}

          <LocalizedTextInput
            label="Help text"
            value={field.helpText}
            locales={locales}
            onChange={(helpText) => updateField(field.id, { helpText })}
          />

          <label className="field-group">
            <span className="field-group-label">Default value</span>
            <input
              type="text"
              value={field.defaultValue ?? ""}
              onChange={(e) => updateField(field.id, { defaultValue: e.target.value })}
            />
          </label>

          {descriptor.supportsRequired && (
            <label className="field-group inline">
              <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })} />
              <span>Required</span>
            </label>
          )}

          <label className="field-group">
            <span className="field-group-label">Width</span>
            <select value={field.width} onChange={(e) => updateField(field.id, { width: e.target.value as FieldWidth })}>
              {WIDTHS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
    </div>
  );
}
