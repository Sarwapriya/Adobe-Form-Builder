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
npm run dev:shared                # tsup --watch on packages/shared — run alongside `npm run dev` in a second terminal when iterating on form/codegen code
npm run test:shared               # vitest run scoped to packages/shared/tests
```

Run a single frontend test file: `npx vitest run <path>` (or `npx vitest <path>` to watch just that file).

Frontend tests live in `tests/` (not `src/`) and cover only frontend-specific code (currently `tests/codegen/previewDocument.test.ts`, the preview-iframe glue). Vitest is configured in `vite.config.ts` (jsdom environment, `globals: false` — import `describe`/`it`/`expect` explicitly from `vitest`; `exclude` deliberately keeps this run from also picking up `packages/shared/tests` or `backend/tests`, each of which has its own vitest config/environment).

The codegen pipeline itself lives in `packages/shared/` (see below) with its own test suite under `packages/shared/tests/` (`codegen/` snapshot- and unit-tests the generated output — `generate.test.ts`'s snapshot lives in `packages/shared/tests/codegen/__snapshots__/`; `excel/questionMasterRows.test.ts`/`questionMasterWorkbook.test.ts` cover the Question Master export), run via `npm run test:shared`.

TypeScript is split via project references: `tsconfig.app.json` (src, browser) and `tsconfig.node.json` (Vite config). `npm run build` type-checks both after building `packages/shared` (whose declaration files the frontend's `tsc -b` pass needs to resolve `@formbuilder/shared`'s types).

Backend (`backend/`, an npm workspace declared in the root `package.json`):

```
npm run dev:backend      # ts-node-dev src/index.ts (from repo root)
npm run build:backend    # builds packages/shared, then tsc -p backend/tsconfig.json
npm run start:backend    # node backend/dist/index.js
```

Or from inside `backend/`: `npm run dev`, `npm run build`, `npm run start`, `npm run test` (vitest, its own `vitest.config.ts`), `npm run typeorm -- <args>` (TypeORM CLI against `src/config/data-source.ts`, e.g. `npm run typeorm -- migration:run`), `npm run seed:admin` (one-time — creates the first admin `User` row from `ADMIN_USER`/`ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` env vars; no-ops if an admin already exists), `npm run playwright:install` (one-time — installs the headless Chromium binary the QA-run feature needs; see `services/qaRunService.ts`). Backend tests live in `backend/tests/`. Configuration is env-var driven — see `backend/.env.example`.

Full deployment instructions (Docker, env vars, the `VITE_API_BASE_URL`-is-build-time gotcha, cookie/CORS domain topology) live in `DEPLOYMENT.md`.

## What this app is

A full-stack project living in one repo, structured as three npm workspaces plus the frontend at the repo root:

1. **Frontend** (repo root `src/`) — a React SPA: real user accounts (`admin`/`standard`/`superadmin` roles, standard optionally subsidiary-scoped) behind `/login`, a form builder (Form Initiator campaigns + ad-hoc forms + subsidiary contributions), an AI assistant chat panel, Question Master export, Playwright-driven QA runs, and admin configuration pages (project codes, subsidiaries, subsidiary-project blocks, subsidiary locales, user management, SMTP/FabriX/Claude/deployment settings).
   - **The Excel-upload feature (a server-backed upload → generate → submit flow, and a separate fully client-side `/local` wizard) has been removed** — forms are now only created via the builder, not derived from an uploaded workbook. This doc's older sections describing that flow have been removed; expect some remaining sections below (predating this removal) to still be incomplete about the form-builder/AI-assistant/QA/Question-Master surface — verify against the actual route/import graph in `src/`/`backend/src/` rather than treating this file as fully up to date.
2. **`packages/shared`** (`@formbuilder/shared`) — the DOM-free `FormDefinition` data model, schema-authored validation, contribution-merging, and codegen pipeline, built once and consumed identically by the frontend (builder preview) and the backend (server-side generation on publish).
3. **Backend** (`backend/`) — an Express + TypeORM (SQL Server/`mssql`) API service: JWT auth with roles and optional subsidiary scoping, the form-builder/contribution/QA/Question-Master/AI-assistant services described in outline below, and a security-hardening layer (rate limiting, CSRF, helmet, zod validation).

The frontend and the backend are fully wired together over HTTP (`src/api/apiClient.ts` → `backend/src/app.ts`'s `/api/v1/*` routes) — this is not two disconnected halves.

The generated output intentionally mirrors a specific Samsung campaign reference implementation (kept locally under `Final_forms_format/` and `packages/shared/src/codegen/js/reference/*.js` for byte-for-byte comparison, not part of the app itself) but strips anything campaign-specific that a generic tool shouldn't hardcode (real API endpoints, analytics IDs, favicon/font URLs — see `BuilderConfig` in `packages/shared/src/codegen/types.ts`).

## The shared package (`packages/shared/`)

`packages/shared/src/index.ts` is the package's public API surface — only symbols re-exported from that file are the stable contract frontend/backend code should import (`@formbuilder/shared`); everything else under `packages/shared/src/` is an internal implementation detail. Built with `tsup` (dual CJS+ESM) plus a separate `tsc -p tsconfig.build.json` pass for declaration files (tsup's own bundled dts step fails against this repo's TypeScript version). Must be built before the frontend or backend can resolve it — every root/backend build script already does this (`npm run build --workspace=packages/shared &&` prefix).

One file stays in `src/codegen/` at the frontend root, not the shared package: `previewDocument.ts` (preview-iframe HTML-inlining glue, used by the form-builder's preview/merge/contribution dialogs).

## Data model shape (`packages/shared/src/form/formDefinition.ts`)

`LocaleCode` is a *combined* `<lang>_<COUNTRY>` string (e.g. `"en_GB"`, `"ar_SA"`) — every per-locale field on `FormDefinition` is `Record<LocaleCode, string>`, resolved via `resolveLocalizedText(map, locale, defaultLocale)`. `questions[]` (`Q<n>`, with `controlType` and `answers[]`), `fields: ProfileFieldSet` (every field optional/presence-driven), `validationMessages`/`pageError`/`thankYou` (per-locale copy), `meta.subsidiary`/`meta.defaultLocale` (drive generated file naming and `<html lang>`).

## Codegen pipeline (`packages/shared/src/codegen/`)

`generateSolution(form, config)` (`generate.ts`) is a pure function: `FormDefinition` + `BuilderConfig` in, a flat `GeneratedFile[]` out. Called by the backend's `formBuilderService.ts` (on publish) and `qaRunService.ts` (QA runs), and by frontend preview dialogs — so there is exactly one code path that can ever diverge from what's downloaded/reviewed.

- **Two output variants**, toggleable via `BuilderConfig.variants`: `"ff"` (Full Form) and `"oc"` (One-Click).
- **Reference-script trick**: `buildFfJs.ts`/`buildOcJs.ts` emit the reference jQuery/Parsley behavior scripts **byte-identical** (from `js/reference/*.js` via a one-off generation script, as plain TS string constants). If you need to change generated-form *behavior*, edit the human-readable reference `.js` file and regenerate — don't hand-edit the generated string.
- `buildDataJs.ts` emits the shared data file; `buildStyleCss.ts` emits the stylesheet (reference CSS + RTL/font overrides); `fileNames.ts` (`resolveFileNames`) is the single source of truth for every generated file name; `domIds.ts` is the shared source of truth for answer/question DOM ids between the HTML builders and the data file.

When changing `FormDefinition` shape, check whether `buildDataJs.ts` and the HTML fragment builders need matching updates — they're a manual projection of the schema, not derived automatically.

## Frontend component layout (`src/`)

`App.tsx` wires up `react-router-dom`: `/login` (public), everything else behind `<ProtectedRoute>` (`src/auth/ProtectedRoute.tsx`, redirects to `/login` if unauthenticated) → `<AppLayout>` (`src/app/AppLayout.tsx`, a collapsible left sidebar — not a top nav bar — with role-gated nav items and account/logout, collapsed state persisted to `localStorage`). Routes now cover the form builder, Question Master, and admin configuration/user-management pages — check `App.tsx` directly for the current list rather than trusting this doc, which predates most of them. `AppLayout.tsx`'s nav items are gated by `isAdminRole(user?.role)` (true for both `"admin"` and `"superadmin"`), same helper the backend uses.

- `src/api/apiClient.ts` — the one fetch wrapper every API call goes through: attaches the in-memory access token (`Authorization: Bearer`, never persisted — see below) and the CSRF cookie value (`X-CSRF-Token`), sends `credentials: "include"` for the httpOnly refresh cookie, and on a `401` transparently does exactly one silent refresh-and-retry (coalescing concurrent refreshes into one in-flight request, since the backend's refresh token is single-use/rotated). `src/api/adminApi.ts`/`src/api/projectCodesApi.ts`/`src/api/subsidiariesApi.ts`/`src/api/qaApi.ts`/`src/api/questionMasterApi.ts` are typed wrappers around the actual endpoints, mirroring (duplicating, deliberately — no shared-types package across the frontend/backend boundary) the backend's response shapes.
- `src/auth/authStore.ts` — Zustand auth state (`user`, `status`, `login`/`logout`/`silentRefresh`). `AuthUser` carries `subsidiaryId` (null for admins and non-scoped standard users) alongside id/username/role. The access token itself lives only in `apiClient.ts`'s module-level variable (never in the Zustand store or any storage) — `silentRefresh()` (called once on app mount, see `App.tsx`) re-establishes a session purely from the httpOnly refresh cookie after a reload, decoding the returned JWT's payload client-side (display-only trust; the backend independently verifies the signature on every request regardless) to recover `user` since `POST /auth/refresh` returns only `{ accessToken }`.
- `src/components/admin/` — `ProjectCodeManager.tsx` (create/rename project codes, toggle open/closed, edit the descriptive campaign date range), `SubsidiaryManager.tsx` (create subsidiaries, toggle active/inactive, delete), and `SubsidiaryProjectBlockManager.tsx` (per-(subsidiary, project code) block list layered on top of both) all live on `ConfigurationPage`. `QaRunDialog.tsx` (opened from the form builder's contribution/ad-hoc review panels) triggers a QA run, polls until it leaves `"pending"/"running"`, and shows per-check pass/fail results plus a link to download the standalone HTML report.
- `src/components/formBuilder/` — the form builder itself (editor, preview/merge dialogs, review panels); not detailed here — read the directory directly.

## Backend service (`backend/`)

Express app (`src/app.ts`), mounted middleware order: `helmet()` (with `crossOriginResourcePolicy: "cross-origin"` — the default `"same-origin"` would make browsers block the frontend, a different origin, from reading *any* response including plain JSON) → `express.json()` → `cookie-parser` → CORS (`FRONTEND_URL` env var, `credentials: true`) → a global rate limiter. Backed by SQL Server via TypeORM (`src/config/data-source.ts`, migrations in `src/migrations/`, applied in filename-timestamp order — `InitSchema` → `AddUsersAndVersioning` → `SubmittedOnlyVersioning` → `AddProjectCodes` → `AddQuestionOverrides` → `AddUserSubsidiary` → `AddSubsidiaries` → `AddSubsidiaryProjectBlocks` → `AddSubsidiaryIsActive` → `AddQaRuns` → `AddProjectCodeDateRange` → `AddUploadVariants`; `backend/sql/init.sql` is the canonical full schema for a fresh database, manually kept in sync with the migrations).

### Entities

`User` (username/email/passwordHash/**role** `"admin"|"standard"|"superadmin"`/**subsidiaryId** — null for admins/superadmins and non-scoped standard users, non-null scopes a standard user to one subsidiary/isActive; `isAdminRole(role)` in `entities/User.ts` is true for both `"admin"` and `"superadmin"`, used everywhere admin access is checked — the two only diverge for provisioning other admin accounts, see Auth below), `RefreshToken` (hashed token only — the raw value is never stored — /userId/expiresAt/revokedAt), `GeneratedFile` (one row per output file, owned by a `FormVersion` — **not** by an Upload; the Excel-upload feature that used to also own rows here via a nullable `uploadId` column has been removed, though the column itself remains in the DB schema unused, since no migration was run), `ProjectCode` (code/isOpen/**startDate**/**endDate**/**cutoffDate**/createdAt — the admin-managed picklist behind form-builder campaign creation), `Subsidiary` (name/isActive/createdAt — the admin-managed picklist; a text snapshot, not a foreign key — see `subsidiaryService.ts`), `SubsidiaryProjectBlock` (subsidiaryName/projectCode, unique pair — row presence *is* the block), `QaRun` (formId/contributionId — one of the two identifies the QA subject, since the Excel-upload variant that used a third `uploadId` column has been removed — variant `"ff"|"oc"`/status `"pending"|"running"|"passed"|"failed"|"error"`/triggeredByUserId/totalTests/passedTests/failedTests/errorMessage/reportPath/timestamps — one Playwright QA automation run against a generated form; see `qaRunService.ts`), `QaTestCaseResult` (qaRunId/category/name/status/fieldId/message — one assertion within a `QaRun`), `EmailLog`, `AdminSetting` (key/value — e.g. `lockGeneratedFilesOnSubmit`, SMTP/Fabrix/Claude/SFTP settings). The form-builder entities (`Form`/`FormVersion`/`FormContribution`) and AI-assistant entities are not detailed here — this doc predates them; read `entities/` directly.

### Auth (`services/authService.ts`, `middleware/authJwt.ts`, `middleware/csrf.ts`)

Short-lived (15 min) stateless JWT access tokens (`Authorization: Bearer`, verified by signature/expiry only, payload `{ sub, username, role, subsidiaryId }` — see `AccessTokenPayload`) plus a database-backed, single-use refresh token (7 days, httpOnly cookie scoped `Path=/api/v1/auth`, rotated on every use — old token revoked, new one issued — so `rotateRefreshToken` doubles as the "session revocation" mechanism logout/refresh need against an otherwise-stateless JWT scheme). `requireAuth`/`requireAdmin`/`optionalAuth` (express-jwt-based) gate routes; `requireAdmin` checks `isAdminRole(req.auth.role)` (`"admin"` or `"superadmin"`).

CSRF: a hand-rolled double-submit cookie (`middleware/csrf.ts`, not a third-party package) — `issueCsrfCookie` sets a random token as a **`Path=/`, non-httpOnly** cookie (must be `document.cookie`-readable from the frontend's own pages, unlike the refresh cookie) on login/refresh; `requireCsrfToken` (applied to `/auth/refresh` and `/auth/logout` — the two cookie-authenticated, state-changing endpoints) checks the `X-CSRF-Token` header matches. Bearer-header endpoints don't need this (a cross-site page can't read/replay a header it never had).

There is no self-service signup — `POST /api/v1/admin/users` (admin-or-superadmin, optionally takes `subsidiaryId`, required when `role: "standard"`) is the only way to create an account, plus the one-time `backend/scripts/seedAdmin.ts` for the very first admin. A plain `"admin"` may only provision/enable/disable `"standard"` accounts; only a `"superadmin"` may provision or toggle another `"admin"`/`"superadmin"` account (checked inline in `admin.router.ts`, since `requireAdmin` alone isn't fine-grained enough) — and nobody may disable their own account.

### Excel-upload feature: removed

The server-backed Excel upload → generate → submit lifecycle (`Upload` entity, `uploadService.ts`, `submissionService.ts`, `adminUploadService.ts`, `uploadCleanupService.ts`, `diffService.ts`, the `upload`/`generate`/`submit`/`download` routers, and the matching `/local` client-side wizard and `@formbuilder/shared` Excel parser/mapper/validator) has been removed from this codebase. Forms are now only created via the form builder. `GeneratedFile.uploadId` and `QaRun.uploadId` remain as unused nullable columns in the DB schema (no migration was run to drop them) — every surviving code path uses `formVersionId`/`formId`/`contributionId` instead. `generationService.classifyFileType`, `previewService.buildFormVersionPreview`/`inlineGeneratedFiles`, `zipService.buildZip`, and `projectCodeService.assertProjectCodeOpen` are shared helpers that survived this removal and are still used by the form builder/QA/Question Master.

### Security middleware (`middleware/rateLimit.ts`, `middleware/validate.ts`, `middleware/csrf.ts`)

`generalRateLimiter` (global, generous) + `authRateLimiter` (tight, only on `/login` and `/refresh` — the credential-stuffing/brute-force surface). `validateBody(zodSchema)` — a middleware factory replacing ad-hoc `typeof x !== "string"` checks with declarative Zod schemas, applied to every route that accepts a request body; query-param parsing keeps its existing hand-written type guards where already type-safe.
