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
export { buildQuestionMasterRows, type QuestionMasterRow } from "./excel/questionMasterRows";
export { buildQuestionMasterWorkbook } from "./excel/questionMasterWorkbook";
export type { AnswerDefinition, CallingCodeFieldMeta, ConsentDefinition, ConsentToggleMeta, ControlType, FormDefinition, LangSubtag, LocaleCode, LocaleInfo, LocalizedFieldMeta, MobileNumberFieldMeta, PageCopy, PrivacyPolicyMeta, ProfileFieldSet, QuestionDefinition, TermsAndConditionsMeta, ValidationMessageSet, } from "./form/formDefinition";
export { resolveLocalizedText } from "./form/formDefinition";
export { formDefinitionSchema } from "./form/formDefinitionZod";
export { migrateDefaultLocale, type MigrateDefaultLocaleOptions } from "./form/localeMigration";
export { validateFormDefinition } from "./form/formDefinitionValidator";
export { applyContribution, validateContribution, type ContributionContent, type TranslationEntry, type TranslationTarget } from "./form/contribution";
export { contributionContentSchema, translationEntrySchema, translationTargetSchema } from "./form/contributionZod";
export { CALLING_CODES, findCallingCodeEntry, type CallingCodeEntry } from "./form/callingCodes";
export { resolveCountryName, subsidiaryCountryCodes } from "./form/subsidiaryData";
export { isRtlLangSubtag, langDisplayName, RTL_LANGS } from "./form/langNames";
export { READ_ONLY_AI_TOOLS, MUTATING_AI_TOOLS, SERVER_EXECUTED_AI_TOOLS, isMutatingAiTool, isServerExecutedAiTool, type AIToolName, type AIToolCall, type SearchCampaignsArgs, type GetCampaignArgs, type GetCampaignQuestionsArgs, type SearchQuestionsArgs, type FindSimilarCampaignsArgs, type FindSimilarQuestionsArgs, type ValidateFormArgs, type CreateCampaignArgs, type CloneCampaignArgs, type AddQuestionArgs, type UpdateQuestionArgs, type DeleteQuestionArgs, type ReorderQuestionsArgs, type SuggestQuestionsArgs, type TranslateQuestionsArgs, type AIChatRequest, type AIActionSummary, type AICampaignReference, type AIChatResponse, type AIConversationSummary, type AIConversationMessageView, type AIConversationDetail, type AIConfirmActionResponse, } from "./ai/aiTypes";
export { aiToolCallSchema, aiChatRequestSchema } from "./ai/aiTypesZod";
export { generateSolution } from "./codegen/generate";
export { defaultBuilderConfig, type AnalyticsConfig, type BuilderConfig, type FormVariant, type GeneratedFile, } from "./codegen/types";
export { resolveFileNames, type FileNames } from "./codegen/fileNames";
