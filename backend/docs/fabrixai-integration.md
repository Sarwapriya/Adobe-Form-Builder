# FabriXAI wire contract — NEEDS VERIFICATION

**Everything in this document describes a best-guess REST/Bearer contract,
not a confirmed one.** As of when this feature was built, FabriXAI's real
Agent-invocation API was not publicly documented —
[docs.fabrix.ai](https://docs.fabrix.ai) only covers a separate
asset-analytics API (AIA/OIA), not conversational Agent chat. This document,
and the one function it describes, exist specifically so correcting this
assumption later touches exactly one place in the codebase.

## Where this lives

**File:** `backend/src/services/fabrixAIService.ts`
**Function:** `callFabrixAgent(config, request, signal)` (private to that
file — the only thing external callers use is the exported `sendMessage`,
whose `FabrixChatResult` shape is the stable contract the rest of the app
depends on).

Nothing outside `callFabrixAgent` knows or cares about the request/response
field names below — `sendMessage`'s retry/timeout/logging logic, and every
caller of `sendMessage` (`aiAssistantService.ts`, the admin
"Send test message" route), only ever see the normalized
`FabrixChatResult` type. **Correcting the real contract means editing only
`callFabrixAgent` and its two small inline mapper blocks — nothing else.**

## The current best-guess shape

The URL and auth headers below reflect the actual configured endpoint (a
Samsung SDS FabriXAI trial gateway) — only the **request/response body
shape** is still an unverified guess.

```
POST {baseUrl}     (the full chat endpoint — nothing is appended to it)
Headers:
  Content-Type: application/json
  Authorization: Bearer <apiKey>            (if configured)
  x-fabrix-client: <FABRIX_CLIENT_HEADER>    (if configured — a signed JWT this
                                               gateway requires)
  x-openapi-token: <FABRIX_OPENAPI_TOKEN>    (if configured — an OAuth2 bearer
                                               access token this gateway requires)

Request body (UNVERIFIED):
{
  "conversationId": "<optional string>",
  "messages": [
    { "role": "system" | "user" | "assistant" | "tool", "content": "<string>" }
  ]
}

Response body (200, UNVERIFIED):
{
  "conversationId": "<string>",
  "reply": "<string>",
  "usage": { "totalTokens": <number> },   // optional
  "model": "<string>",                     // optional
  "requestId": "<string>"                  // optional
}
```

Note that `request.agentId` is currently unused by `callFabrixAgent` — the
configured `baseUrl` already points at one specific agent/endpoint for this
gateway. If this deployment ever needs to route to more than one agent
through the same base URL, `agentId` will need to go somewhere in the
request (most likely a header) — it isn't today.

All three secrets (`apiKey`, `clientHeader`, `openApiToken`) are admin-
configurable from Configuration → AI Assistant Settings, encrypted at rest
the same way the SMTP password is (`secretCipher.ts`), with the server-side
`FABRIX_*` env vars as the deploy-time fallback for each — see
`fabrixSettingsService.ts`. `AdminSettings.value` was widened from
`NVARCHAR(255)` to `NVARCHAR(MAX)` (migration
`1960000000000-WidenAdminSettingValue`) specifically because the encrypted
`openApiToken` value is large enough to overflow the original column.

Non-2xx responses are read as text (capped to 500 chars) and treated as a
failure; 5xx and network-level failures (timeout/DNS/connection reset) are
retried up to `FABRIX_MAX_RETRIES` times with capped exponential backoff;
4xx failures are not retried.

## Why this specific shape was chosen

It's the most conventional possible design for a Bearer-authenticated chat
API — deliberately unsurprising, so it's a reasonable starting point and
minimizes how much has to change once the real contract is known. It is
**not** derived from any FabriXAI documentation, sample code, or support
conversation.

## What to check once real docs/console access are available

1. **Endpoint path.** Is it really `/api/v1/agents/{agentId}/chat`, or
   something else (e.g. a top-level `/chat` with the agent id in the body, a
   `/v1/completions`-style path, a different API version segment)?
2. **Auth scheme.** Confirm it's actually `Authorization: Bearer <key>` and
   not an API-key header (`X-API-Key`), a signed-request scheme, or OAuth2
   client-credentials (which would need a token-exchange step added
   upstream of `callFabrixAgent`, still isolated to this file).
3. **Conversation statefulness.** This integration currently resends the
   full message history on every call and ignores whatever
   `conversationId` FabriXAI itself might track server-side (see
   `aiAssistantService.ts`'s own doc comment on why — the provider's
   statefulness semantics are unconfirmed, so this backend stays the sole
   source of truth for conversation content). If FabriXAI's real API
   expects you to omit history and rely on its own `conversationId`
   instead, `callFabrixAgent`'s request body and `aiAssistantService.ts`'s
   `buildBaseTurns` both need revisiting.
4. **Response field names.** `reply` vs. `message`/`output`/`content`;
   `usage.totalTokens` vs. separate prompt/completion token counts; whether
   `model`/`requestId` are even returned.
5. **Tool/function calling.** If FabriXAI's Agent API has *native*
   structured tool-calling (rather than the plain-text-with-a-fenced-JSON-block
   convention this integration invented — see `aiSystemPrompt.ts`), that
   would let `aiAssistantService.ts` drop the manual fenced-JSON parsing in
   favor of a real structured response. This is a bigger, deliberate
   follow-up, not a one-line fix to `callFabrixAgent` alone.
6. **Streaming.** Not implemented at all in this integration (see the
   feature plan's own scoping note — no SSE/streaming plumbing exists in
   `apiClient.ts` yet). If wanted later, it's an isolated addition on top of
   a confirmed non-streaming contract, not a prerequisite for it.
7. **Rate limits / error codes.** Confirm which status codes are actually
   retryable — `isRetryableStatus` in `fabrixAIService.ts` currently treats
   every 5xx as retryable and every 4xx as final, which may not match
   FabriXAI's own guidance (e.g. a 429 should probably be retried too, with
   its own backoff hint if the API provides one via a header).

## How to verify the current guess

Configuration → AI Assistant Settings → "Send test message" (or
`POST /api/v1/admin/fabrix-settings/test` directly) sends the literal prompt
`"Reply with the single word OK."` through the full `sendMessage` →
`callFabrixAgent` path against whatever base URL/agent id/key are currently
configured. A failure response's `error` field is the raw
`FabriXAI request failed (<status>): <body>` text (never the key or
Authorization header — see `fabrixAIService.ts`'s logging discipline) —
useful first-hand evidence of what the real endpoint actually expects.
