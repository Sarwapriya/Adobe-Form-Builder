/**
 * Wire contract for the FabriXAI-backed Form Builder assistant, shared
 * between the backend's ai.router.ts/aiAssistantService.ts and the
 * frontend's aiChatApi.ts/aiChatStore.ts — one source of truth, mirrored
 * by aiTypesZod.ts the same way formDefinition.ts/formDefinitionZod.ts are
 * hand-kept in sync (no z.infer codegen anywhere in this package).
 */
import type { LocaleCode, QuestionDefinition } from "../form/formDefinition";
export type AIToolName = "SEARCH_CAMPAIGNS" | "GET_CAMPAIGN" | "GET_CAMPAIGN_QUESTIONS" | "SEARCH_QUESTIONS" | "FIND_SIMILAR_CAMPAIGNS" | "FIND_SIMILAR_QUESTIONS" | "VALIDATE_FORM" | "CREATE_CAMPAIGN" | "CLONE_CAMPAIGN" | "ADD_QUESTION" | "UPDATE_QUESTION" | "DELETE_QUESTION" | "REORDER_QUESTIONS" | "SUGGEST_QUESTIONS" | "TRANSLATE_QUESTIONS";
/** Tools that only read data — executed inline by aiAssistantService and
 * never surfaced to the client as a pending action. */
export declare const READ_ONLY_AI_TOOLS: readonly AIToolName[];
/** Tools that propose a change — always staged as a pending AIAction row,
 * never executed until POST /ai/actions/:id/confirm. */
export declare const MUTATING_AI_TOOLS: readonly AIToolName[];
/** Of the mutating tools, the two with nothing to stage a draft edit into
 * (the form doesn't exist yet) — confirm executes these server-side via
 * formBuilderService.createForm. Every other mutating tool is applied
 * client-side via the exact same useFormBuilderStore.updateDefinition
 * every manual edit already goes through. */
export declare const SERVER_EXECUTED_AI_TOOLS: readonly AIToolName[];
export declare function isMutatingAiTool(tool: AIToolName): boolean;
export declare function isServerExecutedAiTool(tool: AIToolName): boolean;
export interface SearchCampaignsArgs {
    searchText?: string;
    projectCode?: string;
    status?: "draft" | "published" | "unpublished";
}
export interface GetCampaignArgs {
    formId: string;
}
export interface GetCampaignQuestionsArgs {
    formId: string;
}
export interface SearchQuestionsArgs {
    searchText: string;
    formId?: string;
}
export interface FindSimilarCampaignsArgs {
    formId: string;
}
export interface FindSimilarQuestionsArgs {
    formId?: string;
    questionId?: string;
    text?: string;
}
export interface ValidateFormArgs {
    formId: string;
}
export interface CreateCampaignArgs {
    name: string;
    subsidiaryId: string;
    projectCode?: string;
}
export interface CloneCampaignArgs {
    sourceFormId: string;
    name: string;
    subsidiaryId: string;
    projectCode?: string;
}
export interface AddQuestionArgs {
    question: QuestionDefinition;
}
export interface UpdateQuestionArgs {
    questionId: string;
    patch: Partial<QuestionDefinition>;
}
export interface DeleteQuestionArgs {
    questionId: string;
}
export interface ReorderQuestionsArgs {
    orderedQuestionIds: string[];
}
export interface SuggestQuestionsArgs {
    topic: string;
    count: number;
    locale?: LocaleCode;
}
export interface TranslateQuestionsArgs {
    questionIds: string[];
    targetLocale: LocaleCode;
}
export type AIToolCall = {
    tool: "SEARCH_CAMPAIGNS";
    args: SearchCampaignsArgs;
} | {
    tool: "GET_CAMPAIGN";
    args: GetCampaignArgs;
} | {
    tool: "GET_CAMPAIGN_QUESTIONS";
    args: GetCampaignQuestionsArgs;
} | {
    tool: "SEARCH_QUESTIONS";
    args: SearchQuestionsArgs;
} | {
    tool: "FIND_SIMILAR_CAMPAIGNS";
    args: FindSimilarCampaignsArgs;
} | {
    tool: "FIND_SIMILAR_QUESTIONS";
    args: FindSimilarQuestionsArgs;
} | {
    tool: "VALIDATE_FORM";
    args: ValidateFormArgs;
} | {
    tool: "CREATE_CAMPAIGN";
    args: CreateCampaignArgs;
} | {
    tool: "CLONE_CAMPAIGN";
    args: CloneCampaignArgs;
} | {
    tool: "ADD_QUESTION";
    args: AddQuestionArgs;
} | {
    tool: "UPDATE_QUESTION";
    args: UpdateQuestionArgs;
} | {
    tool: "DELETE_QUESTION";
    args: DeleteQuestionArgs;
} | {
    tool: "REORDER_QUESTIONS";
    args: ReorderQuestionsArgs;
} | {
    tool: "SUGGEST_QUESTIONS";
    args: SuggestQuestionsArgs;
} | {
    tool: "TRANSLATE_QUESTIONS";
    args: TranslateQuestionsArgs;
};
export interface AIChatRequest {
    conversationId?: string;
    formId?: string;
    message: string;
}
export interface AIActionSummary {
    id: string;
    actionType: AIToolName;
    /** Whether the UI must show an extra "are you sure" step (destructive
     * types like DELETE_QUESTION) on top of the normal Add/Apply click that
     * every pending action already requires. */
    requiresConfirmation: boolean;
    data: unknown;
}
export interface AICampaignReference {
    formId: string;
    name: string;
    status: string;
    questionCount: number;
    locales: string[];
    updatedAt: string;
}
export interface AIChatResponse {
    conversationId: string;
    message: string;
    actions: AIActionSummary[];
    references: AICampaignReference[];
}
export interface AIConversationSummary {
    id: string;
    formId: string | null;
    title: string | null;
    status: "active" | "archived";
    createdAt: string;
    updatedAt: string;
}
export interface AIConversationMessageView {
    id: string;
    role: "user" | "assistant" | "system" | "tool";
    message: string;
    createdAt: string;
}
export interface AIConversationDetail extends AIConversationSummary {
    messages: AIConversationMessageView[];
}
export interface AIConfirmActionResponse {
    actionId: string;
    actionType: AIToolName;
    executed: boolean;
    /** Set only for server-executed tools (CREATE_CAMPAIGN/CLONE_CAMPAIGN) —
     * the id of the form React should navigate to. */
    formId?: string;
    /** Echoes the action's payload back so a client-applied type can be
     * handed straight to useFormBuilderStore.updateDefinition. */
    data?: unknown;
}
