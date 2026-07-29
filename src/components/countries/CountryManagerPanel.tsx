import type { LocaleCode } from "../../schema";
import { useFormStore } from "../../store/formStore";
import { LocalizedTextInput } from "../propertyPanel/LocalizedTextInput";

interface Props {
  onClose: () => void;
}

export function CountryManagerPanel({ onClose }: Props) {
  const locales = useFormStore((s) => s.locales);
  const countries = useFormStore((s) => s.countries);
  const addCountry = useFormStore((s) => s.addCountry);
  const updateCountry = useFormStore((s) => s.updateCountry);
  const removeCountry = useFormStore((s) => s.removeCountry);

  function toggleLanguage(countryId: string, code: LocaleCode, languages: LocaleCode[]) {
    const next = languages.includes(code) ? languages.filter((l) => l !== code) : [...languages, code];
    updateCountry(countryId, { languages: next });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Countries &amp; Locales</h3>
          <button type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="hint-text">
          Countries drive the calling-code options for Phone fields and the locale identifiers (e.g. en_AE) used in
          generated forms.
        </p>

        {countries.length === 0 && <p className="hint-text">No countries configured yet.</p>}

        {countries.map((country) => (
          <div key={country.id} className="country-row-editor">
            <div className="country-row-fields">
              <label className="field-group">
                <span className="field-group-label">ISO code</span>
                <input
                  type="text"
                  value={country.countryCode}
                  placeholder="AE"
                  onChange={(e) => updateCountry(country.id, { countryCode: e.target.value.toUpperCase() })}
                />
              </label>

              <label className="field-group">
                <span className="field-group-label">Calling code</span>
                <input
                  type="text"
                  value={country.callingCode}
                  placeholder="971"
                  onChange={(e) => updateCountry(country.id, { callingCode: e.target.value })}
                />
              </label>

              <label className="field-group inline">
                <input
                  type="checkbox"
                  checked={country.isDefault}
                  onChange={(e) => updateCountry(country.id, { isDefault: e.target.checked })}
                />
                <span>Default country</span>
              </label>
            </div>

            <LocalizedTextInput
              label="Country name"
              value={country.name}
              locales={locales}
              onChange={(name) => updateCountry(country.id, { name })}
            />

            <div className="field-group">
              <span className="field-group-label">Supported languages</span>
              <div className="country-language-checkboxes">
                {locales.map((locale) => (
                  <label key={locale.code} className="field-group inline">
                    <input
                      type="checkbox"
                      checked={country.languages.includes(locale.code)}
                      onChange={() => toggleLanguage(country.id, locale.code, country.languages)}
                    />
                    <span>{locale.code.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="button" className="remove-country-button" onClick={() => removeCountry(country.id)}>
              Remove country
            </button>
          </div>
        ))}

        <button type="button" className="add-option-button" onClick={addCountry}>
          + Add country
        </button>
      </div>
    </div>
  );
}
