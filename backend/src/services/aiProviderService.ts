import * as fabrixAIService from "./fabrixAIService";
import * as claudeAIService from "./claudeAIService";

/**
 * Provider-agnostic chat contract — structurally identical to
 * fabrixAIService.ts's own FabrixChatTurn/FabrixChatRequest/FabrixChatResult
 * (kept as separate types there rather than importing from here, so this
 * file has no dependency on fabrixAIService beyond calling its sendMessage;
 * TypeScript's structural typing means the two are interchangeable). Every
 * caller (aiAssistantService.ts's orchestration, admin.router.ts's "Send
 * test message" buttons) goes through this module's `sendMessage`, never a
 * specific provider's service directly.
 *
 * There is no admin-configurable "active provider" switch — FabriX is always
 * tried first (it's the primary, contractually-documented provider); Claude
 * is used automatically, only as a fallback, whenever FabriX doesn't return
 * a usable reply (not configured/disabled, or a request failure after
 * fabrixAIService's own retries — network-down and "misconfigured" look the
 * same from here, and both are exactly the case Claude should cover). If
 * Claude isn't configured either, FabriX's own error is what's surfaced,
 * since FabriX is the provider an admin actually set out to use.
 */
export type AiChatRole = "system" | "user" | "assistant" | "tool";

export interface AiChatTurn {
  role: AiChatRole;
  content: string;
}

export interface AiChatRequest {
  conversationId?: string;
  messages: AiChatTurn[];
}

export type AiChatResult =
  | {
      ok: true;
      replyText: string;
      providerConversationId?: string;
      tokenUsage?: number;
      model?: string;
      requestId?: string;
    }
  | { ok: false; error: string };

/** Tries FabriX first; falls back to Claude only if FabriX fails. Never
 * throws — same discipline both underlying sendMessage implementations
 * already follow. */
export async function sendMessage(request: AiChatRequest): Promise<AiChatResult> {
  const fabrixResult = await fabrixAIService.sendMessage(request);
  if (fabrixResult.ok) {
    return fabrixResult;
  }

  console.warn(`[aiProviderService] FabriX unavailable (${fabrixResult.error}) — falling back to Claude`);
  const claudeResult = await claudeAIService.sendMessage(request);
  if (claudeResult.ok) {
    return claudeResult;
  }

  console.error(`[aiProviderService] Claude fallback also failed (${claudeResult.error})`);
  return fabrixResult;
}
