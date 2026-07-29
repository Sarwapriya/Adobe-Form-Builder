import { useMemo, useState } from "react";
import { useFormStore } from "../../store/formStore";
import { useLocaleStore } from "../../store/localeStore";
import { computeFieldStates, defaultLocaleOf, evaluateValidation, resolveLocalizedText } from "../../schema";
import { RuntimeFieldRenderer } from "./RuntimeFieldRenderer";

export function PreviewPane() {
  const fields = useFormStore((s) => s.fields);
  const locales = useFormStore((s) => s.locales);
<<<<<<< HEAD
=======
  const countries = useFormStore((s) => s.countries);
>>>>>>> 569474c (update project)
  const metadata = useFormStore((s) => s.metadata);
  const previewLocale = useLocaleStore((s) => s.previewLocale);
  const setPreviewLocale = useLocaleStore((s) => s.setPreviewLocale);

  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const defaultLocale = defaultLocaleOf(locales).code;
  const activeLocale = locales.some((l) => l.code === previewLocale) ? previewLocale : defaultLocale;
  const direction = locales.find((l) => l.code === activeLocale)?.direction ?? "ltr";

  const uiStates = useMemo(() => computeFieldStates(fields, values), [fields, values]);

<<<<<<< HEAD
=======
  const questionNumbers = useMemo(() => {
    const map: Record<string, number> = {};
    let n = 0;
    for (const field of [...fields].sort((a, b) => a.order - b.order)) {
      if (field.group === "question") map[field.id] = ++n;
    }
    return map;
  }, [fields]);

>>>>>>> 569474c (update project)
  function handleChange(fieldId: string, value: string) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: "" }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    for (const field of fields) {
      const state = uiStates[field.id];
      if (field.type === "heading" || field.type === "paragraph" || !state?.visible) continue;

<<<<<<< HEAD
      const value = values[field.id] ?? "";
=======
      const rawValue = values[field.id] ?? "";
      const value = field.type === "phone" ? rawValue.split(":")[1] ?? "" : rawValue;
>>>>>>> 569474c (update project)
      const rules = [...field.validations];
      if (state.required) rules.unshift({ id: "__required", type: "required", message: {} });

      for (const rule of rules) {
        if (!evaluateValidation(rule.type, value, rule.param)) {
          nextErrors[field.id] =
            resolveLocalizedText(rule.message, activeLocale, defaultLocale) ||
            (rule.type === "required" ? "This field is required." : "Invalid value.");
          break;
        }
      }
    }

    setErrors(nextErrors);
    setSubmitted(Object.keys(nextErrors).length === 0);
  }

  return (
    <div className="preview-pane" dir={direction}>
      <div className="preview-toolbar">
        <h3>Preview</h3>
        <select value={activeLocale} onChange={(e) => setPreviewLocale(e.target.value as typeof activeLocale)}>
          {locales.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="preview-form-shell">
        <h1>{resolveLocalizedText(metadata.title, activeLocale, defaultLocale)}</h1>
        {resolveLocalizedText(metadata.description, activeLocale, defaultLocale) && (
          <p>{resolveLocalizedText(metadata.description, activeLocale, defaultLocale)}</p>
        )}

        <form onSubmit={handleSubmit}>
          {fields.map((field) => (
            <RuntimeFieldRenderer
              key={field.id}
              field={field}
              locale={activeLocale}
              defaultLocale={defaultLocale}
              value={values[field.id] ?? ""}
              uiState={uiStates[field.id]}
              error={errors[field.id]}
<<<<<<< HEAD
=======
              countries={countries}
              questionNumber={field.group === "question" ? questionNumbers[field.id] : undefined}
>>>>>>> 569474c (update project)
              onChange={(v) => handleChange(field.id, v)}
            />
          ))}
          {fields.length > 0 && (
            <button type="submit" className="preview-submit-button">
              Submit
            </button>
          )}
        </form>

        {submitted && <div className="preview-success-panel">Thank you — your submission was received.</div>}
      </div>
    </div>
  );
}
