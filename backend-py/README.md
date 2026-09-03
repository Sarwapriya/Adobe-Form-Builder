# backend-py — the Form Builder backend (FastAPI)

A full FastAPI/SQLAlchemy port of this project's backend — auth, admin
configuration, the form builder (Form Initiator campaigns, ad-hoc forms,
subsidiary contributions), Playwright-driven QA runs, Question Master
export, the AI assistant (FabriX + Groq), DKMS-based PII encryption, and
outbound email/SFTP deployment. This is the only backend in the repo; an
earlier Node/Express/TypeORM backend was ported here feature-for-feature and
then removed once parity was verified.

## Install

```
cd backend-py
python -m venv .venv
.venv\Scripts\activate            # Windows; source .venv/bin/activate elsewhere
pip install -e ".[dev]"
python -m playwright install chromium   # one-time — the QA-run feature needs a real Chromium binary
```

Connecting to SQL Server requires the "ODBC Driver 17 for SQL Server" ODBC driver installed on the machine.

## Configure

Copy `.env.example` to `.env` and fill in at least `JWT_SECRET`, either
`SQL_CONNECTION_STRING` or the `SQL_TRUSTED_CONNECTION=true` + `SQL_SERVER`/
`SQL_INSTANCE`/`SQL_DATABASE` group, and `DKMS_BASE_URL`/`DKMS_TASK_ID` (user
creation/update fails closed without a reachable DKMS — see below).

## Run

```
uvicorn app.main:app --reload --port 4001
```

Point the frontend's `VITE_API_BASE_URL` at this.

## Test

```
pytest
```

Needs a **real, reachable SQL Server database** — there is deliberately no
SQLite fallback (`uniqueidentifier`/`datetimeoffset` columns don't
translate). Point `.env` at a real dev/test database first; every
DB-dependent test skips cleanly (not a failure) if none is reachable. Tables
are created automatically (`Base.metadata.create_all(checkfirst=True)`) if
missing. Each test runs inside a rolled-back transaction/savepoint (see
`tests/conftest.py`'s `db_session` fixture), so the suite never leaves rows
behind — this also means background work spawned from inside a request
(email notifications, QA runs — both fire-and-forget on their own DB
session, see `app/utils/background.py`) can't see data a still-running
test's own transaction hasn't really committed; those code paths are tested
only for their immediate ("pending"/"queued") response, not full
completion, inside pytest. A handful of tests additionally need a reachable
DKMS (`DKMS_BASE_URL`/`DKMS_TASK_ID`) and skip cleanly otherwise.

## Project layout

- `app/main.py` — FastAPI app, middleware, router mounting.
- `app/models/` — every SQLAlchemy model (mirrors the SQL Server schema).
- `app/routers/` — one file per resource (`admin.py`, `auth.py`, `ai.py`, `form_builder.py`, `subsidiary_forms.py`, `project_codes.py`, `subsidiaries.py`, `subsidiary_locales.py`), each ported from the equivalent Node Express router.
- `app/services/` — business logic, one file per Node service it was ported from (`auth_service.py`, `form_builder_service.py`, `email_service.py`, `sftp_service.py`, `qa_run_service.py`, `qa/` (Playwright QA-check implementation), `cutoff_reminder_service.py`, `aiProviderService.py`/`fabrixAIService.py`/`groqAIService.py`, ...).
- `app/form_pipeline/` — a hand-ported Python re-implementation of `packages/shared/src/` (the `FormDefinition` model, validation, contribution-merging, codegen) — **not** a binding onto the TypeScript package (Python can't import it); keep both in sync by hand when either changes.
- `app/security/` — JWT, passwords, CSRF, AES-256-GCM secret encryption, the DKMS PII-encryption client.
- `app/middleware/` — security headers, rate limiting.
- `app/utils/background.py` — fire-and-forget background work with its own DB session (used by email notifications and QA runs, mirroring the Node original's `void someAsyncCall(...)` pattern).
- `scripts/` — one-time operational scripts: `seed_admin.py` (first admin account), `backfill_user_pii_encryption.py` (DKMS-encrypts pre-existing plaintext `User` rows), `dkms_migration.sql` (idempotent schema migration for the DKMS columns).
- `tests/` — pytest suite, one directory per router area, mirroring `app/routers/`.

## Known gaps / accepted tradeoffs

- **No migration framework wired up.** `alembic` is a listed dependency but has no `alembic.ini`/versions directory yet — schema changes are applied via hand-written, idempotent SQL scripts (see `scripts/dkms_migration.sql` for the pattern), not tracked migrations. Worth setting up properly if schema changes become frequent.
- **QA runs and email notifications run in a background thread with their own DB session**, not a job queue — a server restart mid-run leaves that one `QaRun` stuck at "running" forever (rare, always resolvable by re-running QA). This exactly mirrors the original Node backend's own accepted tradeoff for both features.
