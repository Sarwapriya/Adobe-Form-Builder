import type { LocaleConfig, LocalizedText } from "./locale";
import type { ValidationRule } from "./validations";
import type { ConditionRule } from "./conditions";
<<<<<<< HEAD
=======
import type { CountryConfig } from "./country";
>>>>>>> 569474c (update project)

export type FieldType =
  | "textbox"
  | "textarea"
  | "number"
  | "email"
<<<<<<< HEAD
=======
  | "phone"
>>>>>>> 569474c (update project)
  | "checkbox"
  | "radio"
  | "dropdown"
  | "heading"
  | "paragraph";

export type FieldWidth = "full" | "half" | "third";

<<<<<<< HEAD
=======
export type FieldGroup = "profile" | "question";

>>>>>>> 569474c (update project)
export interface FieldOption {
  id: string;
  value: string;
  label: LocalizedText;
<<<<<<< HEAD
=======
  imageUrl?: string;
>>>>>>> 569474c (update project)
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
<<<<<<< HEAD
=======
  group: FieldGroup;
  subheading?: LocalizedText;
>>>>>>> 569474c (update project)
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
<<<<<<< HEAD
=======
  countries: CountryConfig[];
>>>>>>> 569474c (update project)
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
<<<<<<< HEAD
=======
    countries: [],
>>>>>>> 569474c (update project)
    fields: [],
  };
}

export function defaultLocaleOf(locales: LocaleConfig[]): LocaleConfig {
  return locales.find((l) => l.isDefault) ?? locales[0];
}
