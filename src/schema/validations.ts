import type { LocalizedText } from "./locale";

export type ValidationType = "required" | "email" | "minLength" | "maxLength" | "regex";

export interface ValidationRule {
  id: string;
  type: ValidationType;
  param?: number | string;
  message: LocalizedText;
}

export const DEFAULT_VALIDATION_MESSAGES: Record<ValidationType, LocalizedText> = {
  required: { en: "This field is required.", ar: "هذا الحقل مطلوب." },
  email: { en: "Enter a valid email address.", ar: "أدخل بريدًا إلكترونيًا صالحًا." },
  minLength: { en: "Value is too short.", ar: "القيمة قصيرة جدًا." },
  maxLength: { en: "Value is too long.", ar: "القيمة طويلة جدًا." },
  regex: { en: "Value does not match the required format.", ar: "القيمة لا تطابق الصيغة المطلوبة." },
};

// Pure, dependency-free by design: codegen embeds this function's runtime
// source (fn.toString()) verbatim into generated form.js, so the same logic
// that drives the React preview also runs unmodified in the framework-free output.
export function evaluateValidation(type: ValidationType, value: string, param?: number | string): boolean {
  switch (type) {
    case "required":
      return value.trim().length > 0;
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case "minLength":
      return value.length >= Number(param);
    case "maxLength":
      return value.length <= Number(param);
    case "regex":
      try {
        return new RegExp(String(param)).test(value);
      } catch {
        return true;
      }
    default:
      return true;
  }
}
