import type { FormDefinition } from "../schema";
import { defaultLocaleOf } from "../schema";
<<<<<<< HEAD
=======
import { resolveLocaleIdentifier } from "./localeIdentifier";
>>>>>>> 569474c (update project)

export interface StructuralOption {
  id: string;
  value: string;
<<<<<<< HEAD
=======
  imageUrl?: string;
>>>>>>> 569474c (update project)
}

export interface StructuralValidation {
  id: string;
  type: string;
  param?: number | string;
}

export interface StructuralCondition {
  id: string;
  sourceFieldId: string;
  operator: string;
  value?: string;
  action: string;
}

export interface StructuralField {
  id: string;
  type: string;
  name: string;
  required: boolean;
  width: string;
  order: number;
<<<<<<< HEAD
=======
  group: string;
  questionNumber?: number;
  hasSubheading: boolean;
>>>>>>> 569474c (update project)
  hasPlaceholder: boolean;
  hasHelp: boolean;
  defaultValue?: string;
  options?: StructuralOption[];
  validations: StructuralValidation[];
  conditions: StructuralCondition[];
}

<<<<<<< HEAD
export interface StructuralForm {
  defaultLocale: string;
  fields: StructuralField[];
=======
export interface StructuralCountry {
  id: string;
  countryCode: string;
  callingCode: string;
  languages: string[];
  isDefault: boolean;
}

export interface StructuralForm {
  defaultLocale: string;
  fields: StructuralField[];
  countries: StructuralCountry[];
>>>>>>> 569474c (update project)
}

// Strips per-locale text out of the FormDefinition, leaving only the
// locale-agnostic shape that gets embedded as FORM_DEFINITION in app.js;
// actual display text is looked up separately from the STRINGS table (buildStrings.ts).
export function buildStructuralData(form: FormDefinition): StructuralForm {
<<<<<<< HEAD
  return {
    defaultLocale: defaultLocaleOf(form.locales).code,
    fields: [...form.fields]
      .sort((a, b) => a.order - b.order)
      .map((field) => ({
        id: field.id,
        type: field.type,
        name: field.name,
        required: field.required,
        width: field.width,
        order: field.order,
        hasPlaceholder: Boolean(field.placeholder),
        hasHelp: Boolean(field.helpText),
        defaultValue: field.defaultValue,
        options: field.options?.map((o) => ({ id: o.id, value: o.value })),
        validations: field.validations.map((v) => ({ id: v.id, type: v.type, param: v.param })),
        conditions: field.conditions.map((c) => ({
          id: c.id,
          sourceFieldId: c.sourceFieldId,
          operator: c.operator,
          value: c.value,
          action: c.action,
        })),
      })),
=======
  const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);
  let questionCounter = 0;

  return {
    defaultLocale: resolveLocaleIdentifier(defaultLocaleOf(form.locales).code, form.countries),
    fields: sortedFields.map((field) => ({
      id: field.id,
      type: field.type,
      name: field.name,
      required: field.required,
      width: field.width,
      order: field.order,
      group: field.group,
      questionNumber: field.group === "question" ? ++questionCounter : undefined,
      hasSubheading: Boolean(field.subheading),
      hasPlaceholder: Boolean(field.placeholder),
      hasHelp: Boolean(field.helpText),
      defaultValue: field.defaultValue,
      options: field.options?.map((o) => ({ id: o.id, value: o.value, imageUrl: o.imageUrl })),
      validations: field.validations.map((v) => ({ id: v.id, type: v.type, param: v.param })),
      conditions: field.conditions.map((c) => ({
        id: c.id,
        sourceFieldId: c.sourceFieldId,
        operator: c.operator,
        value: c.value,
        action: c.action,
      })),
    })),
    countries: form.countries.map((c) => ({
      id: c.id,
      countryCode: c.countryCode,
      callingCode: c.callingCode,
      languages: c.languages,
      isDefault: c.isDefault,
    })),
>>>>>>> 569474c (update project)
  };
}
