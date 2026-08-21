import Anthropic from "@anthropic-ai/sdk";
import { getClaudeSettings } from "./claudeSettingsService";
import type { AiChatRequest, AiChatResult } from "./aiProviderService";

/**
 * The one service that talks to the Anthropic Claude Messages API. Every
 * caller goes through aiProviderService.ts's `sendMessage` (which dispatches
 * here only when Claude is the active provider) — nothing else in this
 * codebase constructs a Claude request directly.
 *
 * Unlike fabrixAIService.ts's callFabrixAgent, there's no unverified wire
 * contract to isolate here — this is a standard `client.messages.create`
 * call against the official, documented Messages API. Claude's messages
 * array only supports "user"/"assistant" roles (no "tool" role), so every
 * "system"-role AiChatTurn is merged into the top-level `system` string, and
 * "tool"-role turns (this app's TOOL RESULTS-labeled content, injected back
 * into the conversation — see aiAssistantService.ts) are sent as "user"
 * turns, same as how fabrixAIService.ts folds them into its own flat
 * contents array. The labeling the model relies on lives in the text itself
 * (section headers like "CAMPAIGN DATA"/"TOOL RESULTS"/"USER MESSAGE"), not
 * in the role field, so this collapsing is safe.
 */
export async function sendMessage(request: AiChatRequest): Promise<AiChatResult> {
  const settings = await getClaudeSettings();
  if (!settings) {
    return { ok: false, error: "Claude is not configured" };
  }
  if (!settings.enabled) {
    return { ok: false, error: "Claude is disabled" };
  }

  const client = new Anthropic({ apiKey: settings.apiKey });

  const systemPrompt = request.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const messages: Anthropic.MessageParam[] = request.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

  const startedAt = Date.now();
  try {
    const response = await client.messages.create({
      model: settings.model,
      max_tokens: 8192,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages,
    });

    if (response.stop_reason === "refusal") {
      console.error(`[claudeAIService] model=${settings.model} durationMs=${Date.now() - startedAt} status=refusal`);
      return { ok: false, error: "Claude declined to respond to this request." };
    }

    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === "text");
    if (!textBlock) {
      return { ok: false, error: "Claude response did not include any text" };
    }

    console.log(`[claudeAIService] model=${settings.model} durationMs=${Date.now() - startedAt} status=ok`);
    return {
      ok: true,
      replyText: textBlock.text,
      model: response.model,
      tokenUsage: response.usage.input_tokens + response.usage.output_tokens,
    };
  } catch (err) {
    const message = describeClaudeError(err);
    console.error(`[claudeAIService] model=${settings.model} durationMs=${Date.now() - startedAt} status=error error=${message}`);
    return { ok: false, error: message };
  }
}

/** Most-specific-first exception chain — never string-match a raw error
 * message, per the typed Anthropic.* exception classes the SDK exports. */
function describeClaudeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "Claude authentication failed — check the API key.";
  if (err instanceof Anthropic.RateLimitError) return "Claude rate limit exceeded — try again shortly.";
  if (err instanceof Anthropic.BadRequestError) return `Claude rejected the request: ${err.message}`;
  if (err instanceof Anthropic.APIError) return `Claude error (${err.status}): ${err.message}`;
  return err instanceof Error ? err.message : String(err);
}
