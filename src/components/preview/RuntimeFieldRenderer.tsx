<<<<<<< HEAD
import type { FieldDefinition, LocaleCode } from "../../schema";
=======
import type { CountryConfig, FieldDefinition, LocaleCode } from "../../schema";
>>>>>>> 569474c (update project)
import { resolveLocalizedText } from "../../schema";
import type { FieldUiState } from "../../schema/formState";

interface Props {
  field: FieldDefinition;
  locale: LocaleCode;
  defaultLocale: LocaleCode;
  value: string;
  uiState: FieldUiState;
  error?: string;
<<<<<<< HEAD
  onChange: (value: string) => void;
}

export function RuntimeFieldRenderer({ field, locale, defaultLocale, value, uiState, error, onChange }: Props) {
=======
  countries: CountryConfig[];
  questionNumber?: number;
  onChange: (value: string) => void;
}

export function RuntimeFieldRenderer({
  field,
  locale,
  defaultLocale,
  value,
  uiState,
  error,
  countries,
  questionNumber,
  onChange,
}: Props) {
>>>>>>> 569474c (update project)
  if (!uiState.visible) return null;

  const label = resolveLocalizedText(field.label, locale, defaultLocale);
  const placeholder = resolveLocalizedText(field.placeholder, locale, defaultLocale);
  const help = resolveLocalizedText(field.helpText, locale, defaultLocale);
<<<<<<< HEAD
=======
  const subheading = resolveLocalizedText(field.subheading, locale, defaultLocale);
  const isQuestion = field.group === "question";
>>>>>>> 569474c (update project)

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

<<<<<<< HEAD
  return (
    <div className={`preview-field-row width-${field.width}`}>
      {field.type !== "checkbox" && (
        <label className="preview-field-label">
          {label} {uiState.required && <span className="required-marker">*</span>}
=======
  const control = (
    <>
      {field.type !== "checkbox" && !isQuestion && (
        <label className="preview-field-label">
          {label} {uiState.required && <span className="star">*</span>}
>>>>>>> 569474c (update project)
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

<<<<<<< HEAD
      {field.type === "checkbox" && (
        <label className="preview-checkbox-row">
          <input type="checkbox" disabled={!uiState.enabled} checked={value === "true"} onChange={(e) => onChange(e.target.checked ? "true" : "")} />
          <span>
            {label} {uiState.required && <span className="required-marker">*</span>}
=======
      {field.type === "phone" && (
        <div className="preview-phone-row">
          <select
            disabled={!uiState.enabled}
            value={value.split(":")[0] ?? ""}
            onChange={(e) => onChange(`${e.target.value}:${value.split(":")[1] ?? ""}`)}
          >
            <option value="" />
            {countries
              .filter((c) => c.languages.includes(locale))
              .map((c) => (
                <option key={c.id} value={c.callingCode}>
                  {resolveLocalizedText(c.name, locale, defaultLocale)} (+{c.callingCode})
                </option>
              ))}
          </select>
          <input
            type="tel"
            disabled={!uiState.enabled}
            value={value.split(":")[1] ?? ""}
            placeholder={placeholder}
            onChange={(e) => onChange(`${value.split(":")[0] ?? ""}:${e.target.value}`)}
          />
        </div>
      )}

      {field.type === "checkbox" && !isQuestion && (
        <label className="preview-checkbox-row">
          <input
            type="checkbox"
            disabled={!uiState.enabled}
            checked={value === "true"}
            onChange={(e) => onChange(e.target.checked ? "true" : "")}
          />
          <span>
            {label} {uiState.required && <span className="star">*</span>}
>>>>>>> 569474c (update project)
          </span>
        </label>
      )}

<<<<<<< HEAD
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
=======
      {(field.type === "radio" || field.type === "checkbox") && isQuestion && (
        <div className="form_check_list_wrap">
          {(field.options ?? []).map((opt) => (
            <label key={opt.id} className={opt.imageUrl ? "form_check_list" : "radio_wrap"}>
              <input
                type={field.type === "radio" ? "radio" : "checkbox"}
                disabled={!uiState.enabled}
                checked={field.type === "radio" ? value === opt.value : value.split("|").includes(opt.value)}
                onChange={() => {
                  if (field.type === "radio") {
                    onChange(opt.value);
                  } else {
                    const selected = value ? value.split("|").filter(Boolean) : [];
                    const next = selected.includes(opt.value)
                      ? selected.filter((v) => v !== opt.value)
                      : [...selected, opt.value];
                    onChange(next.join("|"));
                  }
                }}
              />
              {opt.imageUrl && <img src={opt.imageUrl} alt="" />}
>>>>>>> 569474c (update project)
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
<<<<<<< HEAD
    </div>
  );
=======
    </>
  );

  if (isQuestion) {
    return (
      <div className={`form_check_module width-${field.width}`}>
        <div className="form_check_title">
          <h3>
            {questionNumber ? `Q${questionNumber}. ` : ""}
            {label} {uiState.required && <span className="star">*</span>}
          </h3>
          {subheading && <p>{subheading}</p>}
        </div>
        {control}
      </div>
    );
  }

  return <div className={`preview-field-row width-${field.width}`}>{control}</div>;
>>>>>>> 569474c (update project)
}
