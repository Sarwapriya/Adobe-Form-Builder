import type { CountryConfig, LocaleCode } from "../schema";

// Combines a language code with its configured country (e.g. "en" + "AE" -> "en_AE"),
// matching the locale-identifier convention used by the reference Samsung format.
// Falls back to the bare language code when no country is configured for it.
export function resolveLocaleIdentifier(localeCode: LocaleCode, countries: CountryConfig[]): string {
  const country =
    countries.find((c) => c.isDefault && c.languages.includes(localeCode)) ??
    countries.find((c) => c.languages.includes(localeCode));
  return country ? `${localeCode}_${country.countryCode}` : localeCode;
}
