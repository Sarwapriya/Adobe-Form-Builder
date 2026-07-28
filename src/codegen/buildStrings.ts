import type { FormDefinition, LocaleCode } from "../schema";
import { DEFAULT_VALIDATION_MESSAGES, defaultLocaleOf, resolveLocalizedText } from "../schema";

export type StringTable = Record<string, string>;
export type StringsByLocale = Record<string, StringTable>;

const STATIC_UI_STRINGS: Record<LocaleCode, StringTable> = {
  en: { ui_submit: "Submit", ui_success: "Thank you — your submission was received.", ui_required_mark: "*" },
  ar: { ui_submit: "إرسال", ui_success: "شكرًا لك — تم استلام طلبك.", ui_required_mark: "*" },
  he: { ui_submit: "שלח", ui_success: "תודה — הבקשה שלך התקבלה.", ui_required_mark: "*" },
  ku: { ui_submit: "ناردن", ui_success: "سوپاس — داواکارییەکەت وەرگیرا.", ui_required_mark: "*" },
};

export function fieldLabelKey(fieldId: string): string {
  return `field_${fieldId}_label`;
}
export function fieldPlaceholderKey(fieldId: string): string {
  return `field_${fieldId}_placeholder`;
}
export function fieldHelpKey(fieldId: string): string {
  return `field_${fieldId}_help`;
}
export function fieldOptionKey(fieldId: string, optionId: string): string {
  return `field_${fieldId}_opt_${optionId}`;
}
export function fieldValidationKey(fieldId: string, ruleId: string): string {
  return `field_${fieldId}_val_${ruleId}`;
}
export function fieldRequiredKey(fieldId: string): string {
  return `field_${fieldId}_required_msg`;
}

export function buildStrings(form: FormDefinition): StringsByLocale {
  const defaultLocale = defaultLocaleOf(form.locales).code;
  const result: StringsByLocale = {};

  for (const localeConfig of form.locales) {
    const locale = localeConfig.code;
    const table: StringTable = { ...(STATIC_UI_STRINGS[locale] ?? STATIC_UI_STRINGS.en) };

    table.form_title = resolveLocalizedText(form.metadata.title, locale, defaultLocale);
    table.form_description = resolveLocalizedText(form.metadata.description, locale, defaultLocale);

    for (const field of form.fields) {
      table[fieldLabelKey(field.id)] = resolveLocalizedText(field.label, locale, defaultLocale);
      if (field.placeholder) {
        table[fieldPlaceholderKey(field.id)] = resolveLocalizedText(field.placeholder, locale, defaultLocale);
      }
      if (field.helpText) {
        table[fieldHelpKey(field.id)] = resolveLocalizedText(field.helpText, locale, defaultLocale);
      }
      for (const option of field.options ?? []) {
        table[fieldOptionKey(field.id, option.id)] = resolveLocalizedText(option.label, locale, defaultLocale);
      }
      for (const rule of field.validations) {
        const custom = resolveLocalizedText(rule.message, locale, defaultLocale);
        const fallback = resolveLocalizedText(DEFAULT_VALIDATION_MESSAGES[rule.type], locale, defaultLocale);
        table[fieldValidationKey(field.id, rule.id)] = custom || fallback;
      }

      const explicitRequiredRule = field.validations.find((v) => v.type === "required");
      const requiredMessage = explicitRequiredRule
        ? resolveLocalizedText(explicitRequiredRule.message, locale, defaultLocale) ||
          resolveLocalizedText(DEFAULT_VALIDATION_MESSAGES.required, locale, defaultLocale)
        : resolveLocalizedText(DEFAULT_VALIDATION_MESSAGES.required, locale, defaultLocale);
      table[fieldRequiredKey(field.id)] = requiredMessage;
    }

    result[locale] = table;
  }

  return result;
}
