import type { FormVariant } from "../../codegen/types.ts";
import { SUBSIDIARY_CODES, SUBSIDIARY_DETAIL, resolveSubsidiaryCountryName } from "../../form/subsidiaryData.ts";
import { useBuilderStore } from "../../store/builderStore.ts";

export function ConfigureStep() {
  const config = useBuilderStore((s) => s.config);
  const setConfig = useBuilderStore((s) => s.setConfig);
  const setStep = useBuilderStore((s) => s.setStep);
  const form = useBuilderStore((s) => s.mapResult?.form);

  const selectedSubsidiaryCountries = config.subsidiaryCode ? SUBSIDIARY_DETAIL[config.subsidiaryCode] : undefined;

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
        <label htmlFor="fileNamePrefix">Output file name prefix (optional)</label>
        <input
          id="fileNamePrefix"
          type="text"
          placeholder="Leave blank to derive from the workbook's subsidiary + language (e.g. SEIL-EN)"
          value={config.fileNamePrefix ?? ""}
          onChange={(e) => setConfig({ fileNamePrefix: e.target.value })}
        />
      </div>

      <div className="field-row">
        <label htmlFor="subsidiaryCode">Subsidiary code</label>
        <select
          id="subsidiaryCode"
          value={config.subsidiaryCode ?? ""}
          onChange={(e) => setConfig({ subsidiaryCode: e.target.value })}
        >
          <option value="">None — use generic calling codes</option>
          {SUBSIDIARY_CODES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <p className="field-hint">
          {selectedSubsidiaryCountries
            ? `Populates the countryCode/callingCode dropdowns with: ${selectedSubsidiaryCountries
                .map((c) => resolveSubsidiaryCountryName(c.countryName, form?.meta.defaultLocale ?? "en_GB", form?.meta.defaultLocale ?? "en_GB"))
                .join(", ")}.`
            : "Leave unset to use the generic worldwide calling-code list instead of a Samsung subsidiary's country list."}
        </p>
      </div>

      <div className="field-row">
        <label htmlFor="faviconUrl">Favicon URL (optional)</label>
        <input
          id="faviconUrl"
          type="text"
          placeholder="Leave blank to omit a favicon tag"
          value={config.faviconUrl ?? ""}
          onChange={(e) => setConfig({ faviconUrl: e.target.value })}
        />
      </div>

      <div className="field-row">
        <label htmlFor="customFontsHref">Custom fonts stylesheet URL (optional)</label>
        <input
          id="customFontsHref"
          type="text"
          placeholder="Leave blank to fall back to system fonts"
          value={config.customFontsHref ?? ""}
          onChange={(e) => setConfig({ customFontsHref: e.target.value })}
        />
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
