# backend-py — Python (FastAPI) port

Phase 1 of the Node → Python migration: the FastAPI app skeleton, every
SQLAlchemy model for the existing SQL Server schema, the security substrate
(JWT, CSRF, bcrypt, AES-256-GCM secret encryption, security headers, rate
limiting, CORS), and the `/api/v1/auth` router (login/refresh/logout) — a
drop-in replacement for that slice of `backend/` (the Node/Express/TypeORM
backend, left completely untouched).

## Install

```
cd backend-py
python -m venv .venv
.venv\Scripts\activate            # Windows
pip install -e ".[dev]"
```

## Configure

Copy `.env.example` to `.env` and fill in at least `JWT_SECRET` and either
`SQL_CONNECTION_STRING` or the `SQL_TRUSTED_CONNECTION=true` + `SQL_SERVER`/
`SQL_INSTANCE`/`SQL_DATABASE` group — same variable names as
`backend/.env.example`, so an existing Node `.env` can mostly be copied over
as a starting point. Connecting requires the "ODBC Driver 17 for SQL Server"
ODBC driver installed on the machine (same requirement the Node backend's
`msnodesqlv8`/`mssql` drivers have).

## Run

```
uvicorn app.main:app --reload --port 4001
```

The frontend's `VITE_API_BASE_URL` would point at this instead of the Node
backend's port (4000) to try it as a drop-in replacement.

## Test

```
pytest
```

`tests/test_auth.py` needs a **real, reachable SQL Server database** — there
is deliberately no SQLite fallback (`uniqueidentifier`/`datetimeoffset`
columns don't translate). Point `.env` at a real dev/test database first;
every test skips cleanly (not a failure) if none is reachable. Tables are
created automatically (`Base.metadata.create_all(checkfirst=True)`) if the
target database doesn't already have them from the Node side's migrations /
`backend/sql/init.sql`. Each test runs inside a rolled-back transaction, so
the suite never leaves rows behind.

## What's here vs. deferred

Built in this phase: `app/config.py`, `app/db.py`, all 20 models under
`app/models/`, `app/security/` (JWT, passwords, CSRF, secret cipher, auth
dependencies), `app/middleware/` (security headers, rate limiting), and
`app/routers/auth.py`.

Everything else (admin/user-management, project codes, subsidiaries, form
builder, QA runs, Question Master, AI assistant) is out of scope for this
phase — see the `TODO(phase N): ...` comments scattered through the code
(mainly `app/config.py`, `app/services/auth_service.py`, `app/main.py`) for
where later phases plug in without reworking what's already here.
