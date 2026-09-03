# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Frontend (repo root):

```
npm run dev                      # start Vite dev server
npm run build                    # builds packages/shared, then tsc -b (project references), then vite build
npm run lint                     # oxlint
npm run test                     # vitest run (single run) — scoped to tests/, excludes packages/**
npm run test:watch               # vitest watch mode
npm run preview                  # preview a production build
npm run dev:shared                # tsup --watch on packages/shared — run alongside `npm run dev` in a second terminal when iterating on form/codegen code
npm run test:shared               # vitest run scoped to packages/shared/tests
```

Run a single frontend test file: `npx vitest run <path>` (or `npx vitest <path>` to watch just that file).

Frontend tests live in `tests/` (not `src/`) and cover only frontend-specific code (currently `tests/codegen/previewDocument.test.ts`, the preview-iframe glue). Vitest is configured in `vite.config.ts` (jsdom environment, `globals: false` — import `describe`/`it`/`expect` explicitly from `vitest`; `exclude` deliberately keeps this run from also picking up `packages/shared/tests`).

The codegen pipeline itself lives in `packages/shared/` (see below) with its own test suite under `packages/shared/tests/` (`codegen/` snapshot- and unit-tests the generated output — `generate.test.ts`'s snapshot lives in `packages/shared/tests/codegen/__snapshots__/`; `excel/questionMasterRows.test.ts`/`questionMasterWorkbook.test.ts` cover the Question Master export), run via `npm run test:shared`.

TypeScript is split via project references: `tsconfig.app.json` (src, browser) and `tsconfig.node.json` (Vite config). `npm run build` type-checks both after building `packages/shared` (whose declaration files the frontend's `tsc -b` pass needs to resolve `@formbuilder/shared`'s types).

Backend (`backend-py/` — a standalone Python/FastAPI service, not an npm workspace):

```
cd backend-py
python -m venv .venv                          # one-time
.venv\Scripts\activate                        # Windows; source .venv/bin/activate elsewhere
pip install -e ".[dev]"                       # one-time (and again after pyproject.toml dependency changes)
python -m playwright install chromium         # one-time — installs the headless Chromium binary the QA-run feature needs
uvicorn app.main:app --reload --port 4001     # dev server
pytest                                        # backend-py/tests, its own pytest config
python scripts/seed_admin.py                  # one-time — creates the first admin User row from ADMIN_USER/ADMIN_EMAIL/ADMIN_PASSWORD_HASH env vars; no-ops if an admin already exists
python scripts/backfill_user_pii_encryption.py [--dry-run]   # one-time — DKMS-encrypts any pre-existing plaintext User rows (see DKMS section below)
```

Backend tests require a **real, reachable SQL Server database** (no SQLite fallback — `uniqueidentifier`/`datetimeoffset` columns don't translate); point `.env` at one first — every DB-dependent test skips cleanly (not a failure) if none is reachable, and each test runs inside a rolled-back transaction/savepoint (see `tests/conftest.py`'s `db_session` fixture) so the suite never leaves rows behind. A handful of tests additionally require DKMS to be reachable (`DKMS_BASE_URL`/`DKMS_TASK_ID`) and skip cleanly otherwise. Configuration is env-var driven — see `backend-py/.env.example`; `backend-py/README.md` has the fuller setup walkthrough.

Full deployment instructions (Docker, env vars, the `VITE_API_BASE_URL`-is-build-time gotcha, cookie/CORS domain topology) live in `DEPLOYMENT.md`.

## What this app is

A full-stack project living in one repo: two npm workspaces (the frontend at the repo root, plus `packages/shared`) and a standalone Python backend service (`backend-py/`) that isn't an npm workspace at all.

1. **Frontend** (repo root `src/`) — a React SPA: real user accounts (`admin`/`standard`/`superadmin` roles, standard optionally subsidiary-scoped) behind `/login`, a form builder (Form Initiator campaigns + ad-hoc forms + subsidiary contributions), an AI assistant chat panel, Question Master export, Playwright-driven QA runs, and admin configuration pages (project codes, subsidiaries, subsidiary-project blocks, subsidiary locales, user management, SMTP/FabriX/Groq/deployment settings).
   - **The Excel-upload feature (a server-backed upload → generate → submit flow, and a separate fully client-side `/local` wizard) has been removed** — forms are now only created via the builder, not derived from an uploaded workbook.
2. **`packages/shared`** (`@formbuilder/shared`) — the DOM-free `FormDefinition` data model, schema-authored validation, contribution-merging, and codegen pipeline. The frontend consumes it directly (`npm`-linked workspace, builder preview); `backend-py/app/form_pipeline/` is a separate, hand-ported Python re-implementation of the same pipeline (not a binding onto this TS package) — see the Codegen section below for why, and keep both in sync when the shape or generated-form behavior changes.
3. **Backend** (`backend-py/`) — a FastAPI (Python) API service, backed by the same SQL Server database via SQLAlchemy: JWT auth with roles and optional subsidiary scoping, DKMS-based PII encryption for user email/name, the form-builder/contribution/QA-run/Question-Master/AI-assistant services described in outline below, real outbound email and SFTP deployment, and a security-hardening layer (rate limiting, CSRF, security headers, Pydantic validation).

   A prior Node/Express/TypeORM backend (`backend/`) was fully ported to `backend-py/` and then removed from this repo once parity was verified — if you're looking for TypeORM entities/migrations, Express routers, or `zod` schemas, they no longer exist; every equivalent now lives under `backend-py/app/`.

The frontend and the backend are fully wired together over HTTP (`src/api/apiClient.ts` → `backend-py/app/main.py`'s `/api/v1/*` routes) — this is not two disconnected halves.

The generated output intentionally mirrors a specific Samsung campaign reference implementation (kept locally under `Final_forms_format/` and `packages/shared/src/codegen/js/reference/*.js` for byte-for-byte comparison, not part of the app itself) but strips anything campaign-specific that a generic tool shouldn't hardcode (real API endpoints, analytics IDs, favicon/font URLs — see `BuilderConfig` in `packages/shared/src/codegen/types.ts`).

## The shared package (`packages/shared/`)

`packages/shared/src/index.ts` is the package's public API surface — only symbols re-exported from that file are the stable contract frontend/backend code should import (`@formbuilder/shared`); everything else under `packages/shared/src/` is an internal implementation detail. Built with `tsup` (dual CJS+ESM) plus a separate `tsc -p tsconfig.build.json` pass for declaration files (tsup's own bundled dts step fails against this repo's TypeScript version). Must be built before the frontend or backend can resolve it — every root/backend build script already does this (`npm run build --workspace=packages/shared &&` prefix).

One file stays in `src/codegen/` at the frontend root, not the shared package: `previewDocument.ts` (preview-iframe HTML-inlining glue, used by the form-builder's preview/merge/contribution dialogs).

## Data model shape (`packages/shared/src/form/formDefinition.ts`)

`LocaleCode` is a *combined* `<lang>_<COUNTRY>` string (e.g. `"en_GB"`, `"ar_SA"`) — every per-locale field on `FormDefinition` is `Record<LocaleCode, string>`, resolved via `resolveLocalizedText(map, locale, defaultLocale)`. `questions[]` (`Q<n>`, with `controlType` and `answers[]`), `fields: ProfileFieldSet` (every field optional/presence-driven), `validationMessages`/`pageError`/`thankYou` (per-locale copy), `meta.subsidiary`/`meta.defaultLocale` (drive generated file naming and `<html lang>`).

## Codegen pipeline (`packages/shared/src/codegen/` and its Python port `backend-py/app/form_pipeline/codegen/`)

`generateSolution(form, config)` (`generate.ts`; `generate_solution` in the Python port) is a pure function: `FormDefinition` + `BuilderConfig` in, a flat `GeneratedFile[]` out. On the frontend it's called by preview dialogs; on the backend it's called by `form_builder_service.py` (on publish) and `qa_run_service.py` (QA runs). **These are two independently-maintained implementations of the same pipeline**, not one shared codepath across the frontend/backend boundary (Python can't import a TS package) — a change to generated-form shape or behavior needs to land in both `packages/shared/src/codegen/` and `backend-py/app/form_pipeline/codegen/`, kept in sync by hand. `packages/shared/tests/codegen/generate.test.ts`'s snapshot and `backend-py/tests/form_pipeline/test_generate_snapshot.py` both exist specifically to catch the two drifting apart.

- **Two output variants**, toggleable via `BuilderConfig.variants`: `"ff"` (Full Form) and `"oc"` (One-Click).
- **Reference-script trick**: `buildFfJs.ts`/`buildOcJs.ts` (and their Python counterparts) emit the reference jQuery/Parsley behavior scripts **byte-identical** (from `js/reference/*.js` via a one-off generation script, embedded as plain string constants in both languages). If you need to change generated-form *behavior*, edit the human-readable reference `.js` file and regenerate/re-port — don't hand-edit the generated string in either language.
- `buildDataJs.ts` emits the shared data file; `buildStyleCss.ts` emits the stylesheet (reference CSS + RTL/font overrides); `fileNames.ts` (`resolveFileNames`) is the single source of truth for every generated file name; `domIds.ts` is the shared source of truth for answer/question DOM ids between the HTML builders and the data file. Same structure mirrored under `backend-py/app/form_pipeline/codegen/`.

When changing `FormDefinition` shape, check whether both languages' `buildDataJs`/HTML fragment builders need matching updates — they're a manual projection of the schema, not derived automatically, and the Python port doubly so since it isn't even generated/bound from the TS source.

## Frontend component layout (`src/`)

`App.tsx` wires up `react-router-dom`: `/login` (public), everything else behind `<ProtectedRoute>` (`src/auth/ProtectedRoute.tsx`, redirects to `/login` if unauthenticated) → `<AppLayout>` (`src/app/AppLayout.tsx`, a collapsible left sidebar — not a top nav bar — with role-gated nav items and account/logout, collapsed state persisted to `localStorage`). Routes now cover the form builder, Question Master, and admin configuration/user-management pages — check `App.tsx` directly for the current list rather than trusting this doc, which predates most of them. `AppLayout.tsx`'s nav items are gated by `isAdminRole(user?.role)` (true for both `"admin"` and `"superadmin"`), same helper the backend uses.

- `src/api/apiClient.ts` — the one fetch wrapper every API call goes through: attaches the in-memory access token (`Authorization: Bearer`, never persisted — see below) and the CSRF cookie value (`X-CSRF-Token`), sends `credentials: "include"` for the httpOnly refresh cookie, and on a `401` transparently does exactly one silent refresh-and-retry (coalescing concurrent refreshes into one in-flight request, since the backend's refresh token is single-use/rotated). `src/api/adminApi.ts`/`src/api/projectCodesApi.ts`/`src/api/subsidiariesApi.ts`/`src/api/qaApi.ts`/`src/api/questionMasterApi.ts` are typed wrappers around the actual endpoints, mirroring (duplicating, deliberately — no shared-types package across the frontend/backend boundary) the backend's response shapes.
- `src/auth/authStore.ts` — Zustand auth state (`user`, `status`, `login`/`logout`/`silentRefresh`). `AuthUser` carries `subsidiaryId` (null for admins and non-scoped standard users) alongside id/username/role. The access token itself lives only in `apiClient.ts`'s module-level variable (never in the Zustand store or any storage) — `silentRefresh()` (called once on app mount, see `App.tsx`) re-establishes a session purely from the httpOnly refresh cookie after a reload, decoding the returned JWT's payload client-side (display-only trust; the backend independently verifies the signature on every request regardless) to recover `user` since `POST /auth/refresh` returns only `{ accessToken }`.
- `src/components/admin/` — `ProjectCodeManager.tsx` (create/rename project codes, toggle open/closed, edit the descriptive campaign date range), `SubsidiaryManager.tsx` (create subsidiaries, toggle active/inactive, delete), and `SubsidiaryProjectBlockManager.tsx` (per-(subsidiary, project code) block list layered on top of both) all live on `ConfigurationPage`. `QaRunDialog.tsx` (opened from the form builder's contribution/ad-hoc review panels) triggers a QA run, polls until it leaves `"pending"/"running"`, and shows per-check pass/fail results plus a link to download the standalone HTML report.
- `src/components/formBuilder/` — the form builder itself (editor, preview/merge dialogs, review panels); not detailed here — read the directory directly.

## Backend service (`backend-py/`)

FastAPI app (`app/main.py`), mounted middleware order (Starlette applies middleware in reverse of registration order, so this is registered innermost-first): CORS (`FRONTEND_URL` env var, `credentials: true`) → `SlowAPIMiddleware` (rate limiting) → `SecurityHeadersMiddleware` (helmet-equivalent, including a deliberate `Cross-Origin-Resource-Policy: cross-origin` override — the default `same-origin` would make browsers block the frontend, a different origin, from reading *any* response including plain JSON), so the security headers end up outermost. FastAPI/Pydantic handle JSON body parsing and cookie parsing per-request internally — no separate middleware needed for either. Backed by SQL Server via SQLAlchemy (`app/db.py`); there is no migration framework actually wired up (`alembic` is a listed dependency but has no `alembic.ini`/versions directory) — the schema is applied via a canonical `init.sql`-style raw-SQL script plus `Base.metadata.create_all(checkfirst=True)` (only creates missing tables, never alters existing ones), so a genuine schema change still needs a hand-written, idempotent SQL script (see `scripts/dkms_migration.sql` for the pattern) run manually against the target database — a real operational gap worth setting up Alembic for properly if/when schema changes become frequent.

### Models (`app/models/`)

`User` (username/**email** — DKMS ciphertext at rest, see the DKMS section below/**emailHash** — a deterministic hash of the normalized email, used for lookup/dedup instead of comparing plaintext/passwordHash/**role** `"admin"|"standard"|"superadmin"`/**subsidiaryId** — null for admins/superadmins and non-scoped standard users, non-null scopes a standard user to one subsidiary/isActive; `is_admin_role(role)` in `app/models/user.py` is true for both `"admin"` and `"superadmin"`, used everywhere admin access is checked — the two only diverge for provisioning other admin accounts, see Auth below), `RefreshToken` (hashed token only — the raw value is never stored — /userId/expiresAt/revokedAt), `GeneratedFile` (one row per output file, owned by a `FormVersion`), `ProjectCode` (code/isOpen/isLocked/**startDate**/**endDate**/**cutoffDate**/createdAt — the admin-managed picklist behind form-builder campaign creation), `Subsidiary` (name/isActive/createdAt — the admin-managed picklist; a text snapshot, not a foreign key — see `subsidiary_service.py`), `SubsidiaryProjectBlock` (subsidiaryName/projectCode, unique pair — row presence *is* the block), `QaRun` (formId/contributionId — one of the two identifies the QA subject — variant `"ff"|"oc"`/status `"pending"|"running"|"passed"|"failed"|"error"`/triggeredByUserId/totalTests/passedTests/failedTests/errorMessage/reportPath/timestamps — one Playwright QA automation run against a generated form; see `qa_run_service.py`), `QaTestCaseResult` (qaRunId/category/name/status/fieldId/message — one assertion within a `QaRun`), `EmailLog`, `AdminSetting` (key/value — SMTP/FabriX/Groq/SFTP settings, encrypted secrets via `app/security/secret_cipher.py`). `Form`/`FormVersion`/`FormContribution`/`QuestionMasterVersion` (form builder) and `AIConversation`/`AIConversationMessage`/`AIAction`/`FabrixModel` (AI assistant) round out the schema — read `app/models/` directly for full field lists.

### DKMS-based PII encryption (`app/security/dkms_client.py`)

`User.email`/`firstName`/`lastName` are encrypted at rest via an external DKMS HTTP service (three endpoints — encrypt/decrypt/hash — `DKMS_BASE_URL`/`DKMS_TASK_ID` env vars), not stored as plaintext. `auth_service.create_user`/`update_user` encrypt on write and compute `User.emailHash` (a separate deterministic hash, also from DKMS) for lookup/dedup/uniqueness checks — plaintext email is never compared or logged. Decryption only happens where a real value must be shown or sent somewhere (serializing a user for the admin UI, resolving email-notification recipients, embedding a display name in a JWT) via `dkms_client.decrypt_or_none`, which fails open (returns `None`, never raises) so a DKMS outage degrades display/notifications rather than breaking auth. Every DKMS call is fail-closed on write paths (`DkmsUnavailableError` → the write itself fails) and fail-open on read paths. `scripts/backfill_user_pii_encryption.py` is the one-time migration for `User` rows created before this feature shipped.

### Auth (`app/services/auth_service.py`, `app/security/deps.py`, `app/middleware/`)

Short-lived (15 min) stateless JWT access tokens (`Authorization: Bearer`, verified by signature/expiry only, payload `{ sub, username, role, subsidiaryId }`) plus a database-backed, single-use refresh token (7 days, httpOnly cookie scoped `Path=/api/v1/auth`, rotated on every use — old token revoked, new one issued). `require_auth`/`require_admin`/`optional_auth` gate routes; `require_admin` checks `is_admin_role(auth["role"])` (`"admin"` or `"superadmin"`).

CSRF: a hand-rolled double-submit cookie (`app/middleware/csrf.py` — not a third-party package) — a random token is set as a **`Path=/`, non-httpOnly** cookie (must be `document.cookie`-readable from the frontend's own pages, unlike the refresh cookie) on login/refresh; applied to `/auth/refresh` and `/auth/logout` (the two cookie-authenticated, state-changing endpoints), it checks the `X-CSRF-Token` header matches. Bearer-header endpoints don't need this (a cross-site page can't read/replay a header it never had).

There is no self-service signup — `POST /api/v1/admin/users` (admin-or-superadmin, optionally takes `subsidiaryId`, required when `role: "standard"`) is the only way to create an account, plus the one-time `scripts/seed_admin.py` for the very first admin. A plain `"admin"` may only provision/enable/disable `"standard"` accounts; only a `"superadmin"` may provision or toggle another `"admin"`/`"superadmin"` account (checked inline in `app/routers/admin.py`, since `require_admin` alone isn't fine-grained enough) — and nobody may disable their own account. `DELETE /api/v1/admin/users/{id}` follows the same authorization split, but is refused (409, with a clear message) for a user who has created forms or otherwise has historical records — such users can only be deactivated, never deleted.

### AI assistant providers (`app/services/aiProviderService.py`, `fabrixAIService.py`, `groqAIService.py`)

Two independently enable/disable-toggleable tiers, each admin-configured (`app/services/fabrix_settings_service.py`/`groq_settings_service.py`): **FabriX** (an internal OpenAPI chat endpoint) always gets first priority when both are enabled; **Groq** (OpenAI-compatible chat completions) is the fallback. There is no third "Claude/Anthropic" tier — an earlier version of this port had one, but it was never actually configured with real credentials and has been removed. Every outbound-error string from either provider is sanitized to a generic customer-facing message before it ever reaches the AI assistant chat UI (`aiAssistantService.GENERIC_AI_FAILURE_MESSAGE`) — raw provider errors are logged server-side only.

### QA runs (`app/services/qa_run_service.py`, `app/services/qa/`)

A real headless-Chromium Playwright automation run against one generated variant (`"ff"`/`"oc"`) of a pending subsidiary contribution or an ad-hoc form awaiting review — `app/services/qa/qa_introspection.py` (the DOM-driven checks: structure, field validation, field interaction, required-field enforcement, submit-button gating, submit flow) and `qa_test_runner.py` (serves the self-contained generated HTML on an ephemeral local port, drives three page loads through Playwright's async API, wrapped in an overall timeout) are a close port of the equivalent checks that used to live in the Node backend. Kicked off fire-and-forget from `POST /api/v1/admin/qa-runs` via `app/utils/background.run_in_background` (a daemon thread with its own DB session — deliberately never blocks the triggering request, and deliberately never shares the caller's request-scoped session, since that's closed as soon as the request finishes and isn't thread-safe); the frontend polls `GET /qa-runs/:id` until status leaves `"pending"/"running"`. No job queue behind this — a server restart mid-run leaves that one `QaRun` stuck at "running" forever (rare, always resolvable by re-running QA).

### Outbound email and SFTP deployment (`app/services/email_service.py`, `app/services/sftp_service.py`)

Real SMTP sends (stdlib `smtplib`, DB-configured settings with an env-var fallback — see `smtp_settings_service.py`) for every admin/subsidiary notification (ad-hoc form submitted for review, a translation/extension contribution submitted, a project code locked, the daily cutoff-reminder digest — see `app/services/cutoff_reminder_service.py`, started from `app/main.py`'s FastAPI startup event and running on an hourly-checked, once-per-day background thread). Every notification send is dispatched via `run_in_background` (same fire-and-forget, own-session pattern as QA runs) so a slow/unreachable mail server never blocks the request that triggered it. `sftp_service.deploy_generated_files` (real `paramiko`-based push, bounded by an explicit connect timeout matching the Node original's `readyTimeout`) runs synchronously as part of `form_builder_service.publish_form` instead, since its result (`{ok, filesDeployed, error}`) is returned inline as part of the publish response for the admin UI to show immediately — a deployment failure is best-effort and never fails the publish itself.

### Excel-upload feature: removed

The server-backed Excel upload → generate → submit lifecycle that existed in the original Node backend was never ported here — forms are only created via the form builder. `GeneratedFile.uploadId` and `QaRun.uploadId` remain as unused nullable columns in the DB schema — every code path uses `formVersionId`/`formId`/`contributionId` instead.

### Security middleware (`app/middleware/rate_limit.py`, `app/middleware/csrf.py`, Pydantic request models)

A global rate limiter (generous) plus a tight one on `/login` and `/refresh` (the credential-stuffing/brute-force surface), both via `slowapi`. Request bodies are validated declaratively through Pydantic models on every route that accepts one (FastAPI's own mechanism), replacing the Node backend's hand-rolled `zod` schemas one-for-one.
