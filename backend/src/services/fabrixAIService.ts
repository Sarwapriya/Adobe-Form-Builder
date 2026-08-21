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
 * Logs `{modelIds, conversationId, durationMs, status}` on completion —
 * deliberately never the client-header or openapi-token values, matching
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
  if (!settings.clientHeader || !settings.openApiToken) {
    return { ok: false, error: "FabriXAI client header or openapi token is not configured" };
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
          `[fabrixAIService] modelIds=${settings.modelIds.join(",")} conversationId=${request.conversationId ?? "(new)"} durationMs=${Date.now() - startedAt} status=ok`,
        );
        return result;
      }

      lastError = result.error;
      if (!result.retryable || attempt === settings.maxRetries) {
        console.error(
          `[fabrixAIService] modelIds=${settings.modelIds.join(",")} conversationId=${request.conversationId ?? "(new)"} durationMs=${Date.now() - startedAt} status=error error=${lastError}`,
        );
        return { ok: false, error: lastError };
      }
    } catch (err) {
      clearTimeout(timeout);
      const name = err instanceof Error ? err.name : "";
      lastError = err instanceof Error ? err.message : String(err);
      if (!RETRYABLE_NETWORK_ERROR_NAMES.has(name) || attempt === settings.maxRetries) {
        console.error(
          `[fabrixAIService] modelIds=${settings.modelIds.join(",")} conversationId=${request.conversationId ?? "(new)"} durationMs=${Date.now() - startedAt} status=error error=${lastError}`,
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
 * The real FabriX OpenAPI chat contract (confirmed against the manual —
 * https://nsds.fabrix-s.samsungsds.com/public/contents-web/manual/fabrix_openAPI_manual/en/index.html,
 * "POST /openapi/chat/v1/messages" section):
 *
 *   POST {baseUrl}/openapi/chat/v1/messages
 *   Headers: Content-Type: application/json,
 *            x-fabrix-client: <FABRIX_CLIENT_HEADER>   (required)
 *            x-openapi-token: <FABRIX_OPENAPI_TOKEN>   (required — the docs'
 *              own example value is "Bearer eyJXXX", i.e. the token value
 *              itself is expected to already carry the "Bearer " prefix as
 *              issued; we defensively add it here if it's missing rather
 *              than assuming the stored value is formatted correctly)
 *            x-generative-ai-user-email: <FABRIX_USER_EMAIL>  (optional —
 *              portal user tracking, omitted entirely when not configured)
 *   Body:    { modelIds: string[], contents: string[], isStream: false,
 *              systemPrompt?: string }
 *            modelIds carries every currently-*enabled* model from the
 *            admin-managed FabrixModels catalog (Configuration > AI
 *            Assistant > Models — see fabrixModelsService.ts), in priority
 *            order — listing more than one is what lets FabriX itself route
 *            around/swap past a model that's unavailable or token/rate-
 *            limited, rather than this app needing its own retry-with-
 *            different-model logic.
 *            `contents` is a flat, role-less array of conversation turns in
 *            order (not `{role, content}` objects) — our own FabrixChatTurn
 *            role tagging is collapsed here: every "system" turn's content
 *            is merged into `systemPrompt`, everything else (user/assistant/
 *            tool) becomes one more entry in `contents`, in order. This is
 *            safe because every turn this app builds is already internally
 *            labeled with a section header (see aiSystemPrompt.ts / the
 *            "CAMPAIGN DATA"/"TOOL RESULTS"/"USER MESSAGE" markers in
 *            aiAssistantService.ts) — the labeling the model relies on lives
 *            in the text itself, not in the (unsupported) role field.
 *   Response: { content: string, status: "SUCCESS"|"ERROR"|"FILTER_INVALID",
 *               responseCode: string, modelType?: string,
 *               filterBlockReason?: { message?: string } }
 *            Critically, a failed request can still come back HTTP 200 with
 *            status !== "SUCCESS" — response.ok alone doesn't mean success.
 *
 * Not part of the real contract at all: `conversationId` (the API has no
 * such field — full history is resent as `contents` every turn, which
 * aiAssistantService.ts already does) and true SSE streaming (we always
 * send `isStream: false` and parse one JSON response).
 */
async function callFabrixAgent(
  config: FabrixSettings,
  request: FabrixChatRequest,
  signal: AbortSignal,
): Promise<FabrixCallResult | FabrixCallFailure> {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/openapi/chat/v1/messages`;

  const systemPrompt = request.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const contents = request.messages.filter((m) => m.role !== "system").map((m) => m.content);

  const body = JSON.stringify({
    modelIds: config.modelIds,
    contents,
    isStream: false,
    ...(systemPrompt ? { systemPrompt } : {}),
  });

  const openApiTokenHeader = config.openApiToken.startsWith("Bearer ")
    ? config.openApiToken
    : `Bearer ${config.openApiToken}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-fabrix-client": config.clientHeader,
        "x-openapi-token": openApiTokenHeader,
        ...(config.userEmail ? { "x-generative-ai-user-email": config.userEmail } : {}),
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
    content?: string;
    status?: string;
    responseCode?: string;
    modelType?: string;
    filterBlockReason?: { message?: string | null } | null;
  };
  try {
    payload = await response.json();
  } catch {
    return { ok: false, error: "FabriXAI returned a non-JSON response", retryable: false };
  }

  if (payload.status === "ERROR" || payload.status === "FILTER_INVALID") {
    const detail = payload.filterBlockReason?.message || payload.status;
    return { ok: false, error: `FabriXAI returned an error: ${detail}`, retryable: false };
  }

  if (typeof payload.content !== "string") {
    return { ok: false, error: "FabriXAI response did not include content", retryable: false };
  }

  return {
    ok: true,
    replyText: payload.content,
    model: payload.modelType,
  };
}
