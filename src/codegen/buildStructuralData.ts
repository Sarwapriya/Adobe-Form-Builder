import type { FormDefinition } from "../schema";
import { defaultLocaleOf } from "../schema";

export interface StructuralOption {
  id: string;
  value: string;
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
  hasPlaceholder: boolean;
  hasHelp: boolean;
  defaultValue?: string;
  options?: StructuralOption[];
  validations: StructuralValidation[];
  conditions: StructuralCondition[];
}

export interface StructuralForm {
  defaultLocale: string;
  fields: StructuralField[];
}

// Strips per-locale text out of the FormDefinition, leaving only the
// locale-agnostic shape that gets embedded as FORM_DEFINITION in app.js;
// actual display text is looked up separately from the STRINGS table (buildStrings.ts).
export function buildStructuralData(form: FormDefinition): StructuralForm {
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
  };
}
