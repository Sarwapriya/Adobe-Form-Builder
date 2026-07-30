import type { FormVariant } from "../../codegen/types.ts";
import { useBuilderStore } from "../../store/builderStore.ts";

export function ConfigureStep() {
  const config = useBuilderStore((s) => s.config);
  const setConfig = useBuilderStore((s) => s.setConfig);
  const setStep = useBuilderStore((s) => s.setStep);

  function toggleVariant(v: FormVariant) {
    const has = config.variants.includes(v);
    const next = has ? config.variants.filter((x) => x !== v) : [...config.variants, v];
    if (next.length > 0) setConfig({ variants: next });
  }

  return (
    <div className="panel">
      <h2>Configure</h2>

      <div className="field-row">
        <label>Form variant(s) to generate</label>
        <div className="checkbox-row">
          <input
            type="checkbox"
            id="variant-ff"
            checked={config.variants.includes("ff")}
            onChange={() => toggleVariant("ff")}
          />
          <label htmlFor="variant-ff">Full Form (name, email, phone, questions)</label>
        </div>
        <div className="checkbox-row">
          <input
            type="checkbox"
            id="variant-oc"
            checked={config.variants.includes("oc")}
            onChange={() => toggleVariant("oc")}
          />
          <label htmlFor="variant-oc">One-Click (phone + questions only)</label>
        </div>
      </div>

      <div className="field-row">
        <label htmlFor="endpoint">Submission API endpoint (optional)</label>
        <input
          id="endpoint"
          type="url"
          placeholder="Leave blank to only validate locally — no real network submission"
          value={config.apiEndpoint ?? ""}
          onChange={(e) => setConfig({ apiEndpoint: e.target.value })}
        />
      </div>

      <div className="field-row">
        <div className="checkbox-row">
          <input
            type="checkbox"
            id="analytics-enabled"
            checked={config.analytics?.enabled ?? false}
            onChange={(e) => setConfig({ analytics: { ...config.analytics, enabled: e.target.checked } })}
          />
          <label htmlFor="analytics-enabled">Enable Adobe Analytics/Launch tracking</label>
        </div>
        {config.analytics?.enabled && (
          <>
            <input
              type="text"
              placeholder="Report Suite ID"
              value={config.analytics.reportSuiteID ?? ""}
              onChange={(e) => setConfig({ analytics: { ...config.analytics!, reportSuiteID: e.target.value } })}
            />
            <input
              type="text"
              placeholder="IMS Org ID"
              value={config.analytics.imsOrgID ?? ""}
              onChange={(e) => setConfig({ analytics: { ...config.analytics!, imsOrgID: e.target.value } })}
            />
            <input
              type="text"
              placeholder="Datastream ID"
              value={config.analytics.datastreamID ?? ""}
              onChange={(e) => setConfig({ analytics: { ...config.analytics!, datastreamID: e.target.value } })}
            />
          </>
        )}
      </div>

      <div className="button-row">
        <button className="btn secondary" onClick={() => setStep("preview")}>
          Back
        </button>
        <button className="btn" onClick={() => setStep("generate")}>
          Continue to Generate
        </button>
      </div>
    </div>
  );
}
