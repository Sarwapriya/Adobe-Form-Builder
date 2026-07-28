import { z } from "zod";

const localizedTextSchema = z.object({
  en: z.string().optional(),
  ar: z.string().optional(),
  he: z.string().optional(),
  ku: z.string().optional(),
});

const localeConfigSchema = z.object({
  code: z.enum(["en", "ar", "he", "ku"]),
  label: z.string(),
  direction: z.enum(["ltr", "rtl"]),
  isDefault: z.boolean(),
});

const validationRuleSchema = z.object({
  id: z.string(),
  type: z.enum(["required", "email", "minLength", "maxLength", "regex"]),
  param: z.union([z.number(), z.string()]).optional(),
  message: localizedTextSchema,
});

const conditionRuleSchema = z.object({
  id: z.string(),
  sourceFieldId: z.string(),
  operator: z.enum(["equals", "notEquals", "contains", "isEmpty", "isNotEmpty"]),
  value: z.string().optional(),
  action: z.enum(["show", "hide", "enable", "disable", "require", "optional"]),
});

const fieldOptionSchema = z.object({
  id: z.string(),
  value: z.string(),
  label: localizedTextSchema,
});

const fieldDefinitionSchema = z.object({
  id: z.string(),
  type: z.enum(["textbox", "textarea", "number", "email", "checkbox", "radio", "dropdown", "heading", "paragraph"]),
  name: z.string(),
  label: localizedTextSchema,
  placeholder: localizedTextSchema.optional(),
  helpText: localizedTextSchema.optional(),
  defaultValue: z.string().optional(),
  required: z.boolean(),
  width: z.enum(["full", "half", "third"]),
  order: z.number(),
  options: z.array(fieldOptionSchema).optional(),
  validations: z.array(validationRuleSchema),
  conditions: z.array(conditionRuleSchema),
});

const formMetadataSchema = z.object({
  id: z.string(),
  title: localizedTextSchema,
  description: localizedTextSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const formDefinitionSchema = z.object({
  schemaVersion: z.literal(1),
  metadata: formMetadataSchema,
  locales: z.array(localeConfigSchema).min(1),
  fields: z.array(fieldDefinitionSchema),
});
