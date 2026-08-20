import { getFabrixSettings, type FabrixSettings } from "./fabrixSettingsService";

/**
 * The one service that talks to FabriXAI's Agent API over the network. Every
 * caller (aiAssistantService.ts's orchestration, admin.router.ts's
 * "Send test message" button) goes through `sendMessage` below — nothing
 * else in this codebase constructs a FabriXAI request directly.
 *
 * The actual wire contract (URL shape, request/response field names) lives
 * entirely inside `callFabrixAgent` at the bottom of this file — see its own
 * doc comment. Everything above that function (retry/timeout/logging) has no
 * dependency on those exact field names, so correcting them later against
 * real FabriXAI docs only touches that one function.
 */

export type FabrixChatRole = "system" | "user" | "assistant" | "tool";

export interface FabrixChatTurn {
  role: FabrixChatRole;
  content: string;
}

export interface FabrixChatRequest {
  agentId: string;
  conversationId?: string;
  messages: FabrixChatTurn[];
}

export type FabrixChatResult =
  | {
      ok: true;
      replyText: string;
      providerConversationId?: string;
      tokenUsage?: number;
      model?: string;
      requestId?: string;
    }
  | { ok: false; error: string };

const RETRYABLE_NETWORK_ERROR_NAMES = new Set(["AbortError", "FetchError", "TypeError"]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Capped exponential backoff: 500ms, 1s, 2s, ... capped at 5s — same shape
 * as every other retry loop in this codebase would use, just not previously
 * needed anywhere else. */
function backoffDelayMs(attempt: number): number {
  return Math.min(500 * 2 ** attempt, 5000);
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 && status < 600;
}

/**
 * Sends one conversation turn to FabriXAI and returns its reply, or a
 * structured `{ ok: false, error }` if the config is missing/disabled or
 * every retry attempt failed. Never throws — every caller (aiAssistantService,
 * the admin "test message" route) can treat this as the single point where a
 * network/provider failure is normalized into a value instead of an
 * exception.
 *
 * Logs `{agentId, conversationId, durationMs, status}` on completion —
 * deliberately never the API key or the Authorization header value, matching
 * the logging discipline emailService.ts already follows for SMTP creds.
 */
export async function sendMessage(request: FabrixChatRequest): Promise<FabrixChatResult> {
  const settings = await getFabrixSettings();
  if (!settings) {
    return { ok: false, error: "FabriXAI is not configured" };
  }
  if (!settings.enabled) {
    return { ok: false, error: "FabriXAI is disabled" };
  }
  if (!settings.apiKey) {
    return { ok: false, error: "FabriXAI API key is not configured" };
  }

  const startedAt = Date.now();
  let lastError = "Unknown error";

  for (let attempt = 0; attempt <= settings.maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), settings.timeoutSeconds * 1000);
    try {
      const result = await callFabrixAgent(settings, request, controller.signal);
      clearTimeout(timeout);

      if (result.ok) {
        console.log(
          `[fabrixAIService] agentId=${settings.agentId} conversationId=${request.conversationId ?? "(new)"} durationMs=${Date.now() - startedAt} status=ok`,
        );
        return result;
      }

      lastError = result.error;
      if (!result.retryable || attempt === settings.maxRetries) {
        console.error(
          `[fabrixAIService] agentId=${settings.agentId} conversationId=${request.conversationId ?? "(new)"} durationMs=${Date.now() - startedAt} status=error error=${lastError}`,
        );
        return { ok: false, error: lastError };
      }
    } catch (err) {
      clearTimeout(timeout);
      const name = err instanceof Error ? err.name : "";
      lastError = err instanceof Error ? err.message : String(err);
      if (!RETRYABLE_NETWORK_ERROR_NAMES.has(name) || attempt === settings.maxRetries) {
        console.error(
          `[fabrixAIService] agentId=${settings.agentId} conversationId=${request.conversationId ?? "(new)"} durationMs=${Date.now() - startedAt} status=error error=${lastError}`,
        );
        return { ok: false, error: lastError };
      }
    }
    await sleep(backoffDelayMs(attempt));
  }

  return { ok: false, error: lastError };
}

interface FabrixCallResult {
  ok: true;
  replyText: string;
  providerConversationId?: string;
  tokenUsage?: number;
  model?: string;
  requestId?: string;
}
interface FabrixCallFailure {
  ok: false;
  error: string;
  /** Whether this failure is worth retrying (5xx / network-level) vs. a
   * definitive failure (4xx) that retrying won't fix. */
  retryable: boolean;
}

/**
 * *** THE ONE ISOLATED WIRE-CONTRACT SEAM — NEEDS VERIFICATION ***
 *
 * FabriXAI's real Agent-invocation REST contract is not publicly documented
 * as of this writing (docs.fabrix.ai only covers a separate asset-analytics
 * API). Everything below is a best-guess REST/Bearer shape, chosen to be the
 * most conventional possible design so it's a reasonable starting point:
 *
 *   POST {baseUrl}/api/v1/agents/{agentId}/chat
 *   Headers: Authorization: Bearer <apiKey>, Content-Type: application/json
 *   Body:    { conversationId?: string, messages: [{ role, content }] }
 *   Response: { conversationId: string, reply: string,
 *               usage?: { totalTokens: number }, model?: string, requestId?: string }
 *
 * See backend/docs/fabrixai-integration.md for the full write-up of this
 * assumption and exactly what to change here once real docs/console access
 * are available. Nothing outside this function depends on these exact field
 * names or URL shape — sendMessage's FabrixChatResult is the stable contract
 * the rest of the app relies on.
 */
async function callFabrixAgent(
  config: FabrixSettings,
  request: FabrixChatRequest,
  signal: AbortSignal,
): Promise<FabrixCallResult | FabrixCallFailure> {
  const url = `${config.baseUrl.replace(/\/+$/, "")}/api/v1/agents/${encodeURIComponent(request.agentId)}/chat`;
  const body = JSON.stringify({
    conversationId: request.conversationId,
    messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
  });

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body,
      signal,
    });
  } catch (err) {
    // Network-level failure (DNS, connection refused, abort/timeout) — always
    // worth retrying.
    throw err;
  }

  if (!response.ok) {
    const retryable = isRetryableStatus(response.status);
    let detail = response.statusText;
    try {
      const text = await response.text();
      if (text) detail = text.slice(0, 500);
    } catch {
      // ignore — fall back to statusText
    }
    return { ok: false, error: `FabriXAI request failed (${response.status}): ${detail}`, retryable };
  }

  let payload: {
    conversationId?: string;
    reply?: string;
    usage?: { totalTokens?: number };
    model?: string;
    requestId?: string;
  };
  try {
    payload = await response.json();
  } catch {
    return { ok: false, error: "FabriXAI returned a non-JSON response", retryable: false };
  }

  if (typeof payload.reply !== "string") {
    return { ok: false, error: "FabriXAI response did not include a reply", retryable: false };
  }

  return {
    ok: true,
    replyText: payload.reply,
    providerConversationId: payload.conversationId,
    tokenUsage: payload.usage?.totalTokens,
    model: payload.model,
    requestId: payload.requestId,
  };
}
