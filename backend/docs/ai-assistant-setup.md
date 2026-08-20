# AI Form Builder Assistant — setup

The AI assistant is a FabriXAI-backed chat copilot layered onto the existing
Form Builder. It never touches the database directly — every action it
proposes goes through the app's own controlled services
(`formBuilderService`, `formAccessService`) and every mutation requires an
explicit human confirmation before anything changes. See
`backend/src/services/aiAssistantService.ts` for the orchestration and
`fabrixai-integration.md` (next to this file) for the wire-contract details.

## 1. Environment variables

Added to `backend/.env.example` — see that file for the exact block. Summary:

| Variable | Purpose |
|---|---|
| `FABRIX_API_BASE_URL` | Base URL of the FabriXAI Agent API, e.g. `https://api.fabrix.ai`. |
| `FABRIX_API_KEY` | API key sent as `Authorization: Bearer <key>`. Never logged. |
| `FABRIX_AGENT_ID` | The FabriXAI agent id this assistant talks to. |
| `FABRIX_TIMEOUT_SECONDS` | Per-request timeout before the call is aborted and retried (default 30). |
| `FABRIX_MAX_RETRIES` | Retries on timeout/5xx/network error, capped exponential backoff (default 2). |
| `FABRIX_ENABLED` | Set to `false` to disable the assistant outright without clearing the other values (default `true`). |

These env vars are only the **fallback**. An admin can configure the base
URL/agent id/API key/enabled flag directly from the Configuration page (see
§3 below); DB-stored settings always take precedence when set, exactly like
the existing SMTP settings feature. The assistant returns a graceful "AI
service is temporarily unavailable" message (never an error page) if neither
the DB nor the env vars have a usable base URL + agent id configured.

## 2. Running the migration

The feature's 3 new tables (`AIConversations`, `AIConversationMessages`,
`AIActions`) are added by migration
`backend/src/migrations/1950000000000-AddAiAssistant.ts`, already registered
in `backend/src/config/data-source.ts` and mirrored into
`backend/sql/init.sql` for a from-scratch database. Run it the same way as
every other migration in this repo:

```
cd backend
npm run typeorm -- migration:run
```

## 3. Admin Configuration UI

Once the frontend's "AI Assistant Settings" panel is wired into the
Configuration page (`src/pages/ConfigurationPage.tsx` /
`src/components/admin/FabrixSettingsManager.tsx`), an admin can:

1. Enter the FabriXAI base URL and agent id.
2. Enter the API key (write-only — once saved, the form only shows whether a
   key is set, never the key itself; leaving the field blank on a later save
   keeps the existing key unchanged).
3. Toggle "Enabled" on/off.
4. Click "Send test message" to exercise the full round trip — this hits
   `POST /api/v1/admin/fabrix-settings/test`, which sends the literal prompt
   `"Reply with the single word OK."` through `fabrixAIService.sendMessage`
   and reports `{ ok: true }` or `{ ok: false, error }`. A failure here
   usually means either the settings are wrong, or the wire contract in
   `fabrixAIService.ts`'s `callFabrixAgent` needs correcting against the real
   FabriXAI API — see `fabrixai-integration.md`.

Until the frontend panel exists, the same three endpoints can be exercised
directly:

```
GET   /api/v1/admin/fabrix-settings
PATCH /api/v1/admin/fabrix-settings    { baseUrl, agentId, apiKey?, enabled? }
POST  /api/v1/admin/fabrix-settings/test
```

(all `requireAdmin` — admin or superadmin JWT required).

## 4. Sending a test chat message

Once settings are configured and enabled, any authenticated user (admin or a
subsidiary-scoped standard user) can chat with the assistant:

```
POST /api/v1/ai/chat
{ "message": "What campaigns do we have for project code SPRING25?" }
```

returns

```
{ "conversationId": "...", "message": "...", "actions": [], "references": [...] }
```

Pass `formId` alongside `message` to give the assistant the currently-open
campaign's compact context (name/status/locales/questions), and
`conversationId` on subsequent calls to continue the same thread. See
`packages/shared/src/ai/aiTypes.ts` for the full request/response shape and
the 15 supported tools, and `backend/src/services/aiSystemPrompt.ts` for
exactly what the model is told about them.

A subsidiary-scoped standard user only ever sees/searches/modifies their own
subsidiary's forms through the assistant — the same scoping
`GET /api/v1/forms` already enforces for a human. An admin sees every form.
Nothing the model proposes (`ADD_QUESTION`, `DELETE_QUESTION`,
`CREATE_CAMPAIGN`, etc.) takes effect until the corresponding
`POST /api/v1/ai/actions/:id/confirm` call succeeds.
