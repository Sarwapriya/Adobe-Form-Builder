import type { LocaleCode } from "../../schema";
import { LOCALE_CATALOG } from "../../schema";
import { useFormStore } from "../../store/formStore";

const DISPLAY_ORDER: LocaleCode[] = ["en", "ar", "he", "ku"];
const ENABLED_IN_MVP: Record<LocaleCode, boolean> = { en: true, ar: true, he: false, ku: false };

export function LanguageSelector() {
  const locales = useFormStore((s) => s.locales);
  const setLocales = useFormStore((s) => s.setLocales);
  const activeCodes = new Set(locales.map((l) => l.code));

  function toggle(code: LocaleCode) {
    if (!ENABLED_IN_MVP[code]) return;

    if (activeCodes.has(code)) {
      if (locales.length === 1) return;
      const next = locales.filter((l) => l.code !== code);
      if (!next.some((l) => l.isDefault)) next[0] = { ...next[0], isDefault: true };
      setLocales(next);
    } else {
      const catalogEntry = LOCALE_CATALOG[code];
      setLocales([
        ...locales,
        { code, label: catalogEntry.label, direction: catalogEntry.direction, isDefault: locales.length === 0 },
      ]);
    }
  }

  return (
    <div className="language-selector">
      <h3>Languages</h3>
      {DISPLAY_ORDER.map((code) => (
        <label key={code} className={"language-option" + (!ENABLED_IN_MVP[code] ? " disabled" : "")}>
          <input type="checkbox" checked={activeCodes.has(code)} disabled={!ENABLED_IN_MVP[code]} onChange={() => toggle(code)} />
          {LOCALE_CATALOG[code].label}
          {!ENABLED_IN_MVP[code] && <span className="coming-soon"> (coming soon)</span>}
        </label>
      ))}
    </div>
  );
}
