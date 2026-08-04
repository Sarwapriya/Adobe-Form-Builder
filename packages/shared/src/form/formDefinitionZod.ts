/**
 * Zod schema mirroring `formDefinition.ts` 1:1, hand-kept in sync (no z.infer codegen).
 * A change to one file needs a matching edit in the other.
 */
import { z } from "zod";

const localeTextMap = z.record(z.string(), z.string());

export const controlTypeSchema = z.enum(["radio", "checkbox", "text"]);

export const localeInfoSchema = z.object({
  code: z.string(),
  langSubtag: z.string(),
  isRtl: z.boolean(),
  sourceColumn: z.enum(["en_GB", "C", "D"]),
  label: z.string(),
});

export const answerDefinitionSchema = z.object({
  id: z.string(),
  order: z.number(),
  textByLocale: localeTextMap,
  image: z.object({ src: z.string(), alt: z.string().optional() }).optional(),
});

export const questionDefinitionSchema = z.object({
  id: z.string(),
  order: z.number(),
  controlType: controlTypeSchema,
  headingByLocale: localeTextMap,
  subheadingByLocale: localeTextMap,
  required: z.boolean(),
  answers: z.array(answerDefinitionSchema),
});

const localizedFieldMetaSchema = z.object({
  labelByLocale: localeTextMap,
  placeholderByLocale: localeTextMap.optional(),
});

const callingCodeFieldMetaSchema = localizedFieldMetaSchema.extend({
  dropdownFirstEntryByLocale: localeTextMap,
});

const privacyPolicyMetaSchema = z.object({
  textByLocale: localeTextMap,
  linkUrlByLocale: localeTextMap,
});

const termsAndConditionsMetaSchema = z.object({
  textByLocale: localeTextMap,
  urlByLocale: localeTextMap,
});

export const profileFieldSetSchema = z.object({
  email: localizedFieldMetaSchema.optional(),
  firstName: localizedFieldMetaSchema.optional(),
  lastName: localizedFieldMetaSchema.optional(),
  countryCode: localizedFieldMetaSchema.optional(),
  callingCode: callingCodeFieldMetaSchema.optional(),
  privacyPolicy: privacyPolicyMetaSchema.optional(),
  marketingOptin: localizedFieldMetaSchema.optional(),
  termsAndConditions: termsAndConditionsMetaSchema.optional(),
  submitButton: localizedFieldMetaSchema,
  redirectAfterSuccessUrlByLocale: localeTextMap.optional(),
  headingBeforeBreakByLocale: localeTextMap.optional(),
  headingAfterBreakByLocale: localeTextMap.optional(),
  requiredFieldNoteByLocale: localeTextMap.optional(),
  extraFieldsByLocale: z.record(z.string(), localeTextMap).optional(),
});

export const pageCopySchema = z.object({
  heading: z.string().optional(),
  subHeading: z.string().optional(),
  subHeadingUrlText: z.string().optional(),
  subHeadingUrl: z.string().optional(),
});

export const validationMessageSetSchema = z.object({
  requiredField: z.string().optional(),
  email: z.string().optional(),
  mobileNumber: z.string().optional(),
  modalMessage1: z.string().optional(),
  modalMessage2: z.string().optional(),
  modalButtonYes: z.string().optional(),
  modalButtonNo: z.string().optional(),
});

export const formDefinitionSchema = z.object({
  meta: z.object({
    subsidiary: z.string(),
    sourceFileName: z.string(),
    defaultLocale: z.string(),
  }),
  locales: z.array(localeInfoSchema),
  questions: z.array(questionDefinitionSchema),
  fields: profileFieldSetSchema,
  validationMessages: z.record(z.string(), validationMessageSetSchema),
  pageError: z.record(z.string(), pageCopySchema),
  thankYou: z.record(z.string(), pageCopySchema),
});
