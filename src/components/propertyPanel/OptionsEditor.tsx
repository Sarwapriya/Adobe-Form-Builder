import type { FieldDefinition } from "../../schema";
import { useFormStore } from "../../store/formStore";
import { newId } from "../../utils/id";

interface Props {
  field: FieldDefinition;
}

export function OptionsEditor({ field }: Props) {
  const locales = useFormStore((s) => s.locales);
  const updateField = useFormStore((s) => s.updateField);
  const options = field.options ?? [];
<<<<<<< HEAD
=======
  const supportsImage = field.type === "radio" || field.type === "checkbox";
>>>>>>> 569474c (update project)

  function addOption() {
    const n = options.length + 1;
    updateField(field.id, {
      options: [...options, { id: newId("opt"), value: `option${n}`, label: { en: `Option ${n}` } }],
    });
  }

  function removeOption(id: string) {
    updateField(field.id, { options: options.filter((o) => o.id !== id) });
  }

  function updateOption(id: string, patch: Partial<(typeof options)[number]>) {
    updateField(field.id, { options: options.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
  }

  return (
    <div className="options-editor">
      <span className="field-group-label">Options</span>
      {options.map((option) => (
        <div key={option.id} className="option-row-editor">
          <input
            type="text"
            className="option-value-input"
            value={option.value}
            placeholder="value"
            onChange={(e) => updateOption(option.id, { value: e.target.value })}
          />
          {locales.map((locale) => (
            <input
              key={locale.code}
              type="text"
              dir={locale.direction}
              placeholder={`${locale.code.toUpperCase()} label`}
              value={option.label[locale.code] ?? ""}
              onChange={(e) => updateOption(option.id, { label: { ...option.label, [locale.code]: e.target.value } })}
            />
          ))}
<<<<<<< HEAD
=======
          {supportsImage && (
            <input
              type="text"
              className="option-image-input"
              placeholder="image URL (optional)"
              value={option.imageUrl ?? ""}
              onChange={(e) => updateOption(option.id, { imageUrl: e.target.value || undefined })}
            />
          )}
>>>>>>> 569474c (update project)
          <button type="button" onClick={() => removeOption(option.id)} aria-label="Remove option">
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="add-option-button" onClick={addOption}>
        + Add option
      </button>
    </div>
  );
}
