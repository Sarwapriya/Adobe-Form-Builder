import type { FieldDefinition, LocaleCode } from "../../schema";
import { resolveLocalizedText } from "../../schema";
import type { FieldUiState } from "../../schema/formState";

interface Props {
  field: FieldDefinition;
  locale: LocaleCode;
  defaultLocale: LocaleCode;
  value: string;
  uiState: FieldUiState;
  error?: string;
  onChange: (value: string) => void;
}

export function RuntimeFieldRenderer({ field, locale, defaultLocale, value, uiState, error, onChange }: Props) {
  if (!uiState.visible) return null;

  const label = resolveLocalizedText(field.label, locale, defaultLocale);
  const placeholder = resolveLocalizedText(field.placeholder, locale, defaultLocale);
  const help = resolveLocalizedText(field.helpText, locale, defaultLocale);

  if (field.type === "heading") {
    return (
      <div className={`preview-field-row width-${field.width}`}>
        <h2 className="preview-heading">{label}</h2>
      </div>
    );
  }

  if (field.type === "paragraph") {
    return (
      <div className={`preview-field-row width-${field.width}`}>
        <p className="preview-paragraph">{label}</p>
      </div>
    );
  }

  return (
    <div className={`preview-field-row width-${field.width}`}>
      {field.type !== "checkbox" && (
        <label className="preview-field-label">
          {label} {uiState.required && <span className="required-marker">*</span>}
        </label>
      )}

      {field.type === "textarea" && (
        <textarea
          disabled={!uiState.enabled}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {(field.type === "textbox" || field.type === "number" || field.type === "email") && (
        <input
          type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
          disabled={!uiState.enabled}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === "checkbox" && (
        <label className="preview-checkbox-row">
          <input type="checkbox" disabled={!uiState.enabled} checked={value === "true"} onChange={(e) => onChange(e.target.checked ? "true" : "")} />
          <span>
            {label} {uiState.required && <span className="required-marker">*</span>}
          </span>
        </label>
      )}

      {field.type === "radio" && (
        <div className="preview-options-group">
          {(field.options ?? []).map((opt) => (
            <label key={opt.id} className="preview-option-row">
              <input
                type="radio"
                disabled={!uiState.enabled}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
              />
              <span>{resolveLocalizedText(opt.label, locale, defaultLocale)}</span>
            </label>
          ))}
        </div>
      )}

      {field.type === "dropdown" && (
        <select disabled={!uiState.enabled} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="" />
          {(field.options ?? []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {resolveLocalizedText(opt.label, locale, defaultLocale)}
            </option>
          ))}
        </select>
      )}

      {help && <p className="preview-help">{help}</p>}
      {error && <p className="preview-error">{error}</p>}
    </div>
  );
}
