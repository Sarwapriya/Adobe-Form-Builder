# FormIQ AI Chatbot: Groq + MCP RAG modification plan

Status: **Phase 2 implemented (2026-09-23).** Approved with "prioritise AX-Innovation (crm-ax), use Groq"; the blocking questions were resolved with the recommended defaults:

- **Q1:** `validate_form` and `save_draft_form` run in the backend (`ai_proposal_service.py`); the three retrieval tools run in the MCP server.
- **Q2:** admins see all subsidiaries.
- **Q3:** an HMAC-signed user-context header with a new shared `MCP_USER_CONTEXT_SECRET`.
- **Q4:** the backend keeps its own chat state and performs the approved save.

The sections below are the original Phase 1 analysis. CLAUDE.md ("AI chatbot") describes what was built.

Scope: the AI chatbot only (`/api/v1/ai/*`, `src/components/ai/*`, `src/store/aiChatStore.ts`) and the existing MCP server (`mcp-mssql`, source at `D:\Projects\AI\mcp_mssql_py-main\mcp_mssql_py-main`, a separate repository). Every path below is relative to this repository unless it is prefixed `MCP:`, which means relative to the MCP server repository.

---

## 1. Current state

### 1.1 Chatbot

**Where it lives**

| Layer | Files |
|---|---|
| UI | `src/components/ai/AIChatPanel.tsx` (mounted once in `src/app/AppLayout.tsx:739`), `AIChatInput.tsx`, `AIChatButton.tsx`, `AIActionCard.tsx`, `QuestionSuggestionCard.tsx`, `CampaignReferenceCard.tsx`, `AiBotAvatar.tsx` |
| UI state | `src/store/aiChatStore.ts` (Zustand) |
| API client | `src/api/aiChatApi.ts` (`sendChatMessage` :41, `confirmAction` :63, `rejectAction` :69, `searchCampaigns` :82, `getCampaign` :92) |
| Wire types | `packages/shared/src/ai/aiTypes.ts`, mirrored in `backend-py/app/form_pipeline/ai/types.py` |
| Router | `backend-py/app/routers/ai.py`: `POST /chat` :30, `GET /conversations` :56, `GET /conversations/{id}` :66, `POST /actions/{id}/confirm` :79, `POST /actions/{id}/reject` :98, `GET /campaigns/search` :111, `GET /campaigns/{id}` :129 |
| Orchestrator | `backend-py/app/services/aiAssistantService.py` |
| Provider chain | `backend-py/app/services/aiProviderService.py` → `fabrixAIService.py`, then `openaiCompatAIService.py` for each row from `ai_providers_service.py` |
| Retrieval tools | `backend-py/app/services/aiCampaignTools.py` (direct SQLAlchemy/ORM) |
| Prompt | `backend-py/app/services/aiSystemPrompt.py` (Python string constants; not a separate versioned file) |
| MCP client | `backend-py/app/services/mcp_sql_client.py` (disabled, see 1.3) |

**Request flow (today)**

1. `AIChatPanel` → `aiChatStore.sendMessage` → `POST /api/v1/ai/chat` (`routers/ai.py:30`), rate-limited to `20/15minutes` (`app/middleware/rate_limit.py:18`), `require_auth`.
2. `send_chat_message` (`aiAssistantService.py:169`) loads or creates the conversation (:245), persists the user message, and loads history (:268).
3. If a form is open, `get_campaign` is called **directly against the DB** (:184) and injected as a `CAMPAIGN DATA` system turn (`_build_base_turns` :380).
4. The system prompt is built from `aiSystemPrompt.build_system_prompt(role)`. Tools are described **in prose**. The model must answer with a fenced ```` ```json {"tool","args"} ```` block (`TOOL_CALL_CONVENTION`, `aiSystemPrompt.py:112`). No `tools` parameter is ever sent to any provider.
5. `send_ai_message` (:192) → `aiProviderService.send_message`: FabriX first (`aiProviderService.py:30`), then each enabled `fq.AiProviders` row (:42).
6. The reply is parsed for a fenced tool call (`_extract_tool_call`, :133):
   - read-only tool → `_handle_readonly_tool` (:460): runs the tool against the DB, re-prompts, and follows up to 3 chained read-only hops, then hands a proposal to `_handle_mutating_tool`;
   - mutating tool → `_handle_mutating_tool` (:792): stages an `AIAction` row (`_create_pending_action` :588). `SUGGEST_QUESTIONS` makes a second, separate LLM call (`_generate_suggested_questions` :651) and turns the result into `ADD_QUESTION` actions.
7. Response `{conversationId, message, actions[], references[]}` → UI renders the message, action cards and campaign reference cards. **No streaming** (`AIChatInput.tsx:8` states streaming is out of scope).

**Conversation state**: `fq.AIConversations`, `fq.AIConversationMessages` (roles user/assistant/tool; tool results are stored as JSON), `fq.AIActions` (`requestJson`, `confirmed`, `executed`, `executionResult`) (`app/models/ai_*.py`). History is trimmed to a character budget derived from Groq's TPM cap (`aiAssistantService.py:63`).

**Proposals and saving today**

- `ADD_QUESTION` / `UPDATE_QUESTION` / `DELETE_QUESTION` / `REORDER_QUESTIONS` are **client-applied**. On confirm, the backend only flags the action (`confirm_action` :917, last block). The UI then patches the open editor's in-memory draft (`applyClientAction`, `aiChatStore.ts:108`). Nothing is persisted until the user clicks the editor's own **Save Draft**/**Publish**.
- `CREATE_CAMPAIGN` / `CLONE_CAMPAIGN` are **server-executed** on confirm (`aiAssistantService.py:936-957`), creating a form.
- With no form open, confirmed `ADD_QUESTION`s are staged in the store. A later `CREATE_CAMPAIGN` confirm then **bypasses `/ai/actions/{id}/confirm`** and calls the form-create API directly with the staged questions (`aiChatStore.ts:222-242`).
- There is no whole-form "proposal" object, no validation step before a proposal is shown, and no approval token.

### 1.2 FabriX dependency

**Chatbot path (to be removed from the chatbot)**

- `aiProviderService.py:27,30-32,36-40`: FabriX is always tried first.
- `fabrixAIService.py` (187 lines): its own HTTP client, retry/backoff, and result contract `{ok, replyText, model, tokenUsage}`.
- `fabrix_settings_service.py`, `fabrix_models_service.py`, `models/fabrix_model.py`: settings and model list stored in `fq.AdminSettings` / `fq.FabrixModels`.
- Docstrings that call the chatbot "FabriXAI-backed": `routers/ai.py:3`, `form_pipeline/ai/types.py:3`, `packages/shared/src/ai/aiTypes.ts:2`, `packages/shared/src/index.ts:63`, `src/api/aiChatApi.ts:12`.
- `aiSystemPrompt.py:19-20`: a comment about FabriX's timeout budget.
- Env: `FABRIX_*` in `app/config.py:46-54` and `.env.example:29-37`.

**FabriX-specific behavior the chatbot depends on**: only the plain `{ok, replyText}` text contract. There is no streaming, no native function calling and no embeddings. Tool calling is prompt-based and provider-agnostic, so removing FabriX from the path doesn't break any FabriX-specific feature.

**Non-chatbot FabriX usage (report only, do not change)**

- Admin configuration: `routers/admin.py:734-826` (FabriX settings CRUD, `POST /admin/fabrix-settings/test` :765-775, FabriX model CRUD).
- UI: `src/components/admin/FabrixSettingsManager.tsx`, `FabrixModelManager.tsx`, `src/pages/ConfigurationPage.tsx`, `src/api/adminApi.ts`.
- Comment-only mentions: `security/dkms_client.py:24`, `services/admin_settings_service.py`, `services/dkms_settings_service.py`, `services/sftp_settings_service.py`, `scripts/move_tables_dbo_to_fq.sql`, `scripts/export_db_backup.ps1`.

Note: these admin screens exist only to configure the chatbot's FabriX tier. After the change they still work but no longer affect the chatbot (see Open question Q7).

### 1.2a Existing Groq configuration

- **Primary configuration is the `fq.AiProviders` table** (`models/ai_provider.py`, service `ai_providers_service.py`): `name`, `baseUrl`, `model`, `apiKeyEnc` (encrypted by `security/secret_cipher.py`), `isEnabled`, `sortOrder`. It is managed in Configuration > AI Assistant > Other AI Providers (`src/components/admin/OtherAiProvidersManager.tsx`, `OtherAiProviderPanel.tsx`, with a "Groq" preset at :18). The table is generic: it can hold any OpenAI-compatible provider (an OpenRouter row existed on some databases, see `scripts/force_openrouter_only.sql`).
- **Env fallback, used only while that table is empty**: `GROQ_API_KEY`, `GROQ_MODEL` (default `openai/gpt-oss-120b`), `GROQ_ENABLED` (`app/config.py:64-66`), and `DEFAULT_GROQ_BASE_URL = https://api.groq.com/openai/v1` (`ai_providers_service.py:26`). `OPENROUTER_*` is a second fallback (`config.py:68-70`).
- **Model setting**: `fq.AiProviders.model` (per row), falling back to `GROQ_MODEL`. The local database row is `openai/gpt-oss-120b` (seen in the backend log `provider='Groq' model=openai/gpt-oss-120b`). **The VM database row was not inspected.** `scripts/inspect_ai_providers.sql` shows it. If it holds a deprecated model (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `qwen/qwen3.6-27b`, `groq/compound*`), Phase 2 updates it and reports the change. No deprecated Groq model is hard-coded anywhere in code.
- **Client**: no Groq SDK. `openaiCompatAIService.py` makes a raw `httpx` POST to `<baseUrl>/chat/completions` (:145-160). It is created per call from a `ProviderConfig` (`ai_providers_service.py:33`). Groq-specific body (:42-55): `max_completion_tokens` scaled to a 7,600 TPM budget (:24), `reasoning_effort: "low"`.
- **Capabilities vs. needs**

| Need | Supported today? |
|---|---|
| Chat completion | Yes |
| Local tool/function calling (`tools` param, `tool_calls` response) | **No.** No `tools` is sent. There are workarounds for gpt-oss attempting native calls: `_native_tool_call_as_fenced_json` :65, `_tool_call_from_reasoning` :92, `_EMPTY_REPLY_NUDGE` :127 |
| JSON output | Prompt-based fenced JSON only; no `response_format` |
| Streaming | Not used by the UI; not implemented |
| Error handling | 401/429/other mapped to messages; **no retry/backoff on 429** (only an empty-content retry) |
| Reasoning exposure | `reasoning` is returned by Groq, never shown to the user, but read server-side by `_tool_call_from_reasoning` |

- **Groq remote MCP / built-in tools** (`browser_search`, `code_interpreter`, `groq/compound`): **none found** in any code path.

### 1.3 MCP server

- **Backend side**: `app/services/mcp_sql_client.py` uses the official `mcp` SDK over Streamable HTTP (`MCP_SQL_SERVER_URL`, a bearer `MCP_SQL_AUTH_TOKEN` shared with the nginx proxy; `config.py` MCP section). It is **hard-disabled**: `is_enabled()` returns `False` (:39-52). The dispatch code still exists: `aiAssistantService._build_mcp_tools_section` :293, the `MCP_TOOL` case in `_execute_readonly_tool` :542, and `ADMIN_MCP_SUPPLEMENT_NOTE` is commented out at `aiSystemPrompt.py:65-66`. **So today the chatbot does not use MCP at all.** All retrieval is direct ORM access in `aiCampaignTools.py`.
- **Server side** (`MCP:src/mcp_mssql/`): FastMCP 2 (`fastmcp>=2.3.4`), generic "MSSQL Intelligence Server". Tools (`MCP:src/mcp_mssql/tools/query_tools.py`):

| Tool | Params | Returns |
|---|---|---|
| `list_connections` :18 | none | `{name: {server, database}}` |
| `get_database_schema` :26 | `table_filter`, `include_relationships`, `connection="primary"` | tables/columns/FKs |
| `execute_sql_query` :36 | `query`, `description`, `connection` | `{columns, rows, row_count, …}` |
| `execute_parameterized_query` :44 | `query_template`, `parameters`, `connection` | same |
| `get_table_sample` :52 | `table_name`, `schema_name`, `sample_size`, `connection` | `SELECT TOP n *` rows |
| `find_related_tables` :62 | `table_name`, `connection` | FK list |
| `get_query_execution_plan` :82 | `query`, `connection` | plan XML |
| `refresh_schema_cache` :90 | `connection` | status |

- **Connections** (`MCP:src/mcp_mssql/config.py:65-88`, `MCP:.env`): `primary` = **`dwf-microsite-db-prd` on `dwf-microsite-dbserver-prd.database.windows.net` (DWF)**; `secondary` = **`crm-ax` on `ax-innovation-sqlserver.database.windows.net` (AX-Innovation, FormIQ's `fq.` schema)**. The default for every tool is `primary`, which is DWF.
- **Safety**: read-only via `ALLOW_WRITE_OPERATIONS=false` plus a sqlglot validator (`MCP:database/validator.py`). There is **no user context, no subsidiary filtering and no column allow-list**. There is no authentication on the internal network (`127.0.0.1:8000` plus `formiq-net`, `MCP:docker-compose.yml`); only the public nginx route checks a token.
- **The five required tools**

| Required tool | Status |
|---|---|
| `search_previous_campaigns` | **Missing in MCP.** The closest is the backend-local `SEARCH_CAMPAIGNS` / `FIND_SIMILAR_CAMPAIGNS` (`aiCampaignTools.py:189,295`), which query the DB directly (AX-Innovation) |
| `get_campaign_details` | **Missing in MCP.** Backend-local `GET_CAMPAIGN` / `GET_CAMPAIGN_QUESTIONS` (:229,238) |
| `search_question_library` | **Missing in MCP.** Backend-local `SEARCH_QUESTIONS` / `FIND_SIMILAR_QUESTIONS` (:245,324) |
| `validate_form` | **Missing in MCP.** Backend-local `VALIDATE_FORM` (:378) validates only an *existing saved* form by `formId`, not a proposal |
| `save_draft_form` | **Missing** everywhere. The nearest is `CREATE_CAMPAIGN` / `CLONE_CAMPAIGN` via `form_builder_service.create_form` (`form_builder_service.py:136`) |

### 1.4 Databases

- **AX-Innovation** (`crm-ax`): the backend's own `SQL_CONNECTION_STRING` (`app/db.py`, `config.py`), all tables in schema `fq` (`models/base.py:32`), and also MCP `secondary`.
  - Campaigns/forms: `fq.Forms` (`id, name, subsidiaryId, projectCode, status, origin, pendingReview, …, reviewNote, currentDraftVersionId, publishedVersionId, isDeleted, createdByUserId`).
  - Structure: `fq.FormVersions.definition` (NVARCHAR(MAX) JSON of `FormDefinition`) and `.config`.
  - Inside `FormDefinition` (`packages/shared/src/form/formDefinition.ts`): `questions[]` (id, order, controlType, headingByLocale, subheadingByLocale, required, `answers[]` = options, visibleInVariants, autoPopulate*, lockedFromSubsidiary), `fields` (profile-field *definitions*: labels/validation copy, not personal data), `consents`, `validationMessages`, `pageError`, `thankYou`, `locales`, and `meta` (subsidiary, sourceFileName, defaultLocale).
  - **There are no "sections" and no "conditional logic" in the data model.** Validations are the per-locale `validationMessages`, `required` flags, and profile-field rules enforced by the shared validator (`validate_form_definition`).
  - Related tables: `fq.FormContributions`, `fq.SubsidiaryProjectBlocks`, `fq.Subsidiaries`, `fq.ProjectCodes`, `fq.QuestionMasterVersions`.
- **DWF** (`dwf-microsite-db-prd`): chatbot touch points are
  - `aiSystemPrompt.py:33-38` (`ADMIN_MCP_SUPPLEMENT_NOTE` describes DWF tables and tells the model to query them; currently not appended);
  - MCP `primary` connection = DWF, and every MCP tool defaults to it;
  - `tests/test_mcp_disabled.py:45` asserts the DWF text is absent from the prompt.

  No other DWF access exists in the chatbot. The backend has no DWF connection string.
- **PII / customer data**
  - AX-Innovation: `fq.Users` (email/firstName/lastName, DKMS-encrypted, plus `username`, `emailHash`), `fq.RefreshTokens`, `fq.EmailLogs` (recipients), `fq.AIConversationMessages` (free text typed by users), `createdByUserId` / `submittedByUserId` / `triggeredByUserId` columns, `fq.Forms.reviewNote` (free text, may contain names).
  - FormIQ stores **no customer submissions**: generated forms post to Adobe Campaign.
  - DWF: tables named in the prompt (`CampaignFeedBack`, `DWF_CAMPAIGN_FEEDBACK`) suggest customer responses. **Column-level contents were not verified** (no DWF schema in either repository).
  - Current chatbot payloads (`CompactCampaign`, `QuestionSearchResult`) already exclude user and PII columns, but they are built as hand-picked dicts, not an enforced allow-list.
- **Direct DB access from the chatbot that bypasses MCP**: all of `aiCampaignTools.py`; `aiAssistantService.py:184` and `:798` (CAMPAIGN DATA / default locale); `get_caller_form_detail` in `_generate_translations`; conversation/action persistence (app state, not retrieval).

### 1.5 Authorization

- Identity comes from the JWT access token: `require_auth` (`app/security/deps.py:35`) yields `{sub, username, role, subsidiaryId}`. The role is one of `admin` / `superadmin` / `standard`; `is_admin_role` (`models/user.py`) is true for admin and superadmin.
- **Subsidiary users**: published forms of their subsidiary minus blocked project codes (`form_access_service.list_accessible_forms` :90, `get_accessible_form_detail` :121), plus their own ad-hoc forms and their subsidiary's drafts (`aiCampaignTools._list_caller_forms` :66-120, `get_caller_form_detail` :123).
- **Admins**: **every subsidiary.** There is no admin→subsidiary permission model anywhere (`User.subsidiaryId` is null for admins). "Admins see only their authorized subsidiaries" has no existing rule to enforce (Q2).
- **MCP tools receive no user context** and do no subsidiary filtering.
- **LLM-settable authorization values (flags)**
  1. `CREATE_CAMPAIGN` / `CLONE_CAMPAIGN.subsidiaryId`: honoured for admins (`aiAssistantService.py:939,949`); ignored for standard users (good).
  2. **`CLONE_CAMPAIGN.sourceFormId` is not access-checked.** `confirm_action` re-checks only `action.formId`, and `create_form` loads the copy source with an unscoped `get_form_detail` (`form_builder_service.py:164`). **A standard user can clone another subsidiary's form by ID.** This is an existing bug.
  3. Frontend `CREATE_CAMPAIGN` with staged questions uses the LLM's `subsidiaryId`, defaulting to the literal `"SESAR"` (`aiChatStore.ts:226`). For admins the backend accepts it.
  4. `_find_owned_action` (:1007) lets any admin confirm any user's action.
  5. MCP `connection` / `schema_name` / `table_name` / raw SQL are fully LLM-controlled (moot while MCP is disabled).

### 1.6 Save flow

- Nothing saves a form without a user click today. Client-applied edits need the editor's Save. Server-executed create/clone needs a confirm click.
- However, confirm is **not tied to a validated version**. The action payload is whatever the LLM produced, with no validation, and there is no check that the saved content equals what the user reviewed.
- The existing UI already has an approval surface: `AIActionCard` (Create / Add / Apply buttons) and `QuestionSuggestionCard`. A new "Approve & Save" action fits there.

---

## 2. Gap analysis

| Requirement | Current state | Change needed | Files affected |
|---|---|---|---|
| Modify only the chatbot | n/a | Keep all changes inside the AI chat path, the MCP server, and chatbot UI components | see §3 |
| FabriX removed from chatbot; Groq only | FabriX first, then any `fq.AiProviders` row (any vendor) | The chatbot calls only Groq: the `fq.AiProviders` row whose host is `api.groq.com`, else the `GROQ_*` env. No FabriX and no other rows in the chatbot path | `aiProviderService.py`, new `groqChatService.py`, `ai_providers_service.py` |
| Model `openai/gpt-oss-120b` from config | Row/env driven; VM value unknown | Read the model from the Groq provider row/env; report and update if deprecated | `ai_providers_service.py`, SQL check script |
| Local tool calling; no remote MCP or built-ins | Prompt-based fenced JSON; no `tools` | Send MCP tools as `tools` function definitions and execute `tool_calls` in the backend; loop with a max round count. Assert no `type: "mcp"`/built-in tools are ever sent | `groqChatService.py`, `aiAssistantService.py`, `aiSystemPrompt.py` |
| Reasoning never exposed | Not exposed, but parsed server-side | Request hidden reasoning (see Q9) and remove the reasoning-scraping workaround | `openaiCompatAIService.py` / `groqChatService.py` |
| 429/error retry with backoff | No retry on 429 | Retry with exponential backoff honouring `retry-after`; friendly final message | `groqChatService.py` |
| AX-Innovation is the only RAG source; DWF never | Direct ORM to AX-Innovation; MCP (disabled) defaults to DWF | New MCP tools pinned server-side to `secondary`; the LLM can't choose a connection. Remove DWF text from the prompt | `MCP:tools/formiq_tools.py`, `MCP:config.py`, `aiSystemPrompt.py` |
| Existing MCP server reused; retrieval only in MCP | MCP disabled; retrieval in `aiCampaignTools.py` | Add FormIQ tools to `mcp-mssql`; re-enable the client for these tools only; chatbot retrieval goes through MCP | `MCP:…`, `mcp_sql_client.py`, `aiAssistantService.py` |
| No direct DB access from chatbot | `aiCampaignTools` plus :184/:798 | Replace with MCP calls. Persistence of chat history/actions stays (app state, not LLM retrieval; Q4) | `aiAssistantService.py`, `routers/ai.py` (`/campaigns/*` helpers) |
| Subsidiary auth in MCP and backend | Backend only; MCP has none | Backend sends a signed user-context header; MCP verifies it and filters at query level; LLM filters are intersected | `mcp_sql_client.py`, `MCP:auth.py`, `MCP:formiq_tools.py` |
| Subsidiary user sees own only; admins only authorized | Standard: own. Admin: all | Standard: unchanged rule, reimplemented in MCP SQL. Admin: all, unless an admin→subsidiary mapping is introduced (Q2) | `MCP:formiq_tools.py` |
| No PII to LLM | Hand-picked dicts | Explicit field allow-list in MCP projection; tests assert no other keys | `MCP:formiq_tools.py`, tests |
| Reuse previous configurations | Prompt asks to search first; `sourceQuestionId` not tracked | Prompt v2: search first, reuse, record `sourceQuestionId`; proposal schema carries it | `prompts/formiq_chatbot_v2.md`, proposal model |
| No invented DB IDs | Not checked | `validate_form` rejects unknown `sourceFormId`/`sourceQuestionId`; new items must have `id: null` | validate tool |
| Validate before presenting | No proposal validation | Every proposal passes `validate_form` before the UI sees it; failures loop back to the model | `aiAssistantService.py` |
| Save only after explicit approval, enforced in backend | Confirm click, but unbound to content | Approval token = HMAC over the validated draft hash + user + conversation, one-time, short TTL; `save_draft_form` re-hashes and rejects mismatches | new `ai_proposal_service.py`, `routers/ai.py`, new table |
| Existing UI unchanged except where required | n/a | Add one `ProposalCard` (preview, validation result, **Approve & Save**); everything else stays | `src/components/ai/ProposalCard.tsx`, `aiChatStore.ts`, `aiChatApi.ts`, shared types |
| Fix LLM-controlled authorization inputs | Flags 1.5 #2 and #3 | Scope-check `sourceFormId`; stop honouring LLM `subsidiaryId` for standard users (already the case) and validate it for admins; remove the `"SESAR"` default | `aiAssistantService.py`, `aiChatStore.ts` |

---

## 3. Proposed changes (file by file)

### FormIQ backend (`backend-py/`)

| File | Action | Reason |
|---|---|---|
| `app/services/groqChatService.py` | **Add** | A thin Groq client (httpx, no new SDK): `chat(messages, tools, *, max_rounds)`; reads the Groq provider config; sends `tools`, never `type:"mcp"` or built-ins; hidden reasoning; 429/5xx retry with backoff (honours `retry-after`); never logs keys or prompts (logs only status, duration, token counts) |
| `app/services/aiProviderService.py` | **Modify** | Chatbot entry point calls `groqChatService` only; FabriX and non-Groq rows are removed from this path |
| `app/services/openaiCompatAIService.py` | **Modify / trim** | Keep only for the admin "Send test message" on provider rows (non-chatbot). Remove the reasoning-scraping and nudge workarounds once native `tools` are in use |
| `app/services/ai_providers_service.py` | **Modify** | Add `get_groq_provider_config(db)`: the enabled row with host `api.groq.com` (lowest `sortOrder`), else the `GROQ_*` env; `None` means the chatbot is unavailable |
| `app/services/aiAssistantService.py` | **Modify** | Replace fenced-JSON parsing with a native tool-call loop (max 5 rounds); tool dispatch → MCP; add the proposal → validate → present cycle; replace direct `get_campaign` (:184, :798) with MCP `get_campaign_details`; fix the `sourceFormId` scope check |
| `app/services/mcp_sql_client.py` | **Modify** | Re-enable **only** for the FormIQ tool allow-list (the five tools); attach a signed user-context header per call; the raw-SQL tools are never exposed to the chatbot |
| `app/services/mcp_user_context.py` | **Add** | Builds the trusted header: base64 JSON `{sub, role, subsidiaryId, exp≤60s}` plus HMAC-SHA256 with a new `MCP_USER_CONTEXT_SECRET` (stdlib `hmac`, no new dependency) |
| `app/services/aiCampaignTools.py` | **Remove from chatbot path** | Kept only if `routers/ai.py` `/campaigns/*` convenience endpoints stay (Q4); otherwise those endpoints call MCP too |
| `app/services/ai_proposal_service.py` | **Add** | Stores proposal versions (canonical JSON + SHA-256), issues an approval token after a validation pass and the user click, and verifies the token plus hash on save; delegates the actual write to `form_builder_service.create_form` / draft update (existing business rules: subsidiary active, project-code open/blocked, locales) |
| `app/models/ai_form_proposal.py` + `scripts/ai_form_proposals_migration.sql` | **Add** | Table `fq.AIFormProposals` (`id, conversationId, userId, subsidiaryId, formId?, version, definitionJson, contentHash, validationStatus, approvalTokenHash, approvedAt, consumedAt, createdAt`). Idempotent SQL, run by hand (no migration framework) |
| `app/routers/ai.py` | **Modify** | Add `POST /ai/proposals/{id}/approve` (user click → token) and `POST /ai/proposals/{id}/save` (token required). `/chat` response gains an optional `proposal` |
| `app/services/prompts/formiq_chatbot_v2.md` + loader in `aiSystemPrompt.py` | **Add / modify** | Versioned prompt file: search first, reuse with `sourceQuestionId`, `id: null` for new items, validate before presenting, never copy PII, no DWF. Remove `ADMIN_MCP_SUPPLEMENT_NOTE` |
| `app/form_pipeline/ai/types.py` | **Modify** | Add `AIFormProposal` wire types |
| `app/config.py`, `.env.example` | **Modify** | Add `MCP_USER_CONTEXT_SECRET`, `GROQ_MAX_TOOL_ROUNDS`; FabriX env vars stay (used by the admin screens) |
| `tests/…` | **Add** | See §6 |

### MCP server (`MCP:` repository)

| File | Action | Reason |
|---|---|---|
| `src/mcp_mssql/auth.py` | **Add** | Verifies the HMAC user-context header (via FastMCP `get_http_headers()`); rejects missing, expired or bad signatures; the tools never accept role or subsidiary as arguments |
| `src/mcp_mssql/tools/formiq_tools.py` | **Add** | The FormIQ tools (§4): fixed, parameterized SQL on the `secondary` (AX-Innovation) connection only; subsidiary filter in the `WHERE` clause; JSON `definition` parsed and projected through an allow-list |
| `src/mcp_mssql/config.py` | **Modify** | Add `FORMIQ_CONNECTION="secondary"`, `MCP_USER_CONTEXT_SECRET` |
| `src/mcp_mssql/tools/query_tools.py` | **No change** | The raw-SQL tools stay for their existing users but are filtered out of the chatbot's tool list by the backend allow-list (Q3) |
| `tests/` | **Add** | Scoping, PII allow-list, and DWF-never tests against a test DB or SQL fixtures |

### Frontend

| File | Action | Reason |
|---|---|---|
| `src/components/ai/ProposalCard.tsx` | **Add** | Read-only preview (questions, options, reused-from badges), validation result, and **Approve & Save** / **Request changes** |
| `src/components/ai/AIChatPanel.tsx` | **Modify (small)** | Render `ProposalCard` when a response carries `proposal` |
| `src/store/aiChatStore.ts`, `src/api/aiChatApi.ts` | **Modify** | `approveProposal`, `saveProposal`; remove the `"SESAR"` default and the direct create bypass (:222-242) |
| `packages/shared/src/ai/aiTypes.ts` | **Modify** | Proposal types (mirrors the Python types) |

No new npm or pip dependencies. The MCP server needs none either: it uses stdlib `hmac`/`hashlib`, and `fastmcp` already exposes request headers.

---

## 4. MCP tool changes

All five tools run on `secondary` (AX-Innovation) only. They take **no** role, subsidiary-authorization or connection arguments; scope comes from the verified header. An optional `subsidiary` search filter is intersected with the authorized scope.

```text
search_previous_campaigns(
  query?: str,              # name / campaign type / purpose keywords (+ alias expansion, e.g. HR↔Hand Raiser)
  projectCode?: str,
  subsidiary?: str,         # filter only; intersected with scope, can never widen it
  status?: "draft"|"published"|"unpublished",
  similarToFormId?: str,    # similar-structure search (question-set overlap)
  limit?: int (≤10)
) -> [{formId, name, subsidiary, projectCode, status, questionCount, locales[], updatedAt}]

get_campaign_details(formId: str)
  -> {formId, name, subsidiary, projectCode, status, defaultLocale, locales[],
      questions[{id, order, controlType, required, heading, subheading,
                 answers[{id, order, text}], visibleInVariants}],
      profileFields[{key, enabled, required}], consents[{id, required}],
      validationMessageKeys[]}
  # returns NOT_FOUND (same shape as "doesn't exist") when outside scope

search_question_library(
  text: str, controlType?: str, formId?: str, subsidiary?: str, limit?: int (≤20)
) -> [{sourceFormId, formName, sourceQuestionId, heading, controlType, required, answers[]}]

validate_form(proposal: FormProposal)
  -> {ok, errors[{path, code, message}], warnings[...]}
  # FormDefinition rules + every sourceFormId/sourceQuestionId must exist AND be in scope;
  # new items must have id=null; unknown fields rejected

save_draft_form(proposalId: str, approvalToken: str)
  -> {formId, versionId} | {error}
```

Allow-list (the only keys that can ever leave MCP): the fields shown above. Excluded by construction: `createdByUserId`, `reviewNote`, anything from `fq.Users`, `fq.AIConversation*`, `fq.EmailLogs`, `fq.RefreshTokens`, `meta.sourceFileName`, image `src` URLs (Q8).

**Where `validate_form` and `save_draft_form` should run is an open decision (Q1).** The MCP server is read-only by design (`ALLOW_WRITE_OPERATIONS=false`) and has none of FormIQ's write rules (version rows, project-code lock/expiry, subsidiary blocks, locale lists), and the shared `FormDefinition` validator lives in the backend. **Recommendation:** implement those two as *backend-local* tools that the backend exposes to Groq next to the three MCP retrieval tools. The LLM sees one tool list, every call still executes in the backend, and FormIQ's write logic stays in one place. The alternative is porting the validator and create logic into the MCP server and granting it write access to `fq.Forms`/`fq.FormVersions`.

---

## 5. Risks and open questions

**Blocking: please answer before Phase 2**

- **Q1. Location of `validate_form` / `save_draft_form`.** Backend-local tools (recommended; see §4) or inside the MCP server (requires write access, duplicates business rules)?
- **Q2. Admin scope.** No admin→subsidiary permission exists; admins see all subsidiaries today. Keep "admins = all" (no schema change), or add an admin→subsidiaries mapping (new table, admin UI, migration)?
- **Q3. Trusted channel.** The proposal is an HMAC-signed, 60-second user-context header with a new shared secret in both services' env. The MCP server has no auth on the internal network today; should it also start requiring `MCP_SQL_AUTH_TOKEN` on the internal route? Other clients of `mcp-mssql` (anything using the raw-SQL tools against DWF) keep working either way.
- **Q4. "No direct database access from the chatbot."** Is it acceptable that the backend still reads and writes its own chat state (`AIConversations`, `AIActions`, the new proposals table) and performs the approved save via `form_builder_service`? The plan routes all LLM-bound data through MCP but keeps that app state local. Also: should the non-chat helper endpoints `GET /ai/campaigns/search` and `/ai/campaigns/{id}` move to MCP too?

**Non-blocking (defaults shown)**

- **Q5. Sections and conditional logic** don't exist in `FormDefinition`, so search can't match on them. "Product/model" has no field either; it is matched by keyword in names and question text. Default: document and don't invent new fields.
- **Q6. Streaming.** The UI doesn't stream. Default: no streaming.
- **Q7. FabriX admin screens** stay but no longer influence the chatbot. Default: leave them (the rule is "UI unchanged"); optionally add a one-line note on that screen.
- **Q8. PII edge cases.** Default: exclude `reviewNote` and `meta.sourceFileName`; exclude image URLs; include `redirectAfterSuccessUrlByLocale` and privacy URLs? Default: exclude. DWF tables are never touched, so their PII isn't reachable.
- **Q9. Hidden reasoning on Groq.** For gpt-oss models Groq documents `include_reasoning` (and `reasoning_format` for other reasoning models). This is to be verified against current Groq docs during implementation. Default: `include_reasoning: false`, `reasoning_effort: "low"`.
- **Q10. Rate limits.** Groq on-demand allows 8,000 TPM. A tool loop of 3–5 rounds with a ~2.5k-token prompt will hit 429s under concurrent use even with backoff. Recommend the Groq Dev tier, or trimming tool schemas and prompt size.
- **Q11. Existing per-question edit flow** (`ADD_QUESTION`/`UPDATE_QUESTION` into the open editor, then the editor's Save). Default: keep it unchanged for editing an open campaign; the new proposal → approve → save flow is for creating a draft.
- **Q12. VM model value.** Run `scripts/inspect_ai_providers.sql` on the VM; report and update if it's deprecated.

**Risks**

- Access rules get reimplemented in SQL inside MCP (duplicating `form_access_service`). Mitigation: a shared test matrix run against both implementations.
- `FormVersions.definition` is JSON; server-side parsing in MCP must track `FormDefinition` shape changes (a third copy alongside the TS and Python pipelines).
- The approval token must be bound to the exact canonical JSON; key-order or float differences would cause false mismatches. Mitigation: a canonical JSON serializer in one place.
- A cross-repository change: MCP-server deploys must be coordinated with backend deploys (the header secret must match).

---

## 6. Test plan

| Requirement | Test | Where |
|---|---|---|
| Groq chat + local tool loop | Mocked Groq (`httpx.MockTransport`): text reply; one `tool_calls` round then answer; multi-round; max-round cutoff | `backend-py/tests/test_groq_chat_service.py` |
| JSON output | Proposal returned as tool-call args and parsed into `FormProposal` | same |
| No remote MCP or built-ins | Inspect every outgoing request body: every `tools[].type == "function"`, names ⊆ allow-list, no `mcp`/`browser_search`/`code_interpreter`; model from config | same |
| No FabriX or other providers | FabriX and a non-Groq row enabled → neither is called by the chatbot | `tests/test_ai_provider_selection.py` |
| 429/5xx retry | 429 then 200 → success after backoff; 429 ×N → friendly message; `retry-after` honoured; no key in logs | `test_groq_chat_service.py` |
| Subsidiary isolation | Standard user A: search and `get_campaign_details` for subsidiary B's form → empty / NOT_FOUND | `MCP:tests/test_formiq_scope.py` + backend integration test |
| Admin scope | Per the Q2 decision: all, or only mapped subsidiaries | same |
| LLM filter can't widen | Standard user passes `subsidiary="B"` → empty; admin filter narrows only | same |
| Header trust | Missing, expired, tampered or wrong-secret header → rejected | `MCP:tests/test_auth.py` |
| No DWF | FormIQ tools use only the `secondary` engine (engine spy); the prompt contains no DWF names; the backend tool list excludes the raw-SQL tools | MCP + `tests/test_mcp_disabled.py` (updated) |
| No PII | Every tool response's keys ⊆ allow-list (recursive); a seeded `reviewNote`/user email never appears | `MCP:tests/test_formiq_allowlist.py` |
| Validation before presenting | An invalid proposal never reaches the response; the loop feeds errors back | `tests/test_ai_proposal_flow.py` |
| No invented IDs | Unknown / out-of-scope `sourceQuestionId` → `validate_form` error; non-null `id` on a new item → error | same |
| Approval gate | Save without token → 403; token for version 1 used after version 2 edits → 409; reuse of a consumed token → 409; unvalidated proposal can't be approved | same |
| Clone scope bug | Standard user confirms `CLONE_CAMPAIGN` with a foreign `sourceFormId` → rejected | `tests/test_ai_confirm_scope.py` |
| UI | `ProposalCard` renders a proposal, **Approve & Save** calls approve then save, disabled while validation fails | frontend vitest (`tests/`) |
| Regression | Full `pytest`, `npm run test`, `npm run test:shared`, `npm run build` after each step | CI / local |
