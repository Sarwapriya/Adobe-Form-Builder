# AI Copilot Integration Plan

## Goal
Integrate a FabriXAI-powered AI Assistant (Copilot) into the existing Adobe Form Builder without creating a separate frontend application. The assistant will be accessible via a collapsible panel in the Form Builder UI, communicate with the backend only, and orchestrate existing services via controlled tool actions.

## Assumptions
- Backend is a Node/Express TypeScript server using TypeORM for MSSQL.
- Frontend is React + TypeScript with a custom UI component library located under `src/components`.
- Existing authentication uses JWTs; `requireAdmin` middleware protects admin routes.
- The FabriXAI API credentials will be supplied via environment variables.
- No new external UI libraries will be introduced.

## Architecture Overview
```
React UI (AI panel) -> /api/ai/chat (POST) -> AI Service -> FabriXAI API
   ^                                                   |
   |                                                   v
   |<--- AI Service calls controlled backend tools (search, create, update, validate) using existing services
   |
   +--- Existing Form Builder services (campaign, question, form, validation, accessibility, translation)
```
All AI‑generated actions are routed through the backend, validated, and require user confirmation for destructive operations.

## Design Decisions & Alternatives
1. **Route Placement**
   - **Chosen:** New router `backend/src/routes/ai.router.ts` mounted at `/api/ai` in `app.ts`.
   - **Alternative:** Extend existing `formBuilder.router.ts`. Rejected because AI concerns are orthogonal and to keep routing clean.
2. **Service Layer**
   - **Chosen:** New `AiService` handling request validation, FabriXAI call, parsing response, and dispatching tool actions.
   - **Alternative:** Embed logic directly in the router. Rejected for separation of concerns and testability.
3. **Environment Configuration**
   - Add `FABRIX_API_BASE_URL`, `FABRIX_API_KEY`, `FABRIX_AGENT_ID`, optional `FABRIX_TIMEOUT_SECONDS`, `FABRIX_MAX_RETRIES`, `FABRIX_ENABLED`.
   - Use existing `requireEnv` for mandatory vars, optional helper for non‑required.
4. **Database Schema**
   - Add entities `AiConversation` and `AiConversationMessage` (and optionally `AiAction`). These will be persisted for auditability.
   - Migrations will be added to `backend/src/migrations/` with sequential timestamps.
5. **Frontend Components**
   - Create new folder `src/components/ai` with components: `AIChatButton.tsx`, `AIChatPanel.tsx`, `AIChatHeader.tsx`, `AIChatMessage.tsx`, `AIChatInput.tsx`, `AIThinkingIndicator.tsx`, `AIActionCard.tsx`, `CampaignReferenceCard.tsx`, `QuestionSuggestionCard.tsx`, `AIConfirmationDialog.tsx`.
   - Reuse existing design system components (`common/ConfirmDialog`, `LoadingState`, etc.) for consistency.
6. **State Management**
   - Add Redux slice (or context) `aiConversation` under `src/store/` to hold conversation ID, messages, loading state.
   - Actions: `fetchConversation`, `sendMessage`, `receiveMessage`, `confirmAction`.
7. **Tool Execution Flow**
   - Backend receives user message, forwards to FabriXAI with system prompt (provided in spec) and current campaign context.
   - FabriXAI returns JSON with `actions` (structured as per spec).
   - `AiService` validates each action against a whitelist, ensures user permissions, and executes via existing services (e.g., `CampaignSearchService`, `FormBuilderService`).
   - Destructive actions (`DELETE_QUESTION`, `DELETE_CAMPAIGN`, etc.) are marked `requiresConfirmation:true`; backend returns them to frontend for user confirmation before execution.
8. **Validation Pipeline**
   - After any `CREATE`/`UPDATE` action that produces a `formDefinition.json`, run existing AJV schema validation (`formDefinitionSchema`).
   - Run accessibility validation via existing Axe integration (`validationService.validateAccessibility`).
   - Only on successful validation will the changes be persisted.
9. **Security Considerations**
   - Never expose `FABRIX_API_KEY` to the client. It is read from env on the server.
   - All AI actions are authorized using the same JWT middleware as other admin routes.
   - Prompt injection protection: prepend system instructions, isolate user content.
   - Rate limiting already applied globally; AI endpoint inherits `rateLimit` middleware.
10. **Future Extensibility**
    - The action contract (`action`, `requiresConfirmation`, `data`) allows adding new tools without code changes to the front‑end.
    - `AiService` can be expanded to include semantic search later.

## Implementation Steps (Task List)
---
1. **Explore Existing Codebase** (completed): identified backend services, routing, env handling, UI component structure.
2. **Create Migration for AI Tables**
   - Add `AiConversation`, `AiConversationMessage`, `AiAction` entities.
   - Generate migration file `AddAiConversationTablesXXXXXX.ts`.
3. **Add Entities**
   - Implement TypeORM entity classes in `backend/src/entities/`.
4. **Update DataSource**
   - Import new entities in `config/data-source.ts`.
5. **Add Env Variables**
   - Extend `.env.example` with FabriXAI vars and document.
   - Add optional helper `optionalEnv(name:string): string|undefined` in `utils/env.ts`.
6. **Implement AiService**
   - Create `backend/src/services/aiService.ts`.
   - Functions: `processMessage(conversationId, campaignId, userId, text)`.
   - Handles FabriXAI HTTP call (using `node-fetch` or existing HTTP client), parses actions, dispatches to existing services.
   - Include retry logic respecting `FABRIX_MAX_RETRIES`.
7. **Create AI Router**
   - `backend/src/routes/ai.router.ts` with routes:
     - `POST /chat` (create or use existing conversation, returns messages & actions).
     - `GET /conversations` etc. (reuse patterns from other routers).
   - Apply `requireAdmin` and `rateLimit` middleware.
8. **Register Router**
   - In `backend/src/app.ts`, import and `app.use('/api/ai', aiRouter);`.
9. **Frontend State Slice**
   - Add `aiConversationSlice.ts` under `src/store/` (or similar).
   - Implement async thunks calling `/api/ai/chat`.
10. **Create UI Components**
    - Scaffold components in `src/components/ai/`.
    - Use existing CSS/layout from other panels for consistency.
    - `AIChatPanel` contains header, message list, input, and shows `AIThinkingIndicator` while awaiting response.
11. **Integrate Panel into Form Builder UI**
    - Add collapsible panel toggle button (e.g., in `BuilderActionBar.tsx`).
    - Ensure panel does not obstruct canvas; use CSS flex layout.
12. **Audit Logging**
    - Within `AiService`, after each action execution, create `AiAction` record with execution result.
13. **Testing**
    - Add unit tests for `AiService` (mock FabriXAI responses).
    - Add integration tests for AI router (POST `/api/ai/chat`).
    - Frontend component tests (snapshot, interaction).
14. **Documentation**
    - Update `README.md` with setup steps for FabriXAI env variables.
    - Add API docs in `docs/` if exists.

## Open Questions (User Confirmation Needed)
1. **UI Design Preference** – Should the AI panel use the existing dark/light theme? Any specific width?
2. **Conversation Persistence** – Keep conversations indefinitely or purge after X days? (default: keep).
3. **Rate Limiting** – Desired per‑user limit for AI calls? (default: inherit global limit).

Please confirm the above decisions or provide preferences.
