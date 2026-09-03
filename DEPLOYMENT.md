# Deployment Guide

This project ships as three independently deployable pieces:

1. **`packages/shared`** — not deployed on its own; the frontend needs it *built* (`dist/`) before it can build.
2. **`backend-py/`** — a FastAPI (Python) API service.
3. **Frontend** (repo root `src/`) — a static single-page app (Vite build output), served by any static host/CDN.

There is no runtime coupling beyond HTTP — the frontend calls the backend over `fetch`, nothing more. They can be deployed to entirely different hosts, as long as the cookie/CORS topology note near the bottom of this doc is followed.

## 1. Database setup

Apply the canonical schema (init SQL / `Base.metadata.create_all` — see `backend-py/README.md`) to a SQL Server database. There is no migration framework wired up in `backend-py/` yet (`alembic` is a listed dependency, not yet configured) — any schema change beyond the baseline (e.g. the DKMS PII-encryption columns) is applied by hand-written, idempotent SQL, such as `backend-py/scripts/dkms_migration.sql`.

### Seed the first admin account (one-time, per environment)

Run from any machine with the full Python toolchain and network access to the production database — a developer's machine, or a CI job — with `backend-py/.env` (or equivalent env vars) pointed at the **production** `SQL_CONNECTION_STRING`:

```
cd backend-py
python -m venv .venv && .venv\Scripts\activate
pip install -e ".[dev]"
# ADMIN_USER / ADMIN_EMAIL / ADMIN_PASSWORD_HASH and SQL_CONNECTION_STRING
# in your env must point at the production database for this one run.
python scripts/seed_admin.py
```

It's safe to re-run — it no-ops if an admin already exists (see `backend-py/scripts/seed_admin.py`). `ADMIN_PASSWORD_HASH` must already be a bcrypt hash (generate one with `python -c "import bcrypt; print(bcrypt.hashpw(b'your-password', bcrypt.gensalt()).decode())"`), not a plaintext password.

## 2. Backend deployment

### Docker (recommended)

```
docker build -f backend-py/Dockerfile -t formbuilder-backend-py .
docker run -p 4001:4001 --env-file backend-py/.env \
  -v $(pwd)/backend-py/uploads:/app/uploads \
  formbuilder-backend-py
```

The Dockerfile installs the ODBC driver `pyodbc` needs to reach SQL Server, then copies only the installed package + `app/` into a slim runtime stage — no dev dependencies, no test suite. The `uploads/` volume is where every generated solution file, QA report, and Question Master export lives; back it up like you would a database.

### Bare Python (no Docker)

```
cd backend-py
python -m venv .venv && .venv\Scripts\activate
pip install -e .
python -m playwright install chromium   # needed for the QA-run feature
uvicorn app.main:app --host 0.0.0.0 --port 4001
```

### Required environment variables

See `backend-py/.env.example` for the full annotated list — summarized here:

| Variable | Purpose |
|---|---|
| `SQL_CONNECTION_STRING` | `mssql://user:password@host:1433/database` |
| `SQL_TRUST_SERVER_CERTIFICATE` | `true` only for self-signed local/dev SQL Server; leave unset against Azure SQL |
| `JWT_SECRET` | Signs access tokens (also derives the AES-256-GCM key for `AdminSetting` secret encryption) — generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DKMS_BASE_URL` / `DKMS_TASK_ID` | The external DKMS service used to encrypt/hash `User.email`/`firstName`/`lastName` — required for user creation/update to work at all (fail-closed on write) |
| `FORMBUILDER_NOTIFY_EMAIL` | Notification recipient override (falls back to every admin's own `notificationEmail`/`notificationEmail2` if unset) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM` | Outbound-email fallback config — the DB-stored `AdminSetting` rows (Configuration page) take precedence when set |
| `UPLOAD_DIR` | Where generated files/QA reports/Question Master exports are stored — set by the Dockerfile already; override if not using the provided volume |
| `FRONTEND_URL` | Exact origin of the deployed frontend, for CORS |
| `NODE_ENV` | Set to `production` — required for the refresh-token and CSRF cookies to be marked `Secure` (HTTPS-only); the name is a historical carry-over from the original Node backend, kept identical so `.env` files can be shared during migration |
| `PORT` | HTTP port (defaults 4001) |
| `ADMIN_USER` / `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` | Only read by the one-time `scripts/seed_admin.py`, not at request time |

SFTP deployment-target credentials (host/username/private-key-path/remote-path per environment) are entirely admin-configured via the Configuration page, not env vars.

## 3. Frontend deployment

```
npm run build --workspace=packages/shared
npm run build
```

This produces a static `dist/` directory — deploy it to any static host/CDN. Two things that trip people up:

- **`VITE_API_BASE_URL` is baked in at build time, not read at runtime.**
  Vite inlines `import.meta.env.VITE_*` values into the built JS during
  `npm run build` — setting the env var on the *server* after deploying does
  nothing. Your CI pipeline must have the correct production backend URL set
  as a build-time environment variable *before* running `npm run build`.
- **The `packages/shared` build must run first** — add
  `npm run build --workspace=packages/shared &&` in front of whatever build
  command your static-hosting CI is configured to run.

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
  this way, `app/routers/auth.py`'s and `app/middleware/csrf.py`'s cookie
  options need `samesite="none"` instead of `"strict"` (still `secure=True`,
  still HTTPS-only) — a deliberate code change, not just config, so decide
  your deployment topology before you need it.

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
cd backend-py
.venv\Scripts\activate
uvicorn app.main:app --reload --port 4001
```

First-time setup checklist:
1. `npm install` at the repo root (installs the frontend + `packages/shared` workspaces)
2. Copy `.env.example` → `.env` at the repo root (`VITE_API_BASE_URL`)
3. `cd backend-py`, create a venv, `pip install -e ".[dev]"`, copy `.env.example` → `.env` and fill in your local SQL Server connection details, `JWT_SECRET`, `DKMS_BASE_URL`/`DKMS_TASK_ID`, etc.
4. Apply the schema (§1 above) against your local database
5. `python scripts/seed_admin.py` (from `backend-py/`) to create your first admin login
6. `python -m playwright install chromium` (one-time — needed for the QA-run feature)
7. Start all three dev processes above
