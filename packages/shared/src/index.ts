/**
 * Public API surface of @formbuilder/shared. Only symbols re-exported from this file
 * are the package's stable contract — internal modules (subsidiaryData, callingCodes,
 * domIds, escaping, etc.) are implementation details of the codegen/excel pipeline and
 * intentionally not exported here.
 */

// Issue/ValidationResult (from excel/types.ts) are also the shared vocabulary
// for the non-Excel, schema-authored validator below (form/formDefinitionValidator.ts)
// and for contribution merging (form/contribution.ts) — kept even though the
// Excel parsing/mapping/validation pipeline itself has been removed.
export type { Issue, ParsedWorkbook, RawRow, ValidationResult, WorkbookMeta } from "./excel/types";

// Question Master admin export — flat per-(subsidiary, locale, question/field) report,
// project-wise, compiled from published FormDefinitions (see questionMasterService.ts
// in the backend for the per-project orchestration).
export { buildQuestionMasterRows, type QuestionMasterRow } from "./excel/questionMasterRows";
export { buildQuestionMasterWorkbook } from "./excel/questionMasterWorkbook";

// FormDefinition data model + runtime Zod validation
export type {
  AnswerDefinition,
  CallingCodeFieldMeta,
  ConsentDefinition,
  ConsentToggleMeta,
  ControlType,
  FormDefinition,
  LangSubtag,
  LocaleCode,
  LocaleInfo,
  LocalizedFieldMeta,
  MobileNumberFieldMeta,
  PageCopy,
  PrivacyPolicyMeta,
  ProfileFieldSet,
  QuestionDefinition,
  TermsAndConditionsMeta,
  ValidationMessageSet,
} from "./form/formDefinition";
export { resolveLocalizedText, resolveMobileNumberCountries } from "./form/formDefinition";
export { formDefinitionSchema } from "./form/formDefinitionZod";
export { migrateDefaultLocale, remapLocalesForCopy, type MigrateDefaultLocaleOptions } from "./form/localeMigration";

// Schema-authored (builder) form validation — the non-Excel counterpart to validateWorkbook
export { validateFormDefinition } from "./form/formDefinitionValidator";

// Subsidiary-user contributions (translations + additive questions/consents) to a
// published form — see contribution.ts's own doc comment.
export { applyContribution, validateContribution, targetKey, type ContributionContent, type TranslationEntry, type TranslationTarget } from "./form/contribution";
export { contributionContentSchema, translationEntrySchema, translationTargetSchema } from "./form/contributionZod";

// Country/calling-code lookup — needed by a builder UI's own Mobile Number field
// configuration (country picker); the Samsung-specific subsidiaryData.ts tables stay
// internal, only this generic table plus resolveCountryName (a single purpose-built
// lookup, not the raw Samsung tables themselves) are part of the public surface.
export { CALLING_CODES, findCallingCodeEntry, type CallingCodeEntry } from "./form/callingCodes";
export { resolveCountryName, subsidiaryCountryCodes } from "./form/subsidiaryData";

// Locale/RTL helpers — needed by a builder UI's own locale setup, since it has no
// Excel metadata row to derive LocaleInfo from automatically.
export { isRtlLangSubtag, langDisplayName, RTL_LANGS } from "./form/langNames";

// FabriXAI-backed Form Builder assistant — chat/tool-call wire contract shared
// between the backend's ai.router.ts/aiAssistantService.ts and the frontend's
// aiChatApi.ts/aiChatStore.ts. See aiTypes.ts's own doc comment.
export {
  READ_ONLY_AI_TOOLS,
  MUTATING_AI_TOOLS,
  SERVER_EXECUTED_AI_TOOLS,
  isMutatingAiTool,
  isServerExecutedAiTool,
  type AIToolName,
  type AIToolCall,
  type SearchCampaignsArgs,
  type GetCampaignArgs,
  type GetCampaignQuestionsArgs,
  type SearchQuestionsArgs,
  type FindSimilarCampaignsArgs,
  type FindSimilarQuestionsArgs,
  type ValidateFormArgs,
  type CreateCampaignArgs,
  type CloneCampaignArgs,
  type AddQuestionArgs,
  type UpdateQuestionArgs,
  type DeleteQuestionArgs,
  type ReorderQuestionsArgs,
  type SuggestQuestionsArgs,
  type TranslateQuestionsArgs,
  type AIChatRequest,
  type AIActionSummary,
  type AICampaignReference,
  type AIChatResponse,
  type AIConversationSummary,
  type AIConversationMessageView,
  type AIConversationDetail,
  type AIConfirmActionResponse,
} from "./ai/aiTypes";
export { aiToolCallSchema, aiChatRequestSchema } from "./ai/aiTypesZod";

// Codegen pipeline
export { generateSolution } from "./codegen/generate";
export {
  defaultBuilderConfig,
  type AnalyticsConfig,
  type BuilderConfig,
  type FormVariant,
  type GeneratedFile,
} from "./codegen/types";
export { resolveFileNames, type FileNames } from "./codegen/fileNames";
