import type { LocaleCode, LocalizedText } from "./locale";

export interface CountryConfig {
  id: string;
  countryCode: string;
  name: LocalizedText;
  callingCode: string;
  languages: LocaleCode[];
  isDefault: boolean;
}
