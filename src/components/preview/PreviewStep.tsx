import { useEffect, useState } from "react";
import { generateSolution } from "../../codegen/generate.ts";
import { buildPreviewDocument } from "../../codegen/previewDocument.ts";
import { useBuilderStore } from "../../store/builderStore.ts";
import { ValidationPanel } from "./ValidationPanel.tsx";

export function PreviewStep() {
  const mapResult = useBuilderStore((s) => s.mapResult)!;
  const config = useBuilderStore((s) => s.config);
  const previewLocale = useBuilderStore((s) => s.previewLocale);
  const setPreviewLocale = useBuilderStore((s) => s.setPreviewLocale);
  const setStep = useBuilderStore((s) => s.setStep);

  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const previewVariant = config.variants[0] ?? "ff";

  useEffect(() => {
    if (!previewLocale) return;
    // The preview must run the actual generated bundle (not a separate hand-written
    // rendering path), so it mounts the real generateSolution() output — this is the
    // same function the final "Generate" step calls, just fed to an iframe instead of
    // a zip download.
    const files = generateSolution(mapResult.form, { ...config, variants: [previewVariant] });
    const doc = buildPreviewDocument(files, previewVariant, previewLocale);
    const blob = new Blob([doc], { type: "text/html" });
    const baseUrl = URL.createObjectURL(blob);
    setIframeUrl(baseUrl);
    return () => URL.revokeObjectURL(baseUrl);
  }, [mapResult, config, previewVariant, previewLocale]);

  return (
    <div className="panel">
      <h2>Preview</h2>
      <ValidationPanel />

      <div className="locale-select">
        {mapResult.form.locales.map((l) => (
          <button
            key={l.code}
            type="button"
            className={`locale-chip${l.code === previewLocale ? " active" : ""}`}
            onClick={() => setPreviewLocale(l.code)}
          >
            {l.label} ({l.code}){l.isRtl ? " · RTL" : ""}
          </button>
        ))}
      </div>

      <div className="preview-frame-wrap">
        {iframeUrl && <iframe key={iframeUrl} src={iframeUrl} title="Form preview" />}
      </div>

      <div className="button-row">
        <button className="btn secondary" onClick={() => setStep("upload")}>
          Back
        </button>
        <button className="btn" onClick={() => setStep("configure")}>
          Continue to Configure
        </button>
      </div>
    </div>
  );
}
