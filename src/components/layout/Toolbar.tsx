import { useFormStore } from "../../store/formStore";
import { generateSolution } from "../../codegen/generate";
import { zipAndDownload } from "../../codegen/zipAndDownload";
import { ExportJsonButton } from "../jsonIO/ExportJsonButton";
import { ImportJsonButton } from "../jsonIO/ImportJsonButton";
import { LocalizedTextInput } from "../propertyPanel/LocalizedTextInput";

export function Toolbar() {
  const exportForm = useFormStore((s) => s.exportForm);
  const metadata = useFormStore((s) => s.metadata);
  const locales = useFormStore((s) => s.locales);
  const setTitle = useFormStore((s) => s.setTitle);

  function handleGenerate() {
    const form = exportForm();
    const files = generateSolution(form);
    zipAndDownload(files);
  }

  return (
    <header className="app-toolbar">
      <div className="app-toolbar-title">
        <span className="app-toolbar-label">Form Builder</span>
        <LocalizedTextInput label="Form title" value={metadata.title} locales={locales} onChange={setTitle} />
      </div>
      <div className="app-toolbar-actions">
        <ExportJsonButton />
        <ImportJsonButton />
        <button type="button" className="generate-button" onClick={handleGenerate}>
          Generate Form
        </button>
      </div>
    </header>
  );
}
