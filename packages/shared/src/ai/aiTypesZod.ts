/**
 * Zod schema mirroring aiTypes.ts 1:1, hand-kept in sync (no z.infer
 * codegen — same convention as formDefinitionZod.ts). Every tool-call JSON
 * the model produces is validated against `aiToolCallSchema` before
 * aiAssistantService ever executes a read-only tool or stages a mutating
 * one as a pending AIAction — a malformed or hostile model response can't
 * reach a form.
 */
import { z } from "zod";
import { questionDefinitionSchema } from "../form/formDefinitionZod";

const statusSchema = z.enum(["draft", "published", "unpublished"]);

export const searchCampaignsArgsSchema = z.object({
  searchText: z.string().trim().min(1).max(200).optional(),
  projectCode: z.string().trim().min(1).max(100).optional(),
  status: statusSchema.optional(),
});

export const getCampaignArgsSchema = z.object({ formId: z.string().uuid() });
export const getCampaignQuestionsArgsSchema = z.object({ formId: z.string().uuid() });

export const searchQuestionsArgsSchema = z.object({
  searchText: z.string().trim().min(1).max(200),
  formId: z.string().uuid().optional(),
});

export const findSimilarCampaignsArgsSchema = z.object({ formId: z.string().uuid() });

export const findSimilarQuestionsArgsSchema = z.object({
  formId: z.string().uuid().optional(),
  questionId: z.string().optional(),
  text: z.string().trim().min(1).max(500).optional(),
});

export const validateFormArgsSchema = z.object({ formId: z.string().uuid() });

export const createCampaignArgsSchema = z.object({
  name: z.string().trim().min(1).max(200),
  subsidiaryId: z.string().trim().min(1),
  projectCode: z.string().trim().min(1).optional(),
});

export const cloneCampaignArgsSchema = z.object({
  sourceFormId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  subsidiaryId: z.string().trim().min(1),
  projectCode: z.string().trim().min(1).optional(),
});

export const addQuestionArgsSchema = z.object({ question: questionDefinitionSchema });

export const updateQuestionArgsSchema = z.object({
  questionId: z.string().min(1),
  patch: questionDefinitionSchema.partial(),
});

export const deleteQuestionArgsSchema = z.object({ questionId: z.string().min(1) });

export const reorderQuestionsArgsSchema = z.object({
  orderedQuestionIds: z.array(z.string().min(1)).min(1),
});

export const suggestQuestionsArgsSchema = z.object({
  topic: z.string().trim().min(1).max(300),
  count: z.number().int().min(1).max(10),
  locale: z.string().optional(),
});

export const translateQuestionsArgsSchema = z.object({
  questionIds: z.array(z.string().min(1)).min(1),
  targetLocale: z.string().min(1),
});

export const aiToolCallSchema = z.discriminatedUnion("tool", [
  z.object({ tool: z.literal("SEARCH_CAMPAIGNS"), args: searchCampaignsArgsSchema }),
  z.object({ tool: z.literal("GET_CAMPAIGN"), args: getCampaignArgsSchema }),
  z.object({ tool: z.literal("GET_CAMPAIGN_QUESTIONS"), args: getCampaignQuestionsArgsSchema }),
  z.object({ tool: z.literal("SEARCH_QUESTIONS"), args: searchQuestionsArgsSchema }),
  z.object({ tool: z.literal("FIND_SIMILAR_CAMPAIGNS"), args: findSimilarCampaignsArgsSchema }),
  z.object({ tool: z.literal("FIND_SIMILAR_QUESTIONS"), args: findSimilarQuestionsArgsSchema }),
  z.object({ tool: z.literal("VALIDATE_FORM"), args: validateFormArgsSchema }),
  z.object({ tool: z.literal("CREATE_CAMPAIGN"), args: createCampaignArgsSchema }),
  z.object({ tool: z.literal("CLONE_CAMPAIGN"), args: cloneCampaignArgsSchema }),
  z.object({ tool: z.literal("ADD_QUESTION"), args: addQuestionArgsSchema }),
  z.object({ tool: z.literal("UPDATE_QUESTION"), args: updateQuestionArgsSchema }),
  z.object({ tool: z.literal("DELETE_QUESTION"), args: deleteQuestionArgsSchema }),
  z.object({ tool: z.literal("REORDER_QUESTIONS"), args: reorderQuestionsArgsSchema }),
  z.object({ tool: z.literal("SUGGEST_QUESTIONS"), args: suggestQuestionsArgsSchema }),
  z.object({ tool: z.literal("TRANSLATE_QUESTIONS"), args: translateQuestionsArgsSchema }),
]);

export const aiChatRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  formId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4000),
});
