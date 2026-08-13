/**
 * Public API surface of @formbuilder/shared. Only symbols re-exported from this file
 * are the package's stable contract — internal modules (subsidiaryData, callingCodes,
 * domIds, escaping, etc.) are implementation details of the codegen/excel pipeline and
 * intentionally not exported here.
 */
export { isSupportedExcelFile, parseWorkbook } from "./excel/parser";
export { mapWorkbook, type MapResult } from "./excel/mapper";
export { validateWorkbook } from "./excel/validator";
export { resolveLocales, ENGLISH_LOCALE, type LocaleResolution, type UnresolvedLocale } from "./excel/localeDetection";
export type { Issue, ParsedWorkbook, RawRow, ValidationResult, WorkbookMeta } from "./excel/types";
export type { AnswerDefinition, CallingCodeFieldMeta, ConsentDefinition, ConsentToggleMeta, ControlType, FormDefinition, LangSubtag, LocaleCode, LocaleInfo, LocalizedFieldMeta, MobileNumberFieldMeta, PageCopy, PrivacyPolicyMeta, ProfileFieldSet, QuestionDefinition, TermsAndConditionsMeta, ValidationMessageSet, } from "./form/formDefinition";
export { resolveLocalizedText } from "./form/formDefinition";
export { formDefinitionSchema } from "./form/formDefinitionZod";
export { migrateDefaultLocale, type MigrateDefaultLocaleOptions } from "./form/localeMigration";
export { validateFormDefinition } from "./form/formDefinitionValidator";
export { applyContribution, validateContribution, type ContributionContent, type TranslationEntry, type TranslationTarget } from "./form/contribution";
export { contributionContentSchema, translationEntrySchema, translationTargetSchema } from "./form/contributionZod";
export { CALLING_CODES, findCallingCodeEntry, type CallingCodeEntry } from "./form/callingCodes";
export { isRtlLangSubtag, langDisplayName, RTL_LANGS } from "./form/langNames";
export { generateSolution } from "./codegen/generate";
export { defaultBuilderConfig, type AnalyticsConfig, type BuilderConfig, type FormVariant, type GeneratedFile, } from "./codegen/types";
export { resolveFileNames, type FileNames } from "./codegen/fileNames";
