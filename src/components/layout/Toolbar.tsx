<<<<<<< HEAD
=======
import { useState } from "react";
>>>>>>> 569474c (update project)
import { useFormStore } from "../../store/formStore";
import { generateSolution } from "../../codegen/generate";
import { zipAndDownload } from "../../codegen/zipAndDownload";
import { ExportJsonButton } from "../jsonIO/ExportJsonButton";
import { ImportJsonButton } from "../jsonIO/ImportJsonButton";
import { LocalizedTextInput } from "../propertyPanel/LocalizedTextInput";
<<<<<<< HEAD
=======
import { CountryManagerPanel } from "../countries/CountryManagerPanel";
>>>>>>> 569474c (update project)

export function Toolbar() {
  const exportForm = useFormStore((s) => s.exportForm);
  const metadata = useFormStore((s) => s.metadata);
  const locales = useFormStore((s) => s.locales);
  const setTitle = useFormStore((s) => s.setTitle);
<<<<<<< HEAD
=======
  const [showCountries, setShowCountries] = useState(false);
>>>>>>> 569474c (update project)

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
<<<<<<< HEAD
=======
        <button type="button" onClick={() => setShowCountries(true)}>
          Countries &amp; Locales
        </button>
>>>>>>> 569474c (update project)
        <ExportJsonButton />
        <ImportJsonButton />
        <button type="button" className="generate-button" onClick={handleGenerate}>
          Generate Form
        </button>
      </div>
<<<<<<< HEAD
=======
      {showCountries && <CountryManagerPanel onClose={() => setShowCountries(false)} />}
>>>>>>> 569474c (update project)
    </header>
  );
}
