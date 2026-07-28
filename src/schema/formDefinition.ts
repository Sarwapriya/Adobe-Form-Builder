import type { LocaleConfig, LocalizedText } from "./locale";
import type { ValidationRule } from "./validations";
import type { ConditionRule } from "./conditions";

export type FieldType =
  | "textbox"
  | "textarea"
  | "number"
  | "email"
  | "checkbox"
  | "radio"
  | "dropdown"
  | "heading"
  | "paragraph";

export type FieldWidth = "full" | "half" | "third";

export interface FieldOption {
  id: string;
  value: string;
  label: LocalizedText;
}

export interface FieldDefinition {
  id: string;
  type: FieldType;
  name: string;
  label: LocalizedText;
  placeholder?: LocalizedText;
  helpText?: LocalizedText;
  defaultValue?: string;
  required: boolean;
  width: FieldWidth;
  order: number;
  options?: FieldOption[];
  validations: ValidationRule[];
  conditions: ConditionRule[];
}

export interface FormMetadata {
  id: string;
  title: LocalizedText;
  description?: LocalizedText;
  createdAt: string;
  updatedAt: string;
}

export const CURRENT_SCHEMA_VERSION = 1 as const;

export interface FormDefinition {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  metadata: FormMetadata;
  locales: LocaleConfig[];
  fields: FieldDefinition[];
}

export function createEmptyForm(): FormDefinition {
  const now = new Date().toISOString();
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    metadata: {
      id: "form-" + Math.random().toString(36).slice(2, 10),
      title: { en: "Untitled Form" },
      createdAt: now,
      updatedAt: now,
    },
    locales: [{ code: "en", label: "English", direction: "ltr", isDefault: true }],
    fields: [],
  };
}

export function defaultLocaleOf(locales: LocaleConfig[]): LocaleConfig {
  return locales.find((l) => l.isDefault) ?? locales[0];
}
