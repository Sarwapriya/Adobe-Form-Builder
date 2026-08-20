import type {
  AIChatRequest,
  AIChatResponse,
  AIConfirmActionResponse,
  AIConversationDetail,
  AIConversationSummary,
  AICampaignReference,
} from "@formbuilder/shared";
import { apiClient } from "./apiClient";

/**
 * Thin wrappers over apiClient for the FabriXAI-backed copilot's `/api/v1/ai/*`
 * routes (see backend's ai.router.ts, mounted alongside every other `/api/v1/*`
 * router — same base-path convention formBuilderApi.ts/uploadsApi.ts use, just
 * an "ai" segment instead of "admin/forms"/"uploads"). Every type here is
 * imported straight from `@formbuilder/shared`'s aiTypes.ts — the wire
 * contract both this file and the backend router validate against — never
 * redeclared locally.
 *
 * No custom error subclass here unlike formBuilderApi.ts's FormInvalidError:
 * the AI routes have no equivalent "structured 422 with a payload the caller
 * needs to unpack" case (chat/action failures are surfaced as plain
 * ApiError-carried messages, e.g. "The AI service is temporarily
 * unavailable."), so there's nothing beyond apiClient's own ApiError to add.
 */

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** POST /api/v1/ai/chat — the main copilot turn: sends the user's message
 * (plus an optional conversationId to continue an existing thread and formId
 * to scope it to the open editor), gets back the assistant's reply text plus
 * any pending mutating-tool proposals (`actions`) and campaign search hits
 * (`references`). */
export function sendChatMessage(request: AIChatRequest): Promise<AIChatResponse> {
  return apiClient.post<AIChatResponse>("/api/v1/ai/chat", request);
}

/** GET /api/v1/ai/conversations — the caller's own conversations, optionally
 * filtered to one form. */
export function listConversations(formId?: string): Promise<AIConversationSummary[]> {
  return apiClient.get<AIConversationSummary[]>(`/api/v1/ai/conversations${buildQuery({ formId })}`);
}

/** GET /api/v1/ai/conversations/:id — full message history for one
 * conversation (ownership-checked server-side, admins bypass). */
export function getConversation(id: string): Promise<AIConversationDetail> {
  return apiClient.get<AIConversationDetail>(`/api/v1/ai/conversations/${id}`);
}

/** POST /api/v1/ai/actions/:id/confirm — confirms a pending AI-proposed
 * action. For a client-applied tool (ADD_QUESTION/UPDATE_QUESTION/
 * DELETE_QUESTION/REORDER_QUESTIONS) the response's `data` is the payload to
 * hand to useFormBuilderStore.updateDefinition; for a server-executed tool
 * (CREATE_CAMPAIGN/CLONE_CAMPAIGN) the response's `formId` is where to
 * navigate — see aiChatStore.confirmAction for how the two are told apart. */
export function confirmAction(actionId: string): Promise<AIConfirmActionResponse> {
  return apiClient.post<AIConfirmActionResponse>(`/api/v1/ai/actions/${actionId}/confirm`);
}

/** POST /api/v1/ai/actions/:id/reject — declines a pending action; server
 * records the audit row as unconfirmed and nothing is ever applied. */
export function rejectAction(actionId: string): Promise<void> {
  return apiClient.post<void>(`/api/v1/ai/actions/${actionId}/reject`);
}

export interface SearchCampaignsParams {
  searchText?: string;
  projectCode?: string;
  status?: "draft" | "published" | "unpublished";
}

/** GET /api/v1/ai/campaigns/search — a direct, non-chat convenience endpoint
 * wrapping the same SEARCH_CAMPAIGNS tool the chat flow uses, for
 * CampaignReferenceCard-style direct search UI. */
export function searchCampaigns(params: SearchCampaignsParams = {}): Promise<AICampaignReference[]> {
  const query = buildQuery({
    searchText: params.searchText,
    projectCode: params.projectCode,
    status: params.status,
  });
  return apiClient.get<AICampaignReference[]>(`/api/v1/ai/campaigns/search${query}`);
}

/** GET /api/v1/ai/campaigns/:id — wraps the GET_CAMPAIGN tool directly. */
export function getCampaign(id: string): Promise<AICampaignReference> {
  return apiClient.get<AICampaignReference>(`/api/v1/ai/campaigns/${id}`);
}
