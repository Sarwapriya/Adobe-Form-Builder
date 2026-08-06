# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Frontend (repo root):

```
npm run dev                      # start Vite dev server
npm run build                    # builds packages/shared, then tsc -b (project references), then vite build
npm run lint                     # oxlint
npm run test                     # vitest run (single run) — scoped to tests/, excludes packages/** and backend/**
npm run test:watch               # vitest watch mode
npm run preview                  # preview a production build
npm run generate-sample-solution # builds packages/shared, then runs the Excel->Solution pipeline against every workbook in Documents/, output to dist-sample-solution/
npm run dev:shared                # tsup --watch on packages/shared — run alongside `npm run dev` in a second terminal when iterating on excel/form/codegen code
npm run test:shared               # vitest run scoped to packages/shared/tests
```

Run a single frontend test file: `npx vitest run <path>` (or `npx vitest <path>` to watch just that file).

Frontend tests live in `tests/` (not `src/`) and cover only frontend-specific code (currently `tests/codegen/previewDocument.test.ts`, the preview-iframe glue). Vitest is configured in `vite.config.ts` (jsdom environment, `globals: false` — import `describe`/`it`/`expect` explicitly from `vitest`; `exclude` deliberately keeps this run from also picking up `packages/shared/tests` or `backend/tests`, each of which has its own vitest config/environment).

The Excel parsing/mapping/validation and codegen pipeline itself lives in `packages/shared/` (see below) with its own test suite under `packages/shared/tests/` (`excel/` covers parser/mapper/validator/locale-detection, `codegen/` snapshot- and unit-tests the generated output — `generate.test.ts`'s snapshot lives in `packages/shared/tests/codegen/__snapshots__/`), run via `npm run test:shared`.

TypeScript is split via project references: `tsconfig.app.json` (src, browser) and `tsconfig.node.json` (Vite config). `npm run build` type-checks both after building `packages/shared` (whose declaration files the frontend's `tsc -b` pass needs to resolve `@formbuilder/shared`'s types).

Backend (`backend/`, an npm workspace declared in the root `package.json`):

```
npm run dev:backend      # ts-node-dev src/index.ts (from repo root)
npm run build:backend    # builds packages/shared, then tsc -p backend/tsconfig.json
npm run start:backend    # node backend/dist/index.js
```

Or from inside `backend/`: `npm run dev`, `npm run build`, `npm run start`, `npm run test` (vitest, its own `vitest.config.ts`), `npm run typeorm -- <args>` (TypeORM CLI against `src/config/data-source.ts`, e.g. `npm run typeorm -- migration:run`), `npm run seed:admin` (one-time — creates the first admin `User` row from `ADMIN_USER`/`ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` env vars; no-ops if an admin already exists). Backend tests live in `backend/tests/`. Configuration is env-var driven — see `backend/.env.example`.

Full deployment instructions (Docker, env vars, the `VITE_API_BASE_URL`-is-build-time gotcha, cookie/CORS domain topology) live in `DEPLOYMENT.md`.

## What this app is

A full-stack project living in one repo, structured as three npm workspaces plus the frontend at the repo root:

1. **Frontend** (repo root `src/`) — a React SPA with two independent surfaces sharing one codebase:
   - An **authenticated area** (`/`, `/login`, `/admin`, `/admin/history`) — real user accounts (Admin/Standard roles, optionally subsidiary-scoped), server-backed Excel upload with a client-side "configure mandatory questions" preview step before generation, submission tracking, personal upload history, and an admin dashboard (submitted uploads only) plus a separate full-history page (every generated/submitted/failed upload, with status summary tiles).
   - **`/local`** — the original no-login, fully client-side wizard (Upload → Preview → Configure → Generate) that generates a downloadable zip entirely in the browser, no server involved. Kept deliberately alongside the authenticated flow as a quick/offline generator with full `BuilderConfig` control (variants, favicon, tracking params) that the server-backed flow doesn't expose.
2. **`packages/shared`** (`@formbuilder/shared`) — the DOM-free Excel-parsing/mapping/validation and codegen pipeline, built once and consumed identically by the frontend (both `/local` and the authenticated area's client-side preview step) and the backend (server-side generation on upload).
3. **Backend** (`backend/`) — an Express + TypeORM (SQL Server/`mssql`) API service: JWT auth with roles and optional subsidiary scoping, server-side upload → generate → submit lifecycle with submission-time-only versioning and admin-managed project codes, an admin API (search/filter/paginate uploads, zip downloads, user provisioning), and a security-hardening layer (rate limiting, CSRF, helmet, zod validation, upload content-sniffing).

The frontend's authenticated area and the backend are fully wired together over HTTP (`src/api/apiClient.ts` → `backend/src/app.ts`'s `/api/v1/*` routes) — this is not two disconnected halves.

The generated output (both `/local` and the server-backed flow use the exact same `generateSolution()`) intentionally mirrors a specific Samsung campaign reference implementation (kept locally under `Final_forms_format/` and `packages/shared/src/codegen/js/reference/*.js` for byte-for-byte comparison, not part of the app itself) but strips anything campaign-specific that a generic tool shouldn't hardcode (real API endpoints, analytics IDs, favicon/font URLs — see `BuilderConfig` in `packages/shared/src/codegen/types.ts`).

## Frontend core data flow (the Excel→Solution pipeline)

Everything revolves around one serializable model, `FormDefinition` (`packages/shared/src/form/formDefinition.ts`), validated at the boundary by a parallel Zod schema (`formDefinitionZod.ts`) — the two are hand-kept in sync (no `z.infer` codegen), so a change to one field shape needs matching edits in both files. A `FormDefinition` is never authored directly by a user — it's always *derived* from an uploaded workbook, either client-side (`/local`) or server-side (`POST /api/v1/uploads`).

- `src/store/builderStore.ts` — the Zustand store driving the `/local` wizard (`WizardStep = "upload" | "preview" | "configure" | "generate"`). `loadWorkbook(file)` runs the whole Excel pipeline (parse → map → validate) and advances to `"preview"`; `config` holds the in-progress `BuilderConfig`; `previewLocale` is which locale the preview iframe currently renders.
- `excel/parser.ts` (`parseWorkbook`) — pure byte-level parsing via `xlsx`. Locates the "Complete Translations" sheet (exact or fuzzy name match), fuzzy-matches header text to find the key/English/translation-C/translation-D columns, and extracts the Subsidiary/Language_Country/Country/**Project Code** metadata rows (`WorkbookMeta`). Knows nothing about what a row *means* semantically — that's `mapper.ts`. The Subsidiary and Project Code values specifically also get cross-checked server-side against the upload form's own Subsidiary field / Project Code dropdown selection (see `uploadService.createUpload` below) — a workbook whose own metadata row doesn't match what the uploader selected is rejected outright.
- `excel/mapper.ts` (`mapWorkbook`) — walks the parsed rows and builds a `FormDefinition`. Column A's row key drives interpretation: `Q<n>`/`A<n>` regexes build up questions/answers, a `FLAT_FIELD_SETTERS` lookup table maps known flat keys onto `ProfileFieldSet`, section markers switch which bucket subsequent rows land in, and any unrecognized non-blank key is preserved into `extraFieldsByLocale` with a warning rather than silently dropped.
- `excel/validator.ts` (`validateWorkbook`) — combines parser/mapper issues with whole-workbook checks (no usable questions, missing submit button, formula-like cell content as a CSV/Excel-injection smell, single-line English text next to a suspiciously multi-line translation) and partitions everything into blocking `errors` vs. non-blocking `warnings`. **The backend promotes the formula-like-content warning specifically to a blocking condition for server uploads** (see `uploadService.ts`'s `hasFormulaLikeWarning` below) — the client wizard keeps it as a warning, since a human reviews the preview there before generating.
- `excel/localeDetection.ts` (`resolveLocales`) — resolves the workbook's two translation columns (C/D) against their "Language_Country" metadata into `<lang>_<COUNTRY>` `LocaleCode`s. A column with real content but unparseable metadata is surfaced as `unresolved` (a blocking validation error) rather than guessed.

## The shared package (`packages/shared/`)

`packages/shared/src/index.ts` is the package's public API surface — only symbols re-exported from that file are the stable contract frontend/backend code should import (`@formbuilder/shared`); everything else under `packages/shared/src/` is an internal implementation detail. Built with `tsup` (dual CJS+ESM) plus a separate `tsc -p tsconfig.build.json` pass for declaration files (tsup's own bundled dts step fails against this repo's TypeScript version). Must be built before the frontend or backend can resolve it — every root/backend build script already does this (`npm run build --workspace=packages/shared &&` prefix).

Two files stay in `src/codegen/` at the frontend root, not the shared package: `zipAndDownload.ts` (browser-only Blob/DOM download) and `previewDocument.ts` (preview-iframe HTML-inlining glue).

## Data model shape (`packages/shared/src/form/formDefinition.ts`)

`LocaleCode` is a *combined* `<lang>_<COUNTRY>` string (e.g. `"en_GB"`, `"ar_SA"`) — every per-locale field on `FormDefinition` is `Record<LocaleCode, string>`, resolved via `resolveLocalizedText(map, locale, defaultLocale)`. `questions[]` (`Q<n>`, with `controlType` and `answers[]`), `fields: ProfileFieldSet` (every field optional/presence-driven), `validationMessages`/`pageError`/`thankYou` (per-locale copy), `meta.subsidiary`/`meta.defaultLocale` (drive generated file naming and `<html lang>`).

## Codegen pipeline (`packages/shared/src/codegen/`)

`generateSolution(form, config)` (`generate.ts`) is a pure function: `FormDefinition` + `BuilderConfig` in, a flat `GeneratedFile[]` out. Both consumers call this exact function — `/local`'s `GenerateStep`/`PreviewStep` (client-side) and the backend's `generationService.ts` (server-side, on upload) — so there is exactly one code path that can ever diverge from what's downloaded/reviewed.

- **Two output variants**, toggleable via `BuilderConfig.variants`: `"ff"` (Full Form) and `"oc"` (One-Click). The backend's server-side flow always requests both (`generationService.generateFromWorkbook` hardcodes `variants: ["ff", "oc"]` — there's no variants/favicon/tracking-param configuration UI server-side, unlike `/local`'s `ConfigureStep`). The one server-side configuration knob is mandatory-question overrides: `generateFromWorkbook(buffer, sourceFileName, requiredOverrides?)` flips `QuestionDefinition.required` per question id before validating/generating — see the auth area's upload flow below.
- **Reference-script trick**: `buildFfJs.ts`/`buildOcJs.ts` emit the reference jQuery/Parsley behavior scripts **byte-identical** (from `js/reference/*.js` via a one-off generation script, as plain TS string constants). If you need to change generated-form *behavior*, edit the human-readable reference `.js` file and regenerate — don't hand-edit the generated string.
- `buildDataJs.ts` emits the shared data file; `buildStyleCss.ts` emits the stylesheet (reference CSS + RTL/font overrides); `fileNames.ts` (`resolveFileNames`) is the single source of truth for every generated file name; `domIds.ts` is the shared source of truth for answer/question DOM ids between the HTML builders and the data file.

When changing `FormDefinition` shape, check whether `buildDataJs.ts` and the HTML fragment builders need matching updates — they're a manual projection of the schema, not derived automatically.

## Frontend component layout (`src/`)

`App.tsx` wires up `react-router-dom`: `/login` (public), `/local` (public — the original wizard, `AppShell`), and everything else behind `<ProtectedRoute>` (`src/auth/ProtectedRoute.tsx`, redirects to `/login` if unauthenticated) → `<AppLayout>` (`src/app/AppLayout.tsx`, a collapsible left sidebar — not a top nav bar — with role-gated nav items and account/logout, collapsed state persisted to `localStorage`) → the index route (`src/pages/UploadHistoryPage.tsx`) or, nested under `<AdminRoute>` (`src/auth/AdminRoute.tsx`, redirects non-admins to `/`), `/admin` (`src/pages/AdminDashboardPage.tsx`, submitted uploads only) and `/admin/history` (`src/pages/AdminHistoryPage.tsx`, every generated/submitted/failed upload plus status summary tiles).

- `src/api/apiClient.ts` — the one fetch wrapper every API call goes through: attaches the in-memory access token (`Authorization: Bearer`, never persisted — see below) and the CSRF cookie value (`X-CSRF-Token`), sends `credentials: "include"` for the httpOnly refresh cookie, and on a `401` transparently does exactly one silent refresh-and-retry (coalescing concurrent refreshes into one in-flight request, since the backend's refresh token is single-use/rotated). `src/api/uploadsApi.ts`/`src/api/adminApi.ts`/`src/api/projectCodesApi.ts` are typed wrappers around the actual endpoints, mirroring (duplicating, deliberately — no shared-types package across the frontend/backend boundary) the backend's response shapes.
- `src/auth/authStore.ts` — Zustand auth state (`user`, `status`, `login`/`logout`/`silentRefresh`). `AuthUser` carries `subsidiaryId` (null for admins and non-scoped standard users) alongside id/username/role. The access token itself lives only in `apiClient.ts`'s module-level variable (never in the Zustand store or any storage) — `silentRefresh()` (called once on app mount, see `App.tsx`) re-establishes a session purely from the httpOnly refresh cookie after a reload, decoding the returned JWT's payload client-side (display-only trust; the backend independently verifies the signature on every request regardless) to recover `user` since `POST /auth/refresh` returns only `{ accessToken }`.
- `src/components/` (the `/local` wizard, unchanged from before auth existed): `AppShell` → `upload/UploadStep.tsx` → `preview/PreviewStep.tsx` + `ValidationPanel.tsx` → `configure/ConfigureStep.tsx` → `generate/GenerateStep.tsx`.
- `src/components/upload/UploadConfigurePanel.tsx` — the authenticated upload flow's own configure step (distinct from `/local`'s wizard): once a file is picked, it runs `parseWorkbook`→`mapWorkbook`→`validateWorkbook` from `@formbuilder/shared` entirely client-side (a preview only — the server independently re-parses and re-validates on submit, never trusting this) to show a live Subsidiary/Project-Code match check against the workbook's own metadata rows and a per-question "required" toggle list. The "Confirm & Upload" button is disabled outright (not just re-checked on click) whenever either match check fails or a blocking validation error exists, computed once per render so the button and the banners can never disagree. Confirming calls `uploadsApi.uploadWorkbook(subsidiaryId, projectCode, file, requiredOverrides)` — one request that both uploads and generates.
- `src/components/admin/ProjectCodeManager.tsx` — inline panel on `AdminDashboardPage` for creating project codes and toggling them open/closed (closing one blocks new uploads against it, enforced server-side).

Two field families render differently in the generated output and in `ConfigureStep`: `group: "profile"` (plain label+input) vs `group: "question"` (numbered `Q<n>` module) — this is a `packages/shared` concept, not frontend-specific.

## Backend service (`backend/`)

Express app (`src/app.ts`), mounted middleware order: `helmet()` (with `crossOriginResourcePolicy: "cross-origin"` — the default `"same-origin"` would make browsers block the frontend, a different origin, from reading *any* response including plain JSON) → `express.json()` → `cookie-parser` → CORS (`FRONTEND_URL` env var, `credentials: true`) → a global rate limiter. Backed by SQL Server via TypeORM (`src/config/data-source.ts`, migrations in `src/migrations/`, applied in filename-timestamp order — `InitSchema` → `AddUsersAndVersioning` → `SubmittedOnlyVersioning` → `AddProjectCodes` → `AddQuestionOverrides` → `AddUserSubsidiary`; `backend/sql/init.sql` is the canonical full schema for a fresh database, manually kept in sync with the migrations).

### Entities

`User` (username/email/passwordHash/role `"admin"|"standard"`/**subsidiaryId** — null for admins and non-scoped standard users, non-null scopes a standard user to one subsidiary/isActive), `RefreshToken` (hashed token only — the raw value is never stored — /userId/expiresAt/revokedAt), `Upload` (subsidiaryId/**projectCode**/fileName/filePath/uploadDate/**userId**/**version** (nullable — see versioning below)/**generatedPath**/**status** `"uploaded"|"generated"|"submitted"|"failed"`/**submittedAt**/**isDeleted**/**questionOverrides** (nullable JSON `Record<questionId, boolean>`)), `GeneratedFile` (one row per output file — uploadId/fileName/filePath/fileType), `ProjectCode` (code/isOpen/createdAt — the admin-managed picklist behind the upload form's dropdown), `EmailLog` (uploadId/recipient/status/errorMessage/sentAt — records every submission-notification attempt), `AdminSetting` (key/value — e.g. `lockGeneratedFilesOnSubmit`, `notificationEmail`).

### Auth (`services/authService.ts`, `middleware/authJwt.ts`, `middleware/csrf.ts`)

Short-lived (15 min) stateless JWT access tokens (`Authorization: Bearer`, verified by signature/expiry only, payload `{ sub, username, role, subsidiaryId }` — see `AccessTokenPayload`) plus a database-backed, single-use refresh token (7 days, httpOnly cookie scoped `Path=/api/v1/auth`, rotated on every use — old token revoked, new one issued — so `rotateRefreshToken` doubles as the "session revocation" mechanism logout/refresh need against an otherwise-stateless JWT scheme). `requireAuth`/`requireAdmin`/`optionalAuth` (express-jwt-based) gate routes; `requireAdmin` checks `req.auth.role === "admin"`.

CSRF: a hand-rolled double-submit cookie (`middleware/csrf.ts`, not a third-party package) — `issueCsrfCookie` sets a random token as a **`Path=/`, non-httpOnly** cookie (must be `document.cookie`-readable from the frontend's own pages, unlike the refresh cookie) on login/refresh; `requireCsrfToken` (applied to `/auth/refresh` and `/auth/logout` — the two cookie-authenticated, state-changing endpoints) checks the `X-CSRF-Token` header matches. Bearer-header endpoints don't need this (a cross-site page can't read/replay a header it never had).

There is no self-service signup — `POST /api/v1/admin/users` (admin-only, optionally takes `subsidiaryId`) is the only way to create an account, plus the one-time `backend/scripts/seedAdmin.ts` for the very first admin. `POST /auth/login` also runs `uploadCleanupService.cleanupUnsubmittedUploads(user.id)` before responding — see below.

### Upload → generate → submit lifecycle (`services/uploadService.ts`, `generationService.ts`, `submissionService.ts`, `fileService.ts`, `projectCodeService.ts`)

**Storage is keyed by the upload's own id, not its version** — `saveSourceFile`/`saveGeneratedFiles` write to `{UPLOAD_DIR}/{subsidiaryId}/{uploadId}/...`, with the id generated client-side (`crypto.randomUUID()`) before any DB row exists, so the final path never depends on a value only known after persistence.

`POST /api/v1/uploads` (multipart, memory-storage Multer — full buffer needed up front for the signature check below): `uploadService.createUpload`:
1. `assertProjectCodeOpenForUpload` — the selected `ProjectCode` must exist and be `isOpen` (admin-managed via `POST/PATCH /admin/project-codes`), or the request is rejected before anything else runs.
2. `fileService.hasExcelFileSignature` sniffs the uploaded bytes' magic number (`.xlsx` is a ZIP archive, `.xls` is an OLE2 Compound File — extension/MIME alone are attacker-controlled and checked separately, earlier, in Multer's `fileFilter`).
3. `generationService.generateFromWorkbook(buffer, fileName, requiredOverrides)` runs once, up front, before any persistence — it applies `requiredOverrides` (questionId → required, from the client's configure step) to `FormDefinition.questions`, then returns `projectCodeFromWorkbook`/`subsidiaryFromWorkbook` (the workbook's own metadata rows) alongside the usual `form`/`validation`/`files`.
4. `assertProjectCodeMatchesWorkbook` / `assertSubsidiaryMatchesWorkbook` reject the whole request (no `Upload` row created at all) if the workbook's own metadata doesn't match what was selected — same treatment as an unsupported file type, not a "failed" record.
5. Only now is the `Upload` row persisted (`status: "uploaded"`, `version: null`, `questionOverrides` JSON if any overrides were given), then `persistGenerationOutcome` saves the already-computed generation result: `"generated"` + `GeneratedFiles` rows, or `"failed"` (blocking validation errors, **or** a formula-like-content warning promoted to blocking specifically for server uploads — see `hasFormulaLikeWarning`, string-matched against `validateWorkbook`'s exact warning text, documented as a fragile coupling to watch).

**A subsidiary-scoped user's `subsidiaryId` is never taken from the request body** — `upload.router.ts` overrides it server-side with `req.auth.subsidiaryId` for any non-admin user who has one, regardless of what the client sent (the frontend also auto-fills/locks the field for them, but the server doesn't trust that alone).

**Versioning is submission-time-only**: `Upload.version` is `null` until `POST /api/v1/submit/:uploadId` (`submissionService.submitUpload`) assigns the next number inside a locked transaction (`SELECT ISNULL(MAX(version),0)+1 ... WITH (UPDLOCK, HOLDLOCK) WHERE subsidiaryId = @0 AND status = 'submitted'`) — an upload that's merely generated, or that fails, never consumes a version number. Enforced unique per subsidiary by a **filtered** database index (`WHERE version IS NOT NULL`, not a table `CONSTRAINT`, which SQL Server would only allow one `NULL` for).

`findOwnedUpload(uploadId, userId, isAdmin)` is the one ownership-check helper reused everywhere (`getUploadDetail`, `softDeleteUpload`, `regenerateUpload`, `submissionService.submitUpload`) — admins bypass it, standard users must own the row; returns `null` identically for "doesn't exist" and "exists but isn't yours" so nothing leaks which case occurred. `POST /api/v1/generate/:uploadId` re-runs generation from the stored source file, re-applying the row's stored `questionOverrides` (so a regenerate doesn't silently reset every question back to required); blocked once `status === "submitted"` *if* the `lockGeneratedFilesOnSubmit` `AdminSetting` is enabled (default). `POST /api/v1/submit/:uploadId` requires `status === "generated"`, assigns the version (above), sets `"submitted"` + `submittedAt`, and fires `emailService.sendSubmissionNotification` (subject `"New Web Form Submission"`, all 6 required fields, records every attempt — sent/failed/skipped — to `EmailLogs`).

`uploadCleanupService.cleanupUnsubmittedUploads(userId)`, run on every login, hard-deletes (DB rows *and* on-disk files) any of that user's uploads still sitting at `"uploaded"`/`"generated"` — a workbook uploaded but never submitted isn't worth tracking. `"failed"` uploads are untouched and persist indefinitely, same as `"submitted"` ones.

### Admin dashboard API (`services/adminUploadService.ts`, `services/zipService.ts`, `services/previewService.ts`)

Two listings share one filtered/sorted/paginated query builder (`listUploadsWithStatuses` in `adminUploadService.ts`, a left join to `Users` for the display name; `sortBy` is always resolved through a hardcoded column-name lookup table, never interpolated from raw input) but different status allowlists: `listUploadsForAdmin` (submitted only — the main dashboard) and `listUploadHistoryForAdmin` (generated + submitted + failed — the "All history" page). `getUploadHistorySummary` runs the same filters (minus the status filter itself) grouped by status, for the history page's summary tiles. Both also accept a `projectCode` filter alongside `subsidiaryId`.

`zipService.buildZip` reads a set of already-generated files from disk and zips them in memory (`fflate`, the same library `/local`'s `zipAndDownload.ts` uses) for `GET /admin/download/:uploadId` and `GET /admin/download/subsidiary/:name` (latest **submitted** version by default, `?version=N` for a specific one — a version only ever exists on a submitted upload). `previewService.buildUploadPreview` inlines a generated upload's CSS/JS into its HTML (same technique as `/local`'s live preview) for the admin "View" button, serving `GET /admin/preview/:uploadId?variant=ff|oc`.

### Route map

`/api/v1/auth`: `POST /login` (rate-limited, zod-validated), `POST /refresh` (rate-limited, CSRF-checked), `POST /logout` (auth-required, CSRF-checked). `/api/v1/uploads`: `POST /` (zod-validated `subsidiaryId`/`projectCode`, optional `requiredOverrides` JSON string), `GET /` (own history only), `GET /:id`, `DELETE /:id` (soft delete, blocked once submitted). `/api/v1/generate/:uploadId`. `/api/v1/submit/:uploadId`. `/api/v1/project-codes` (`requireAuth` only — any authenticated user, `GET /` returns open codes only, for the upload dropdown). `/api/v1/admin` (all `requireAdmin`): `GET /uploads` (submitted-only), `GET /history` (generated+submitted+failed), `GET /history/summary`, `GET /subsidiary/:name`, `GET|POST /project-codes` + `PATCH /project-codes/:id` (admin management — sees closed codes too), `GET /download/:uploadId`, `GET /download/subsidiary/:name`, `GET /preview/:uploadId`, `GET /diff` (existing two-workbook row-diff, `services/diffService.ts` — unrelated to the above, pre-dates it), `POST /users` (zod-validated, optional `subsidiaryId`). `/api/v1/download/:fileId` (`optionalAuth`, pre-dates the auth system — kept as-is).

### Security middleware (`middleware/rateLimit.ts`, `middleware/validate.ts`, `middleware/csrf.ts`)

`generalRateLimiter` (global, generous) + `authRateLimiter` (tight, only on `/login` and `/refresh` — the credential-stuffing/brute-force surface). `validateBody(zodSchema)` — a middleware factory replacing ad-hoc `typeof x !== "string"` checks with declarative Zod schemas, applied to every route that accepts a request body (`/login`, `/admin/users`, `/uploads` POST); query-param parsing keeps its existing hand-written type guards (`isUploadStatus`, `isAdminSortBy`, etc. — already type-safe, not worth converting).
