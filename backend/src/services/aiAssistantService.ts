import crypto from "node:crypto";
import { z } from "zod";
import {
  aiToolCallSchema,
  isMutatingAiTool,
  isServerExecutedAiTool,
  type AIActionSummary,
  type AIChatRequest,
  type AIChatResponse,
  type AIConfirmActionResponse,
  type AIConversationDetail,
  type AIConversationSummary,
  type AIToolCall,
  type AIToolName,
  type AnswerDefinition,
  type CloneCampaignArgs,
  type CreateCampaignArgs,
  type LocaleCode,
  type QuestionDefinition,
  type SuggestQuestionsArgs,
  type TranslateQuestionsArgs,
} from "@formbuilder/shared";
import { AppDataSource } from "../config/data-source";
import { AIAction } from "../entities/AIAction";
import { AIConversation } from "../entities/AIConversation";
import { AIConversationMessage, type AIMessageRole } from "../entities/AIConversationMessage";
import { isAdminRole } from "../entities/User";
import type { AccessTokenPayload } from "./authService";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors";
import * as aiCampaignTools from "./aiCampaignTools";
import { buildSystemPrompt } from "./aiSystemPrompt";
import { sendMessage as sendAiMessage, type AiChatTurn } from "./aiProviderService";
import { createForm, getFormDetail } from "./formBuilderService";
import { getAccessibleFormDetail } from "./formAccessService";

/**
 * The orchestrator: the one place in the backend that talks to the AI
 * provider (FabriX or Claude, whichever is currently active — see
 * aiProviderService.ts) and decides what to do with its reply (see the
 * plan's §6). Every route in ai.router.ts is a thin wrapper over the
 * functions here. This file never imports a specific provider's service
 * directly — sendAiMessage dispatches to whichever one is configured active,
 * so nothing here needs to know or care which provider actually ran.
 *
 * Conversation history is always resent in full on every call (bounded to
 * the last ~20 messages) rather than relying on any provider's own
 * conversation-state — this backend is the only source of truth for what a
 * conversation contains, regardless of which provider is active.
 */

const HISTORY_LIMIT = 20;
const FALLBACK_MESSAGE = "The AI service is temporarily unavailable. Please try again.";

function toCallerContext(auth: AccessTokenPayload): aiCampaignTools.AiToolCallerContext {
  return { userId: auth.sub, role: auth.role, subsidiaryId: auth.subsidiaryId };
}

function section(label: string, content: string): string {
  return `[${label}]\n${content}`;
}

async function persistMessage(
  conversationId: string,
  role: AIMessageRole,
  message: string,
  extra?: { tokenUsage?: number | null; model?: string | null; requestId?: string | null },
): Promise<void> {
  const repo = AppDataSource.getRepository(AIConversationMessage);
  await repo.save(
    repo.create({
      conversationId,
      role,
      message,
      tokenUsage: extra?.tokenUsage ?? null,
      model: extra?.model ?? null,
      requestId: extra?.requestId ?? null,
    }),
  );
  await AppDataSource.getRepository(AIConversation).update(conversationId, { updatedAt: new Date() });
}

/** Ownership-check helper mirroring uploadService.findOwnedUpload's own
 * convention: returns null identically whether the conversation doesn't
 * exist or isn't the caller's, so a 404 never leaks which case occurred.
 * Admins bypass (used by getConversation/confirmAction/rejectAction — never
 * by sendChatMessage, which is always strictly the caller's own session). */
async function findOwnedConversation(conversationId: string, auth: AccessTokenPayload): Promise<AIConversation | null> {
  const repo = AppDataSource.getRepository(AIConversation);
  if (isAdminRole(auth.role)) {
    return repo.findOne({ where: { id: conversationId } });
  }
  return repo.findOne({ where: { id: conversationId, userId: auth.sub } });
}

async function loadOrCreateConversation(auth: AccessTokenPayload, request: AIChatRequest): Promise<AIConversation> {
  if (request.conversationId) {
    const repo = AppDataSource.getRepository(AIConversation);
    const existing = await repo.findOne({ where: { id: request.conversationId, userId: auth.sub } });
    if (!existing) throw new NotFoundError("conversation not found");
    return existing;
  }

  const repo = AppDataSource.getRepository(AIConversation);
  const title = request.message.length > 80 ? `${request.message.slice(0, 77)}...` : request.message;
  return repo.save(
    repo.create({
      userId: auth.sub,
      formId: request.formId ?? null,
      title,
      status: "active",
    }),
  );
}

/** Extracts a single fenced ```json ...``` block from free-form model text
 * and parses it, returning null if no such block exists or it isn't valid
 * JSON. Used both for tool-call detection and for the SUGGEST_QUESTIONS/
 * TRANSLATE_QUESTIONS re-prompt responses below. */
function extractFencedJson(text: string): { value: unknown; matchedBlock: string } | null {
  const match = text.match(/```json\s*([\s\S]*?)```/i);
  if (!match) return null;
  try {
    return { value: JSON.parse(match[1]), matchedBlock: match[0] };
  } catch {
    return null;
  }
}

function extractToolCall(replyText: string): { call: AIToolCall; remainderText: string } | null {
  const extracted = extractFencedJson(replyText);
  if (!extracted) return null;
  const parsed = aiToolCallSchema.safeParse(extracted.value);
  if (!parsed.success) return null;
  return { call: parsed.data, remainderText: replyText.replace(extracted.matchedBlock, "").trim() };
}

function buildBaseTurns(campaignContextJson: string | null, historyRows: AIConversationMessage[]): AiChatTurn[] {
  const turns: AiChatTurn[] = [{ role: "system", content: buildSystemPrompt() }];
  if (campaignContextJson) {
    turns.push({ role: "system", content: section("CAMPAIGN DATA", campaignContextJson) });
  }
  for (const row of historyRows) {
    if (row.role === "user" || row.role === "assistant") {
      turns.push({ role: row.role, content: row.message });
    }
  }
  return turns;
}

function actionSummary(action: AIAction): AIActionSummary {
  return {
    id: action.id,
    actionType: action.actionType,
    requiresConfirmation: action.actionType === "DELETE_QUESTION",
    data: JSON.parse(action.requestJson) as unknown,
  };
}

async function createPendingAction(params: {
  conversationId: string;
  formId: string | null;
  userId: string;
  actionType: AIToolName;
  args: unknown;
}): Promise<AIAction> {
  const repo = AppDataSource.getRepository(AIAction);
  return repo.save(
    repo.create({
      conversationId: params.conversationId,
      formId: params.formId,
      userId: params.userId,
      actionType: params.actionType,
      requestJson: JSON.stringify(params.args),
      responseJson: null,
      confirmed: false,
      executed: false,
      executionResult: null,
    }),
  );
}

// --- SUGGEST_QUESTIONS / TRANSLATE_QUESTIONS: no real "tool" backs these —
// the model generates the actual content, which is then parsed into one
// ADD_QUESTION/UPDATE_QUESTION-shaped AIAction per resulting question so
// confirming reuses the exact same client-applied path a manual add/update
// already goes through (see aiTypes.ts's own doc comment on this). ---------

const rawSuggestedQuestionSchema = z.object({
  heading: z.string().trim().min(1),
  controlType: z.enum(["radio", "checkbox", "text", "shortText", "dropdown"]).optional(),
  required: z.boolean().optional(),
  answers: z.array(z.string().trim().min(1)).optional(),
});
const rawSuggestedQuestionsSchema = z.object({ questions: z.array(rawSuggestedQuestionSchema).min(1) });

function buildAnswer(text: string, order: number, locale: LocaleCode, defaultLocale: LocaleCode): AnswerDefinition {
  const textByLocale: Record<LocaleCode, string> = { [defaultLocale]: text };
  if (locale !== defaultLocale) textByLocale[locale] = text;
  return { id: `A${order}`, order, textByLocale };
}

function buildSuggestedQuestion(
  raw: z.infer<typeof rawSuggestedQuestionSchema>,
  order: number,
  locale: LocaleCode,
  defaultLocale: LocaleCode,
): QuestionDefinition {
  const headingByLocale: Record<LocaleCode, string> = { [defaultLocale]: raw.heading };
  if (locale !== defaultLocale) headingByLocale[locale] = raw.heading;
  const answers = (raw.answers ?? []).map((text, i) => buildAnswer(text, i + 1, locale, defaultLocale));
  return {
    id: `Q_ai_${crypto.randomUUID().slice(0, 8)}`,
    order,
    controlType: raw.controlType ?? (answers.length > 0 ? "radio" : "text"),
    headingByLocale,
    subheadingByLocale: {},
    required: raw.required ?? true,
    answers,
  };
}

/** Re-prompts the active AI provider (a fresh, isolated exchange — not appended to the
 * visible conversation transcript) asking it to generate `args.count`
 * candidate questions on `args.topic`, retrying once if the reply doesn't
 * parse/validate. Returns the questions that validated successfully against
 * ADD_QUESTION's own zod schema (via aiToolCallSchema) — never a raw,
 * unvalidated model response. */
async function generateSuggestedQuestions(
  args: SuggestQuestionsArgs,
  defaultLocale: LocaleCode,
): Promise<QuestionDefinition[]> {
  const locale = args.locale ?? defaultLocale;
  const instruction = section(
    "USER MESSAGE",
    `Generate exactly ${args.count} new survey question(s) about "${args.topic}", written in the "${locale}" locale. ` +
      `Reply with ONLY a single fenced json code block, no other text, in this exact shape:\n` +
      `\`\`\`json\n{"questions": [{"heading": "...", "controlType": "radio", "required": true, "answers": ["...", "..."]}]}\n\`\`\`\n` +
      `"controlType" must be one of radio, checkbox, text, shortText, dropdown. Omit "answers" entirely for controlType "text"/"shortText".`,
  );

  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await sendAiMessage({
      messages: [{ role: "system", content: buildSystemPrompt() }, { role: "user", content: instruction }],
    });
    if (!result.ok) continue;
    const extracted = extractFencedJson(result.replyText);
    if (!extracted) continue;
    const parsed = rawSuggestedQuestionsSchema.safeParse(extracted.value);
    if (!parsed.success) continue;

    const questions: QuestionDefinition[] = [];
    parsed.data.questions.slice(0, args.count).forEach((raw, i) => {
      const question = buildSuggestedQuestion(raw, i + 1, locale, defaultLocale);
      const valid = aiToolCallSchema.safeParse({ tool: "ADD_QUESTION", args: { question } });
      if (valid.success) questions.push(question);
    });
    if (questions.length > 0) return questions;
  }
  return [];
}

const rawTranslationSchema = z.object({
  questionId: z.string().min(1),
  heading: z.string().trim().min(1),
  answers: z.array(z.object({ answerId: z.string().min(1), text: z.string().trim().min(1) })).optional(),
});
const rawTranslationsSchema = z.object({ translations: z.array(rawTranslationSchema).min(1) });

interface TranslationUpdate {
  questionId: string;
  patch: Partial<QuestionDefinition>;
}

/** Same re-prompt/retry-once/zod-validate discipline as generateSuggestedQuestions,
 * but grounded in the target form's *actual* existing questions/answers (never
 * hallucinated ids) — only the heading/answer text is generated by the model,
 * merged into the existing headingByLocale/answers[].textByLocale maps so no
 * other locale's text is lost. */
async function generateTranslations(
  args: TranslateQuestionsArgs,
  questions: QuestionDefinition[],
  defaultLocale: LocaleCode,
): Promise<TranslationUpdate[]> {
  const targets = questions.filter((q) => args.questionIds.includes(q.id));
  if (targets.length === 0) return [];

  const sourcePayload = targets.map((q) => ({
    questionId: q.id,
    heading: q.headingByLocale[defaultLocale] ?? "",
    answers: q.answers.map((a) => ({ answerId: a.id, text: a.textByLocale[defaultLocale] ?? "" })),
  }));

  const instruction = section(
    "USER MESSAGE",
    `Translate the following question(s) into the "${args.targetLocale}" locale:\n${JSON.stringify(sourcePayload)}\n\n` +
      `Reply with ONLY a single fenced json code block, no other text, in this exact shape:\n` +
      `\`\`\`json\n{"translations": [{"questionId": "...", "heading": "...", "answers": [{"answerId": "...", "text": "..."}]}]}\n\`\`\``,
  );

  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await sendAiMessage({
      messages: [{ role: "system", content: buildSystemPrompt() }, { role: "user", content: instruction }],
    });
    if (!result.ok) continue;
    const extracted = extractFencedJson(result.replyText);
    if (!extracted) continue;
    const parsed = rawTranslationsSchema.safeParse(extracted.value);
    if (!parsed.success) continue;

    const updates: TranslationUpdate[] = [];
    for (const translation of parsed.data.translations) {
      const question = targets.find((q) => q.id === translation.questionId);
      if (!question) continue;
      const headingByLocale = { ...question.headingByLocale, [args.targetLocale]: translation.heading };
      const answers = question.answers.map((a) => {
        const t = translation.answers?.find((x) => x.answerId === a.id);
        return t ? { ...a, textByLocale: { ...a.textByLocale, [args.targetLocale]: t.text } } : a;
      });
      const patch: Partial<QuestionDefinition> = { headingByLocale, answers };
      const valid = aiToolCallSchema.safeParse({ tool: "UPDATE_QUESTION", args: { questionId: question.id, patch } });
      if (valid.success) updates.push({ questionId: question.id, patch });
    }
    if (updates.length > 0) return updates;
  }
  return [];
}

// --- main orchestration ----------------------------------------------------

export async function sendChatMessage(auth: AccessTokenPayload, request: AIChatRequest): Promise<AIChatResponse> {
  const ctx = toCallerContext(auth);
  const conversation = await loadOrCreateConversation(auth, request);
  await persistMessage(conversation.id, "user", request.message);

  try {
    const historyRows = await AppDataSource.getRepository(AIConversationMessage).find({
      where: { conversationId: conversation.id },
      order: { createdAt: "DESC" },
      take: HISTORY_LIMIT,
    });
    historyRows.reverse();
    // The user message just persisted above is already the last row of
    // historyRows — drop it from the replayed history and send it once,
    // explicitly labeled, as this turn's USER MESSAGE section instead.
    const priorHistory = historyRows.slice(0, -1);

    const formId = conversation.formId ?? request.formId ?? null;
    let campaignContextJson: string | null = null;
    if (formId) {
      const campaign = await aiCampaignTools.getCampaign(ctx, { formId });
      if (campaign) campaignContextJson = JSON.stringify(campaign);
    }

    const baseTurns = buildBaseTurns(campaignContextJson, priorHistory);
    const userTurn: AiChatTurn = { role: "user", content: section("USER MESSAGE", request.message) };
    const initial = await sendAiMessage({ messages: [...baseTurns, userTurn] });

    if (!initial.ok) {
      console.error("[aiAssistantService] AI provider call failed:", initial.error);
      await persistMessage(conversation.id, "assistant", initial.error);
      return { conversationId: conversation.id, message: initial.error, actions: [], references: [] };
    }

    const toolCall = extractToolCall(initial.replyText);

    if (!toolCall) {
      // Plain text reply — no tool call detected (or the model's JSON failed
      // validation, in which case we deliberately fall back to treating the
      // whole reply as plain text rather than surfacing a parse error).
      await persistMessage(conversation.id, "assistant", initial.replyText, {
        tokenUsage: initial.tokenUsage,
        model: initial.model,
        requestId: initial.requestId,
      });
      return { conversationId: conversation.id, message: initial.replyText, actions: [], references: [] };
    }

    const { call, remainderText } = toolCall;

    if (!isMutatingAiTool(call.tool)) {
      return await handleReadOnlyTool(conversation, ctx, baseTurns, userTurn, initial.replyText, call);
    }

    return await handleMutatingTool(conversation, ctx, auth, formId, call, remainderText);
  } catch (err) {
    console.error("[aiAssistantService] sendChatMessage failed", err);
    await persistMessage(conversation.id, "assistant", FALLBACK_MESSAGE);
    return { conversationId: conversation.id, message: FALLBACK_MESSAGE, actions: [], references: [] };
  }
}

async function handleReadOnlyTool(
  conversation: AIConversation,
  ctx: aiCampaignTools.AiToolCallerContext,
  baseTurns: AiChatTurn[],
  userTurn: AiChatTurn,
  toolCallReplyText: string,
  call: AIToolCall,
): Promise<AIChatResponse> {
  const toolResult = await executeReadOnlyTool(ctx, call);
  await persistMessage(conversation.id, "tool", JSON.stringify({ tool: call.tool, args: call.args, result: toolResult }));

  const followUpTurns: AiChatTurn[] = [
    ...baseTurns,
    userTurn,
    { role: "assistant", content: toolCallReplyText },
    { role: "tool", content: section("TOOL RESULTS", JSON.stringify(toolResult)) },
  ];
  const final = await sendAiMessage({ messages: followUpTurns });

  const message = final.ok ? final.replyText : FALLBACK_MESSAGE;
  await persistMessage(conversation.id, "assistant", message, final.ok ? { tokenUsage: final.tokenUsage, model: final.model, requestId: final.requestId } : undefined);

  let references: AIChatResponse["references"] = [];
  if ((call.tool === "SEARCH_CAMPAIGNS" || call.tool === "FIND_SIMILAR_CAMPAIGNS") && Array.isArray(toolResult)) {
    references = await aiCampaignTools.buildCampaignReferences(ctx, toolResult as aiCampaignTools.CampaignSearchResult[]);
  }

  return { conversationId: conversation.id, message, actions: [], references };
}

async function executeReadOnlyTool(ctx: aiCampaignTools.AiToolCallerContext, call: AIToolCall): Promise<unknown> {
  switch (call.tool) {
    case "SEARCH_CAMPAIGNS":
      return aiCampaignTools.searchCampaigns(ctx, call.args);
    case "GET_CAMPAIGN":
      return aiCampaignTools.getCampaign(ctx, call.args);
    case "GET_CAMPAIGN_QUESTIONS":
      return aiCampaignTools.getCampaignQuestions(ctx, call.args);
    case "SEARCH_QUESTIONS":
      return aiCampaignTools.searchQuestions(ctx, call.args);
    case "FIND_SIMILAR_CAMPAIGNS":
      return aiCampaignTools.findSimilarCampaigns(ctx, call.args);
    case "FIND_SIMILAR_QUESTIONS":
      return aiCampaignTools.findSimilarQuestions(ctx, call.args);
    case "VALIDATE_FORM":
      return aiCampaignTools.validateForm(ctx, call.args);
    default:
      throw new Error(`not a read-only tool: ${call.tool}`);
  }
}

async function handleMutatingTool(
  conversation: AIConversation,
  ctx: aiCampaignTools.AiToolCallerContext,
  auth: AccessTokenPayload,
  formId: string | null,
  call: AIToolCall,
  remainderText: string,
): Promise<AIChatResponse> {
  if (call.tool === "SUGGEST_QUESTIONS") {
    const campaign = formId ? await aiCampaignTools.getCampaign(ctx, { formId }) : null;
    const defaultLocale = campaign?.defaultLocale || "en_GB";
    const questions = await generateSuggestedQuestions(call.args, defaultLocale);
    if (questions.length === 0) {
      const message = "I wasn't able to generate valid question suggestions right now — please try again.";
      await persistMessage(conversation.id, "assistant", message);
      return { conversationId: conversation.id, message, actions: [], references: [] };
    }
    const actions = await Promise.all(
      questions.map((question) =>
        createPendingAction({ conversationId: conversation.id, formId, userId: auth.sub, actionType: "ADD_QUESTION", args: { question } }),
      ),
    );
    const message = remainderText || `I've drafted ${questions.length} question suggestion(s) for you to review — add each one individually.`;
    await persistMessage(conversation.id, "assistant", message);
    return { conversationId: conversation.id, message, actions: actions.map(actionSummary), references: [] };
  }

  if (call.tool === "TRANSLATE_QUESTIONS") {
    const detail = formId ? await aiCampaignTools.getCallerFormDetail(ctx, formId) : null;
    const content = detail?.draft ?? detail?.published;
    if (!content) {
      const message = "I need an open campaign with existing questions to translate — please open one first.";
      await persistMessage(conversation.id, "assistant", message);
      return { conversationId: conversation.id, message, actions: [], references: [] };
    }
    const updates = await generateTranslations(call.args, content.definition.questions, content.definition.meta.defaultLocale);
    if (updates.length === 0) {
      const message = "I wasn't able to generate valid translations right now — please try again.";
      await persistMessage(conversation.id, "assistant", message);
      return { conversationId: conversation.id, message, actions: [], references: [] };
    }
    const actions = await Promise.all(
      updates.map((u) =>
        createPendingAction({
          conversationId: conversation.id,
          formId,
          userId: auth.sub,
          actionType: "UPDATE_QUESTION",
          args: { questionId: u.questionId, patch: u.patch },
        }),
      ),
    );
    const message = remainderText || `I've drafted translations for ${updates.length} question(s) into ${call.args.targetLocale} — apply each one individually.`;
    await persistMessage(conversation.id, "assistant", message);
    return { conversationId: conversation.id, message, actions: actions.map(actionSummary), references: [] };
  }

  // Every other mutating tool (including the two server-executed ones,
  // CREATE_CAMPAIGN/CLONE_CAMPAIGN — those still only get *staged* here;
  // actual execution happens in confirmAction below) becomes exactly one
  // pending AIAction row.
  const action = await createPendingAction({
    conversationId: conversation.id,
    formId: isServerExecutedAiTool(call.tool) ? null : formId,
    userId: auth.sub,
    actionType: call.tool,
    args: call.args,
  });
  const message = remainderText || defaultProposalMessage(call.tool);
  await persistMessage(conversation.id, "assistant", message);
  return { conversationId: conversation.id, message, actions: [actionSummary(action)], references: [] };
}

function defaultProposalMessage(tool: AIToolName): string {
  switch (tool) {
    case "CREATE_CAMPAIGN":
      return "I've drafted a new campaign for you to confirm.";
    case "CLONE_CAMPAIGN":
      return "I've drafted a cloned campaign for you to confirm.";
    case "ADD_QUESTION":
      return "I've drafted a new question for you to review and add.";
    case "UPDATE_QUESTION":
      return "I've drafted a change to this question for you to review and apply.";
    case "DELETE_QUESTION":
      return "I've proposed removing this question — please confirm.";
    case "REORDER_QUESTIONS":
      return "I've proposed a new question order for you to review and apply.";
    default:
      return "I've drafted a proposed change for you to review.";
  }
}

// --- confirm / reject -------------------------------------------------------

/** Ownership-check helper for an AIAction: belongs to a conversation owned by
 * the caller, or the caller is an admin — same null-for-both-cases
 * convention as findOwnedConversation above. */
async function findOwnedAction(actionId: string, auth: AccessTokenPayload): Promise<AIAction | null> {
  const action = await AppDataSource.getRepository(AIAction).findOne({ where: { id: actionId } });
  if (!action) return null;
  const conversation = await AppDataSource.getRepository(AIConversation).findOne({ where: { id: action.conversationId } });
  if (!conversation) return null;
  if (conversation.userId !== auth.sub && !isAdminRole(auth.role)) return null;
  return action;
}

export async function confirmAction(auth: AccessTokenPayload, actionId: string): Promise<AIConfirmActionResponse> {
  const action = await findOwnedAction(actionId, auth);
  if (!action) throw new NotFoundError("action not found");
  if (action.confirmed) throw new ConflictError("This action has already been confirmed");

  const args = JSON.parse(action.requestJson) as unknown;
  const parsed = aiToolCallSchema.safeParse({ tool: action.actionType, args });
  if (!parsed.success) throw new ValidationError("This proposed action is no longer valid");

  const ctx = toCallerContext(auth);

  // Re-validate the target form is still accessible to the caller — a form
  // could have been deleted/unpublished/reassigned between proposal and
  // confirmation.
  if (action.formId) {
    const detail = await aiCampaignTools.getCallerFormDetail(ctx, action.formId);
    if (!detail) throw new NotFoundError("form not found");
  }

  if (isServerExecutedAiTool(action.actionType)) {
    const result = await executeServerAction(auth, parsed.data);
    await AppDataSource.getRepository(AIAction).update(action.id, {
      confirmed: true,
      executed: true,
      responseJson: JSON.stringify(result),
      executionResult: JSON.stringify(result),
    });
    return { actionId: action.id, actionType: action.actionType, executed: true, formId: result.formId };
  }

  // Client-applied types: the backend's job ends at proposing a well-formed
  // change — confirming here only flips the audit flags. The actual mutation
  // happens client-side via useFormBuilderStore.updateDefinition, exactly as
  // a manual edit already does; nothing here touches Forms/FormVersions.
  await AppDataSource.getRepository(AIAction).update(action.id, { confirmed: true, executed: true, executionResult: JSON.stringify({ applied: "client" }) });
  return { actionId: action.id, actionType: action.actionType, executed: true, data: args };
}

async function executeServerAction(auth: AccessTokenPayload, call: AIToolCall): Promise<{ formId: string }> {
  if (call.tool === "CREATE_CAMPAIGN") {
    const args = call.args as CreateCampaignArgs;
    const subsidiaryId = isAdminRole(auth.role) ? args.subsidiaryId : auth.subsidiaryId;
    if (!subsidiaryId) throw new ValidationError("This account has no subsidiary assigned");
    const form = await createForm({
      name: args.name,
      subsidiaryId,
      projectCode: args.projectCode ?? null,
      userId: auth.sub,
      origin: isAdminRole(auth.role) ? "admin" : "adhoc",
    });
    return { formId: form.id };
  }

  if (call.tool === "CLONE_CAMPAIGN") {
    const args = call.args as CloneCampaignArgs;
    const subsidiaryId = isAdminRole(auth.role) ? args.subsidiaryId : auth.subsidiaryId;
    if (!subsidiaryId) throw new ValidationError("This account has no subsidiary assigned");
    const source = isAdminRole(auth.role)
      ? await getFormDetail(args.sourceFormId)
      : await getAccessibleFormDetail(args.sourceFormId, subsidiaryId);
    if (!source) throw new NotFoundError("source campaign not found");
    const form = await createForm({
      name: args.name,
      subsidiaryId,
      projectCode: args.projectCode ?? null,
      userId: auth.sub,
      origin: isAdminRole(auth.role) ? "admin" : "adhoc",
      copyFromFormId: args.sourceFormId,
    });
    return { formId: form.id };
  }

  throw new Error(`not a server-executed tool: ${call.tool}`);
}

export async function rejectAction(auth: AccessTokenPayload, actionId: string): Promise<void> {
  const action = await findOwnedAction(actionId, auth);
  if (!action) throw new NotFoundError("action not found");
  await AppDataSource.getRepository(AIAction).update(action.id, { confirmed: false, executed: false, executionResult: JSON.stringify({ rejected: true }) });
}

// --- conversation listing/detail --------------------------------------------

function toConversationSummary(c: AIConversation): AIConversationSummary {
  return {
    id: c.id,
    formId: c.formId,
    title: c.title,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

/** Always the caller's own conversations — unlike getConversation below,
 * there is no admin-bypass here; an admin's own chat history is exactly as
 * personal as anyone else's. */
export async function listConversations(auth: AccessTokenPayload, formId?: string): Promise<AIConversationSummary[]> {
  const where: { userId: string; formId?: string } = { userId: auth.sub };
  if (formId) where.formId = formId;
  const rows = await AppDataSource.getRepository(AIConversation).find({ where, order: { updatedAt: "DESC" } });
  return rows.map(toConversationSummary);
}

export async function getConversation(auth: AccessTokenPayload, conversationId: string): Promise<AIConversationDetail> {
  const conversation = await findOwnedConversation(conversationId, auth);
  if (!conversation) throw new NotFoundError("conversation not found");

  const messages = await AppDataSource.getRepository(AIConversationMessage).find({
    where: { conversationId },
    order: { createdAt: "ASC" },
  });

  return {
    ...toConversationSummary(conversation),
    // Tool/system rows are audit/debugging detail (see AIConversationMessage's
    // own doc comment) — never replayed into the user-facing transcript.
    messages: messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ id: m.id, role: m.role, message: m.message, createdAt: m.createdAt.toISOString() })),
  };
}
