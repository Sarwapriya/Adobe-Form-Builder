# Deployment Guide

This project ships as three independently deployable pieces:

1. **`packages/shared`** — not deployed on its own; the frontend needs it *built* (`dist/`) before it can build.
2. **`backend-py/`** — a FastAPI (Python) API service.
3. **Frontend** (repo root `src/`) — a static single-page app (Vite build output), served by any static host/CDN.

There is no runtime coupling beyond HTTP — the frontend calls the backend over `fetch`, nothing more. They can be deployed to entirely different hosts, as long as the cookie/CORS topology note near the bottom of this doc is followed.

## 1. Database setup

Apply the canonical schema (init SQL / `Base.metadata.create_all` — see `backend-py/README.md`) to a SQL Server database. There is no migration framework wired up in `backend-py/` yet (`alembic` is a listed dependency, not yet configured) — any schema change beyond the baseline (e.g. the DKMS PII-encryption columns) is applied by hand-written, idempotent SQL, such as `backend-py/scripts/dkms_migration.sql`.

`backend-py/scripts/soft_delete_and_ai_providers_migration.sql` is the latest of these — it adds the soft-delete columns (`isDeleted`/`deletedAt` on `fq.Users`, `fq.Subsidiaries`, `fq.SubsidiaryLocales`) and the `fq.AiProviders` table (copying any existing Groq setting into it). **Run it against each database before deploying a backend built from this version** — the new code selects those columns, so without it every user/subsidiary/locale query fails. It is idempotent and only adds; it never drops or rewrites data.

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

SFTP deployment-target credentials (host/username/private-key-path/remote-path per environment) are entirely admin-configured via the Configuration page, not env vars. The **private key path is resolved inside the backend container**, so the standard layout is one folder on the VM, `~/keys/` (holding e.g. `adobe_sftp`), mounted read-only at `/keys` (the `-v $HOME/keys:/keys:ro` line in the `docker run` below), and Configuration > Deployment > Private Key Path set to the in-container path, e.g. `/keys/adobe_sftp`. That path is stored in the database (`fq.AdminSettings`, `sftpStagingPrivateKeyPath` / `sftpProductionPrivateKeyPath`); the key file itself is never stored. The Deployment page shows whether a file was actually found at the saved path. Without the mount, publishing succeeds but SFTP delivery fails with "private key file not found". Keep the key readable by the container user (`chmod 644`) since the mount is read-only.

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

### Docker (recommended for a single-VM deployment)

The repo-root `Dockerfile` builds the SPA and serves it via nginx, which also
**reverse-proxies `/api/` to the backend container** (see
`nginx.conf.template`) — the browser only ever talks to the frontend's port;
nginx forwards to the backend internally over a shared Docker network. This
means:

- Leave `VITE_API_BASE_URL` **unset** when building the frontend image — every
  API call becomes a relative `/api/...` URL, so there's no build-time port/
  host to keep in sync with wherever the backend happens to be running.
- Frontend and backend end up on the same origin from the browser's
  perspective, which sidesteps the CORS/cookie-`SameSite` topology question
  in §4 below entirely — no `samesite="none"` code change needed even across
  separate containers.

```bash
docker network create formiq-net

docker build -f backend-py/Dockerfile -t formiq-backend .
docker run -d --name formiq-backend --network formiq-net --restart unless-stopped \
  --env-file backend-py/.env -v $(pwd)/backend-py/uploads:/app/uploads \
  -v $HOME/keys:/keys:ro \
  formiq-backend

docker build -t formiq-frontend .
docker run -d --name formiq --network formiq-net --restart unless-stopped \
  -p 8080:80 formiq-frontend
```

The backend image bundles Playwright's Chromium (plus its OS libraries) for the
QA-run feature, so its first build downloads a few hundred MB more than the
rest of the image. Without it every QA run fails with "Executable doesn't exist".

Only port `8080` needs to be open in your VM's firewall/NSG — the backend's
`4001` never needs to be exposed to the internet at all, since nginx reaches
it by container name (`formiq-backend`) over the internal Docker network.

### Serving under a path prefix (shared hub domain)

If this app is reached via a path prefix on a shared domain — e.g.
`ax-hub.samsung.com/formiq` — rather than its own domain/port, a thin
top-level gateway (one nginx, on whatever host owns that domain) should
forward that path prefix to this app's own containers, unmodified:

```nginx
# On the gateway host (NOT this repo)
location /formiq/ {
    proxy_pass http://<this-vm-ip-or-hostname>:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Note there's no trailing slash after the port in `proxy_pass` — the full
`/formiq/...` path is forwarded through unchanged.

This repo's own `Dockerfile`/`nginx.conf.template` handle their end of that
via a single `SUBPATH` build arg, which drives Vite's `base` (so built asset
URLs come out correctly prefixed — a browser resolves an unprefixed absolute
URL like `/assets/x.js` against the domain root, not the current subpath, so
this is unavoidable, not just cosmetic), `VITE_API_BASE_URL` (so API calls go
to `/formiq/api/...`), and nginx's own location blocks, all at once:

```bash
docker build -t formiq-frontend --build-arg SUBPATH=/formiq .
docker run -d --name formiq --network formiq-net --restart unless-stopped \
  -p 8080:80 formiq-frontend
```

Leaving `SUBPATH` unset (or empty) reproduces the plain root deployment
above byte-for-byte — the same image/Dockerfile serves both cases.

Only pass `--build-arg VITE_API_BASE_URL=http://<host>:<port>` if the backend
is deployed on a genuinely separate host with no shared nginx to proxy
through — then it behaves like the general baked-in-at-build-time case above.

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
  `myapi.onrender.com` (or, just as commonly, two bare IP addresses/ports on
  a VM with no shared domain at all). These do **not** share a registrable
  domain, so `SameSite=Strict` cookies will never be sent cross-site — login
  would appear to work (the initial response arrives fine, since it doesn't
  depend on a cookie yet) but the session wouldn't persist: a page refresh
  (or any call to `/auth/refresh`) silently fails to send the cookie back,
  which the frontend can't distinguish from "not logged in", so the user
  gets bounced to `/login`. If you must deploy this way, set
  `COOKIE_SAMESITE=none` in `backend-py/.env` (see `.env.example`) — this
  still requires `NODE_ENV=production` and real HTTPS on both hosts, since
  browsers reject a `SameSite=None` cookie that isn't also `Secure`.

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
