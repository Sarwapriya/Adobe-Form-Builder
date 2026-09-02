# Deployment Guide

This project ships as three independently deployable pieces that share one
build-time dependency:

1. **`packages/shared`** — not deployed on its own; both of the pieces below
   need it *built* (`dist/`) before they can build/run.
2. **`backend/`** — an Express + TypeORM (SQL Server) API service.
3. **Frontend** (repo root `src/`) — a static single-page app (Vite build
   output), served by any static host/CDN.

There is no runtime coupling beyond HTTP — the frontend calls the backend
over `fetch`, nothing more. They can be deployed to entirely different hosts,
as long as the cookie/CORS topology note near the bottom of this doc is
followed.

## 1. Database setup

Pick one:

- **Fresh database**: apply `backend/sql/init.sql` directly (`sqlcmd`, Azure
  Data Studio, etc.) — it's the canonical full schema, written to run once
  against an empty database.
- **Already-deployed database** (i.e. you deployed before Phase 1 of this
  build added Users/versioning): run the incremental migrations instead:
  ```
  cd backend
  npm run typeorm -- migration:run
  ```
  This applies `InitSchema` then `AddUsersAndVersioning` in order. Migrations
  are idempotent/tracked by TypeORM, so re-running is safe.

### Seed the first admin account (one-time, per environment)

The production backend image (below) intentionally does **not** include
`ts-node-dev` (a devDependency) to keep the runtime image lean, so
`npm run seed:admin` can't run *inside* the deployed container as-is. Run it
instead from any machine with the full dev toolchain and network access to
the production database — a developer's machine, or a CI job — with
`backend/.env` (or equivalent env vars) pointed at the **production**
`SQL_CONNECTION_STRING`:

```
cd backend
npm install
# ADMIN_USER / ADMIN_EMAIL / ADMIN_PASSWORD_HASH and SQL_CONNECTION_STRING
# in your env must point at the production database for this one run.
npm run seed:admin
```

It's safe to re-run — it no-ops if an admin already exists (see
`backend/scripts/seedAdmin.ts`).

## 2. Backend deployment

### Docker (recommended)

```
docker build -f backend/Dockerfile -t formbuilder-backend .
docker run -p 4000:4000 --env-file backend/.env \
  -v $(pwd)/backend/uploads:/app/backend/uploads \
  formbuilder-backend
```

The Dockerfile already builds `packages/shared` before `backend/` (both
stages) and copies only the compiled `dist/` output into the runtime image —
no source, no devDependencies. The `uploads/` volume is where every
generated solution file, QA report, and Question Master export lives; back
it up like you would a database.

### Bare Node (no Docker)

```
npm run build --workspace=packages/shared
npm run build --workspace=backend
node backend/dist/index.js
```

### Required environment variables

See `backend/.env.example` for the full annotated list — summarized here:

| Variable | Purpose |
|---|---|
| `SQL_CONNECTION_STRING` | `mssql://user:password@host:1433/database` |
| `SQL_TRUST_SERVER_CERTIFICATE` | `true` only for self-signed local/dev SQL Server; leave unset against Azure SQL |
| `JWT_SECRET` | Signs access tokens — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SENDGRID_API_KEY` | Upload/submission notification email |
| `FORMBUILDER_NOTIFY_EMAIL` | Notification recipient (falls back to `AdminSettings.notificationEmail` if unset) |
| `UPLOAD_DIR` | Where workbooks/generated files are stored — set by the Dockerfile already; override if not using the provided volume |
| `FRONTEND_URL` | Exact origin of the deployed frontend, for CORS |
| `NODE_ENV` | Set to `production` — required for the refresh-token and CSRF cookies to be marked `Secure` (HTTPS-only) |
| `PORT` | HTTP port (defaults 4000) |
| `ADMIN_USER` / `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` | Only read by the one-time `seed:admin` script, not at request time |

## 3. Frontend deployment

```
npm run build --workspace=packages/shared
npm run build
```

This produces a static `dist/` directory — deploy it to any static
host/CDN. Two things that trip people up:

- **`VITE_API_BASE_URL` is baked in at build time, not read at runtime.**
  Vite inlines `import.meta.env.VITE_*` values into the built JS during
  `npm run build` — setting the env var on the *server* after deploying does
  nothing. Your CI pipeline must have the correct production backend URL set
  as a build-time environment variable *before* running `npm run build`.
- **The `packages/shared` build must run first**, same as for the backend —
  add `npm run build --workspace=packages/shared &&` in front of whatever
  build command your static-hosting CI is configured to run.

## 4. Cookie/CORS topology (important)

Refresh-token and CSRF cookies are set with `SameSite=Strict`. Browsers only
send `SameSite=Strict` cookies on requests that share the same **registrable
domain** as the page that set them (subdomains and different ports are fine;
completely unrelated domains are not). Two deployment shapes:

- **Same registrable domain** (recommended) — e.g. frontend at
  `app.example.com`, backend at `api.example.com`. Works as-is with the
  current `SameSite=Strict` cookies; just set `FRONTEND_URL=https://app.example.com`
  on the backend and `VITE_API_BASE_URL=https://api.example.com` on the
  frontend build.
- **Unrelated domains** — e.g. a frontend host that assigns you
  `myapp.vercel.app` and a backend host that assigns you
  `myapi.onrender.com`. These do **not** share a registrable domain, so
  `SameSite=Strict` cookies will never be sent cross-site — login would
  appear to work (the initial response arrives fine) but the session
  wouldn't persist (refresh/logout would silently fail). If you must deploy
  this way, `routes/auth.router.ts`'s and `middleware/csrf.ts`'s cookie
  options need `sameSite: "none"` instead of `"strict"` (still `secure:
  true`, still HTTPS-only) — a deliberate code change, not just config, so
  decide your deployment topology before you need it.

## 5. Local development workflow

Two terminals, from the repo root:

```
# Terminal 1 — rebuilds packages/shared on every save
npm run dev:shared

# Terminal 2 — the frontend dev server
npm run dev
```

Plus a third terminal for the backend:

```
npm run dev:backend
```

First-time setup checklist:
1. `npm install` at the repo root (installs all three workspaces)
2. Copy `.env.example` → `.env` at the repo root (`VITE_API_BASE_URL`)
3. Copy `backend/.env.example` → `backend/.env` and fill in your local SQL
   Server connection details, `JWT_SECRET`, etc.
4. Apply the schema (§1 above) against your local database
5. `npm run seed:admin` (from `backend/`) to create your first admin login
6. Start all three dev processes above
