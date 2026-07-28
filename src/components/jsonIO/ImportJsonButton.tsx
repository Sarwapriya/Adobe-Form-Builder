import { useRef, useState } from "react";
import { useFormStore } from "../../store/formStore";
import { formDefinitionSchema } from "../../schema";

export function ImportJsonButton() {
  const loadForm = useFormStore((s) => s.loadForm);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = formDefinitionSchema.safeParse(parsed);
      if (!result.success) {
        setError("Invalid form definition JSON: " + result.error.issues[0]?.message);
        return;
      }
      loadForm(result.data);
      setError(null);
    } catch {
      setError("Could not read that file as JSON.");
    }
  }

  return (
    <div className="import-json-button">
      <button type="button" onClick={() => inputRef.current?.click()}>
        Load JSON
      </button>
      <input ref={inputRef} type="file" accept="application/json" hidden onChange={handleFileChange} />
      {error && <span className="import-error">{error}</span>}
    </div>
  );
}
