import type { FormVariant } from "@formbuilder/shared";
import { useBuilderStore } from "../../store/builderStore.ts";

export function ConfigureStep() {
  const mapResult = useBuilderStore((s) => s.mapResult)!;
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
        <label htmlFor="project">Project code (optional)</label>
        <input
          id="project"
          type="text"
          placeholder="Leave blank to omit from the submission payload"
          value={config.project ?? ""}
          onChange={(e) => setConfig({ project: e.target.value })}
        />
      </div>

      <div className="field-row">
        <label>Channel (optional)</label>
        <input
          type="text"
          placeholder="Full Form channel"
          value={config.channel?.fullForm ?? ""}
          onChange={(e) => setConfig({ channel: { ...config.channel, fullForm: e.target.value } })}
        />
        <input
          type="text"
          placeholder="One-Click channel"
          value={config.channel?.oneClick ?? ""}
          onChange={(e) => setConfig({ channel: { ...config.channel, oneClick: e.target.value } })}
        />
      </div>

      <div className="field-row">
        <label>Channel detail (optional)</label>
        <input
          type="text"
          placeholder="Full Form channel detail"
          value={config.channelDetail?.fullForm ?? ""}
          onChange={(e) => setConfig({ channelDetail: { ...config.channelDetail, fullForm: e.target.value } })}
        />
        <input
          type="text"
          placeholder="One-Click channel detail"
          value={config.channelDetail?.oneClick ?? ""}
          onChange={(e) => setConfig({ channelDetail: { ...config.channelDetail, oneClick: e.target.value } })}
        />
      </div>

      <div className="field-row">
        <label>Source (optional)</label>
        <input
          type="text"
          placeholder="Full Form source"
          value={config.source?.fullForm ?? ""}
          onChange={(e) => setConfig({ source: { ...config.source, fullForm: e.target.value } })}
        />
        <input
          type="text"
          placeholder="One-Click source"
          value={config.source?.oneClick ?? ""}
          onChange={(e) => setConfig({ source: { ...config.source, oneClick: e.target.value } })}
        />
      </div>

      <div className="field-row">
        <div className="checkbox-row">
          <input
            type="checkbox"
            id="voucherRequired"
            checked={config.voucherRequired === "Y"}
            onChange={(e) => setConfig({ voucherRequired: e.target.checked ? "Y" : "N" })}
          />
          <label htmlFor="voucherRequired">Voucher required</label>
        </div>
      </div>

      <div className="field-row">
        <label>Question required status</label>
        <p style={{ fontSize: "0.85em", color: "#666", marginBottom: 8 }}>
          Uncheck to make a question optional (removes the <span className="star">*</span> marker).
        </p>
        {mapResult.form.questions.map((q) => (
          <div className="checkbox-row" key={q.id}>
            <input
              type="checkbox"
              id={`q-req-${q.id}`}
              checked={config.questionRequired?.[q.id] ?? true}
              onChange={(e) =>
                setConfig({
                  questionRequired: {
                    ...config.questionRequired,
                    [q.id]: e.target.checked,
                  },
                })
              }
            />
            <label htmlFor={`q-req-${q.id}`}>
              {q.id}: {q.headingByLocale["en_GB"] || "(no English text)"}
            </label>
          </div>
        ))}
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
