import { useFormStore } from "../../store/formStore";
import { downloadJson } from "../../utils/download";

export function ExportJsonButton() {
  const exportForm = useFormStore((s) => s.exportForm);

  function handleClick() {
    const form = exportForm();
    const filename = `${form.metadata.id || "form"}.json`;
    downloadJson(form, filename);
  }

  return (
    <button type="button" onClick={handleClick}>
      Save JSON
    </button>
  );
}
