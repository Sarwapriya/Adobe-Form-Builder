export type LocaleCode = "en" | "ar" | "he" | "ku";

export type LocalizedText = Partial<Record<LocaleCode, string>>;

export interface LocaleConfig {
  code: LocaleCode;
  label: string;
  direction: "ltr" | "rtl";
  isDefault: boolean;
}

export const LOCALE_CATALOG: Record<LocaleCode, { label: string; direction: "ltr" | "rtl" }> = {
  en: { label: "English", direction: "ltr" },
  ar: { label: "العربية", direction: "rtl" },
  he: { label: "עברית", direction: "rtl" },
  ku: { label: "کوردی", direction: "rtl" },
};

export function resolveLocalizedText(
  text: LocalizedText | undefined,
  locale: LocaleCode,
  defaultLocale: LocaleCode,
): string {
  return text?.[locale] ?? text?.[defaultLocale] ?? "";
}
