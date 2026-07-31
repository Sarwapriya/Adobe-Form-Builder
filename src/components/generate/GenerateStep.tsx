import { resolveFileNames } from "../../codegen/fileNames.ts";
import { generateSolution } from "../../codegen/generate.ts";
import { zipAndDownload } from "../../codegen/zipAndDownload.ts";
import { useBuilderStore } from "../../store/builderStore.ts";

export function GenerateStep() {
  const mapResult = useBuilderStore((s) => s.mapResult)!;
  const validation = useBuilderStore((s) => s.validation)!;
  const config = useBuilderStore((s) => s.config);
  const setStep = useBuilderStore((s) => s.setStep);
  const reset = useBuilderStore((s) => s.reset);

  const canGenerate = validation.errors.length === 0;

  function handleGenerate() {
    const files = generateSolution(mapResult.form, config);
    const { prefix } = resolveFileNames(mapResult.form, config);
    zipAndDownload(files, `${prefix}.zip`);
  }

  return (
    <div className="panel">
      <h2>Generate</h2>
      <ul className="summary-list">
        <li>Languages: {mapResult.form.locales.map((l) => l.code).join(", ")}</li>
        <li>Questions: {mapResult.form.questions.length}</li>
        <li>Variants: {config.variants.join(", ")}</li>
        <li>Submission endpoint: {config.apiEndpoint || "(none — local validation only)"}</li>
        <li>Analytics: {config.analytics?.enabled ? "enabled" : "disabled"}</li>
      </ul>

      {!canGenerate && (
        <p className="issue-item error">
          {validation.errors.length} blocking error(s) must be resolved before generating. Go back to Preview to
          review them.
        </p>
      )}

      <div className="button-row">
        <button className="btn secondary" onClick={() => setStep("configure")}>
          Back
        </button>
        <button className="btn" disabled={!canGenerate} onClick={handleGenerate}>
          Generate &amp; Download .zip
        </button>
        <button className="btn secondary" onClick={reset}>
          Start Over
        </button>
      </div>
    </div>
  );
}
