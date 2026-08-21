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
  if (!settings.apiKey && !settings.openApiToken) {
    return { ok: false, error: "FabriXAI API key or openapi token is not configured" };
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
 * Points at the configured FabriXAI trial endpoint (a gateway in front of the
 * real agent API, per FABRIX_API_BASE_URL — the full chat URL, nothing
 * appended):
 *
 *   POST {baseUrl}
 *   Headers: Content-Type: application/json,
 *            Authorization: Bearer <apiKey>            (if configured)
 *            x-fabrix-client: <FABRIX_CLIENT_HEADER>     (if configured)
 *            x-openapi-token: <FABRIX_OPENAPI_TOKEN>     (if configured)
 *   Body:    { conversationId?: string, messages: [{ role, content }] }
 *   Response: { conversationId: string, reply: string,
 *               usage?: { totalTokens: number }, model?: string, requestId?: string }
 *
 * The body/response shape is still an unverified best guess — only the URL
 * and auth headers reflect the actual configured endpoint. See
 * backend/docs/fabrixai-integration.md for the full write-up and exactly
 * what to check once this has been exercised against the real service.
 * Nothing outside this function depends on these exact field names or URL
 * shape — sendMessage's FabrixChatResult is the stable contract the rest of
 * the app relies on.
 */
async function callFabrixAgent(
  config: FabrixSettings,
  request: FabrixChatRequest,
  signal: AbortSignal,
): Promise<FabrixCallResult | FabrixCallFailure> {
  // config.baseUrl already points at the full chat endpoint for this
  // deployment (a gateway in front of the real agent API, per the
  // FABRIX_CLIENT_HEADER/FABRIX_OPENAPI_TOKEN headers below) — nothing is
  // appended to it. request.agentId is currently unused here as a result;
  // if this gateway ever needs to route to more than one agent through the
  // same base URL, it'll need to go somewhere below (a header, most likely)
  // — see fabrixai-integration.md.
  const url = config.baseUrl.replace(/\/+$/, "");
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
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        ...(config.clientHeader ? { "x-fabrix-client": config.clientHeader } : {}),
        ...(config.openApiToken ? { "x-openapi-token": config.openApiToken } : {}),
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
