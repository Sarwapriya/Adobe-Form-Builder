import type { LocaleConfig, LocalizedText } from "../../schema";

interface Props {
  label: string;
  value: LocalizedText | undefined;
  locales: LocaleConfig[];
  multiline?: boolean;
  onChange: (next: LocalizedText) => void;
}

export function LocalizedTextInput({ label, value, locales, multiline, onChange }: Props) {
  return (
    <div className="localized-text-input">
      <span className="field-group-label">{label}</span>
      {locales.map((locale) => (
        <label key={locale.code} className="localized-text-row">
          <span className="locale-tag">{locale.code.toUpperCase()}</span>
          {multiline ? (
            <textarea
              dir={locale.direction}
              value={value?.[locale.code] ?? ""}
              onChange={(e) => onChange({ ...value, [locale.code]: e.target.value })}
            />
          ) : (
            <input
              type="text"
              dir={locale.direction}
              value={value?.[locale.code] ?? ""}
              onChange={(e) => onChange({ ...value, [locale.code]: e.target.value })}
            />
          )}
        </label>
      ))}
    </div>
  );
}
