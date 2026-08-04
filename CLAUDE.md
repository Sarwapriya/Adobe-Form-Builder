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
   - An **authenticated area** (`/`, `/login`, `/admin`) — real user accounts (Admin/Standard roles), server-backed Excel upload with automatic generation, submission tracking, personal upload history, and an admin dashboard with search/filter/sort/pagination and zip downloads.
   - **`/local`** — the original no-login, fully client-side wizard (Upload → Preview → Configure → Generate) that generates a downloadable zip entirely in the browser, no server involved. Kept deliberately alongside the authenticated flow as a quick/offline generator with full `BuilderConfig` control (variants, favicon, tracking params) that the server-backed flow doesn't expose.
2. **`packages/shared`** (`@formbuilder/shared`) — the DOM-free Excel-parsing/mapping/validation and codegen pipeline, built once and consumed identically by both the frontend (`/local` wizard) and the backend (server-side generation on upload).
3. **Backend** (`backend/`) — an Express + TypeORM (SQL Server/`mssql`) API service: JWT auth with roles, server-side upload → generate → submit lifecycle with per-subsidiary versioning, an admin API (search/filter/paginate uploads, zip downloads, user provisioning), and a security-hardening layer (rate limiting, CSRF, helmet, zod validation, upload content-sniffing).

The frontend's authenticated area and the backend are now fully wired together over HTTP (`src/api/apiClient.ts` → `backend/src/app.ts`'s `/api/v1/*` routes) — this is no longer two disconnected halves.

The generated output (both `/local` and the server-backed flow use the exact same `generateSolution()`) intentionally mirrors a specific Samsung campaign reference implementation (kept locally under `Final_forms_format/` and `packages/shared/src/codegen/js/reference/*.js` for byte-for-byte comparison, not part of the app itself) but strips anything campaign-specific that a generic tool shouldn't hardcode (real API endpoints, analytics IDs, favicon/font URLs — see `BuilderConfig` in `packages/shared/src/codegen/types.ts`).

## Frontend core data flow (the Excel→Solution pipeline)

Everything revolves around one serializable model, `FormDefinition` (`packages/shared/src/form/formDefinition.ts`), validated at the boundary by a parallel Zod schema (`formDefinitionZod.ts`) — the two are hand-kept in sync (no `z.infer` codegen), so a change to one field shape needs matching edits in both files. A `FormDefinition` is never authored directly by a user — it's always *derived* from an uploaded workbook, either client-side (`/local`) or server-side (`POST /api/v1/uploads`).

- `src/store/builderStore.ts` — the Zustand store driving the `/local` wizard (`WizardStep = "upload" | "preview" | "configure" | "generate"`). `loadWorkbook(file)` runs the whole Excel pipeline (parse → map → validate) and advances to `"preview"`; `config` holds the in-progress `BuilderConfig`; `previewLocale` is which locale the preview iframe currently renders.
- `excel/parser.ts` (`parseWorkbook`) — pure byte-level parsing via `xlsx`. Locates the "Complete Translations" sheet (exact or fuzzy name match), fuzzy-matches header text to find the key/English/translation-C/translation-D columns, and extracts the Subsidiary/Language_Country/Country metadata rows. Knows nothing about what a row *means* semantically — that's `mapper.ts`.
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

- **Two output variants**, toggleable via `BuilderConfig.variants`: `"ff"` (Full Form) and `"oc"` (One-Click). The backend's server-side flow always requests both (`generationService.generateFromWorkbook` hardcodes `variants: ["ff", "oc"]` — there's no per-upload configuration UI server-side, unlike `/local`'s `ConfigureStep`).
- **Reference-script trick**: `buildFfJs.ts`/`buildOcJs.ts` emit the reference jQuery/Parsley behavior scripts **byte-identical** (from `js/reference/*.js` via a one-off generation script, as plain TS string constants). If you need to change generated-form *behavior*, edit the human-readable reference `.js` file and regenerate — don't hand-edit the generated string.
- `buildDataJs.ts` emits the shared data file; `buildStyleCss.ts` emits the stylesheet (reference CSS + RTL/font overrides); `fileNames.ts` (`resolveFileNames`) is the single source of truth for every generated file name; `domIds.ts` is the shared source of truth for answer/question DOM ids between the HTML builders and the data file.

When changing `FormDefinition` shape, check whether `buildDataJs.ts` and the HTML fragment builders need matching updates — they're a manual projection of the schema, not derived automatically.

## Frontend component layout (`src/`)

`App.tsx` wires up `react-router-dom`: `/login` (public), `/local` (public — the original wizard, `AppShell`), and everything else behind `<ProtectedRoute>` (`src/auth/ProtectedRoute.tsx`, redirects to `/login` if unauthenticated) → `<AppLayout>` (`src/app/AppLayout.tsx`, nav bar + role-gated Admin link + logout) → the index route (`src/pages/UploadHistoryPage.tsx`) or, nested under `<AdminRoute>` (`src/auth/AdminRoute.tsx`, redirects non-admins to `/`), `/admin` (`src/pages/AdminDashboardPage.tsx`).

- `src/api/apiClient.ts` — the one fetch wrapper every API call goes through: attaches the in-memory access token (`Authorization: Bearer`, never persisted — see below) and the CSRF cookie value (`X-CSRF-Token`), sends `credentials: "include"` for the httpOnly refresh cookie, and on a `401` transparently does exactly one silent refresh-and-retry (coalescing concurrent refreshes into one in-flight request, since the backend's refresh token is single-use/rotated). `src/api/uploadsApi.ts`/`src/api/adminApi.ts` are typed wrappers around the actual endpoints, mirroring (duplicating, deliberately — no shared-types package across the frontend/backend boundary) the backend's response shapes.
- `src/auth/authStore.ts` — Zustand auth state (`user`, `status`, `login`/`logout`/`silentRefresh`). The access token itself lives only in `apiClient.ts`'s module-level variable (never in the Zustand store or any storage) — `silentRefresh()` (called once on app mount, see `App.tsx`) re-establishes a session purely from the httpOnly refresh cookie after a reload, decoding the returned JWT's payload client-side (display-only trust; the backend independently verifies the signature on every request regardless) to recover `user` since `POST /auth/refresh` returns only `{ accessToken }`.
- `src/components/` (the `/local` wizard, unchanged from before auth existed): `AppShell` → `upload/UploadStep.tsx` → `preview/PreviewStep.tsx` + `ValidationPanel.tsx` → `configure/ConfigureStep.tsx` → `generate/GenerateStep.tsx`.

Two field families render differently in the generated output and in `ConfigureStep`: `group: "profile"` (plain label+input) vs `group: "question"` (numbered `Q<n>` module) — this is a `packages/shared` concept, not frontend-specific.

## Backend service (`backend/`)

Express app (`src/app.ts`), mounted middleware order: `helmet()` (with `crossOriginResourcePolicy: "cross-origin"` — the default `"same-origin"` would make browsers block the frontend, a different origin, from reading *any* response including plain JSON) → `express.json()` → `cookie-parser` → CORS (`FRONTEND_URL` env var, `credentials: true`) → a global rate limiter. Backed by SQL Server via TypeORM (`src/config/data-source.ts`, migrations in `src/migrations/` — `InitSchema` then `AddUsersAndVersioning`; `backend/sql/init.sql` is the canonical full schema for a fresh database, manually kept in sync with the migrations).

### Entities

`User` (username/email/passwordHash/role `"admin"|"standard"`/isActive), `RefreshToken` (hashed token only — the raw value is never stored — /userId/expiresAt/revokedAt), `Upload` (subsidiaryId/fileName/filePath/uploadDate/**userId**/**version**/**generatedPath**/**status** `"uploaded"|"generated"|"submitted"|"failed"`/**submittedAt**/**isDeleted**), `GeneratedFile` (one row per output file — uploadId/fileName/filePath/fileType), `EmailLog` (uploadId/recipient/status/errorMessage/sentAt — records every submission-notification attempt), `AdminSetting` (key/value — e.g. `lockGeneratedFilesOnSubmit`, `notificationEmail`).

### Auth (`services/authService.ts`, `middleware/authJwt.ts`, `middleware/csrf.ts`)

Short-lived (15 min) stateless JWT access tokens (`Authorization: Bearer`, verified by signature/expiry only, payload `{ sub, username, role }` — see `AccessTokenPayload`) plus a database-backed, single-use refresh token (7 days, httpOnly cookie scoped `Path=/api/v1/auth`, rotated on every use — old token revoked, new one issued — so `rotateRefreshToken` doubles as the "session revocation" mechanism logout/refresh need against an otherwise-stateless JWT scheme). `requireAuth`/`requireAdmin`/`optionalAuth` (express-jwt-based) gate routes; `requireAdmin` checks `req.auth.role === "admin"`.

CSRF: a hand-rolled double-submit cookie (`middleware/csrf.ts`, not a third-party package) — `issueCsrfCookie` sets a random token as a **`Path=/`, non-httpOnly** cookie (must be `document.cookie`-readable from the frontend's own pages, unlike the refresh cookie) on login/refresh; `requireCsrfToken` (applied to `/auth/refresh` and `/auth/logout` — the two cookie-authenticated, state-changing endpoints) checks the `X-CSRF-Token` header matches. Bearer-header endpoints don't need this (a cross-site page can't read/replay a header it never had).

There is no self-service signup — `POST /api/v1/admin/users` (admin-only) is the only way to create an account, plus the one-time `backend/scripts/seedAdmin.ts` for the very first admin.

### Upload → generate → submit lifecycle (`services/uploadService.ts`, `generationService.ts`, `submissionService.ts`, `fileService.ts`)

`POST /api/v1/uploads` (multipart, memory-storage Multer — not disk-storage, since the final on-disk path depends on a version number only known after a DB transaction that runs *after* Multer finishes parsing): `uploadService.createUpload` sniffs the uploaded bytes' magic number (`fileService.hasExcelFileSignature` — a real `.xlsx` is a ZIP archive, a real `.xls` is an OLE2 Compound File; extension/MIME alone are attacker-controlled and checked separately, earlier, in Multer's `fileFilter`), then reserves the next version number for the subsidiary inside a short locked transaction (`SELECT ... WITH (UPDLOCK, HOLDLOCK)` — global per-subsidiary versioning, never overwritten, enforced by a DB-level `UNIQUE (subsidiaryId, version)` constraint as the backstop), persists the `Upload` row (`status: "uploaded"`), then *outside* that transaction runs `generationService.generateFromWorkbook` (the shared pipeline) and records the outcome — `"generated"` + `GeneratedFiles` rows written to `{UPLOAD_DIR}/{subsidiaryId}/v{version}/generated/`, or `"failed"` (blocking validation errors, **or** a formula-like-content warning promoted to blocking specifically for server uploads — see `hasFormulaLikeWarning`, string-matched against `validateWorkbook`'s exact warning text, documented as a fragile coupling to watch).

`findOwnedUpload(uploadId, userId, isAdmin)` is the one ownership-check helper reused everywhere (`getUploadDetail`, `softDeleteUpload`, `regenerateUpload`, `submissionService.submitUpload`) — admins bypass it, standard users must own the row; returns `null` identically for "doesn't exist" and "exists but isn't yours" so nothing leaks which case occurred. `POST /api/v1/generate/:uploadId` re-runs generation from the stored source file; blocked once `status === "submitted"` *if* the `lockGeneratedFilesOnSubmit` `AdminSetting` is enabled (default). `POST /api/v1/submit/:uploadId` requires `status === "generated"`, sets `"submitted"` + `submittedAt`, and fires `emailService.sendSubmissionNotification` (subject `"New Web Form Submission"`, all 6 required fields, records every attempt — sent/failed/skipped — to `EmailLogs`).

### Admin dashboard API (`services/adminUploadService.ts`, `services/zipService.ts`)

`listUploadsForAdmin` — cross-user listing with search/filter/sort/pagination, built with TypeORM's `QueryBuilder` (a left join to `Users` for the display name; `sortBy` is always resolved through a hardcoded column-name lookup table, never interpolated from raw input, even though it's already just query-builder placeholders elsewhere). `zipService.buildZip` reads a set of already-generated files from disk and zips them in memory (`fflate`, the same library `/local`'s `zipAndDownload.ts` uses) for `GET /admin/download/:uploadId` and `GET /admin/download/subsidiary/:name` (latest version by default, `?version=N` for a specific one).

### Route map

`/api/v1/auth`: `POST /login` (rate-limited, zod-validated), `POST /refresh` (rate-limited, CSRF-checked), `POST /logout` (auth-required, CSRF-checked). `/api/v1/uploads`: `POST /` (zod-validated `subsidiaryId`), `GET /` (own history only), `GET /:id`, `DELETE /:id` (soft delete, blocked once submitted). `/api/v1/generate/:uploadId`. `/api/v1/submit/:uploadId`. `/api/v1/admin` (all `requireAdmin`): `GET /uploads`, `GET /subsidiary/:name`, `GET /download/:uploadId`, `GET /download/subsidiary/:name`, `GET /diff` (existing two-workbook row-diff, `services/diffService.ts` — unrelated to the above, pre-dates it), `POST /users` (zod-validated). `/api/v1/download/:fileId` (`optionalAuth`, pre-dates the auth system — kept as-is).

### Security middleware (`middleware/rateLimit.ts`, `middleware/validate.ts`, `middleware/csrf.ts`)

`generalRateLimiter` (global, generous) + `authRateLimiter` (tight, only on `/login` and `/refresh` — the credential-stuffing/brute-force surface). `validateBody(zodSchema)` — a middleware factory replacing ad-hoc `typeof x !== "string"` checks with declarative Zod schemas, applied to every route that accepts a request body (`/login`, `/admin/users`, `/uploads` POST); query-param parsing keeps its existing hand-written type guards (`isUploadStatus`, `isAdminSortBy`, etc. — already type-safe, not worth converting).
