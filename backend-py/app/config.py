"""Application configuration, loaded from environment variables / a local
`.env` file. Mirrors `backend/.env.example`'s variable names exactly so the
Python and Node backends can (mostly) share one `.env` during the migration.

Uses pydantic-settings so every value is validated/typed once at startup
rather than read ad-hoc (`os.environ[...]`) throughout the codebase — the
equivalent of `backend/src/utils/env.ts`'s `requireEnv`, but centralized.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Anchored to this file's location (backend-py/app/config.py -> backend-py/.env)
# rather than a bare ".env", which pydantic-settings would otherwise resolve
# relative to the process's current working directory — meaning the file was
# silently skipped (and every setting fell back to its default) whenever
# uvicorn/pytest was launched from anywhere other than backend-py/ itself.
_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    # --- SQL Server connection (two paths — see app/db.py) ---
    SQL_CONNECTION_STRING: Optional[str] = None
    SQL_TRUST_SERVER_CERTIFICATE: bool = False
    SQL_TRUSTED_CONNECTION: bool = False
    SQL_SERVER: str = "localhost"
    SQL_INSTANCE: Optional[str] = None
    SQL_DATABASE: Optional[str] = None

    # --- SMTP (fallback only — TODO(phase N): AdminSetting-backed config) ---
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_SECURE: bool = False
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: Optional[str] = None

    # --- FabriXAI (fallback only — TODO(phase N): AdminSetting-backed config) ---
    FABRIX_API_BASE_URL: Optional[str] = None
    FABRIX_MODEL_ID: Optional[str] = None
    FABRIX_TIMEOUT_SECONDS: int = 30
    FABRIX_MAX_RETRIES: int = 2
    FABRIX_ENABLED: bool = True
    FABRIX_CLIENT_HEADER: Optional[str] = None
    FABRIX_OPENAPI_TOKEN: Optional[str] = None
    FABRIX_USER_EMAIL: Optional[str] = None

    # --- Groq (OpenAI-compatible chat completions API; fallback tier in the
    # AI assistant chain, tried whenever FabriX is disabled or unreachable —
    # see aiProviderService.py) ---
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_ENABLED: bool = True

    FORMBUILDER_NOTIFY_EMAIL: Optional[str] = None

    # --- MCP-SQL (Model Context Protocol server the AI assistant chat calls
    # for live-database Q&A — see app/services/mcp_sql_client.py). No admin-UI
    # config layer yet (unlike FabriX/Groq) since this is a single trusted
    # internal server with no auth today; add one later if that changes. ---
    MCP_SQL_SERVER_URL: Optional[str] = None
    MCP_SQL_ENABLED: bool = True
    MCP_SQL_TIMEOUT_SECONDS: int = 30

    # --- DKMS (PII encryption/hashing service) ---
    # Base URL only (no trailing /dkms/v1/... suffix) — app/security/dkms_client.py
    # appends the specific endpoint path. taskId is sent on every encrypt call, per
    # the DKMS request contract.
    DKMS_BASE_URL: Optional[str] = None
    DKMS_TASK_ID: Optional[str] = None
    DKMS_TIMEOUT_SECONDS: int = 10
    # piiTag values sent per field — DKMS's decrypt endpoint takes only a
    # ciphertext (no tag), so these are audit/classification labels, not part of
    # the encryption scheme itself. Adjust here (or via env) if DKMS expects
    # specific enum values different from these defaults.
    DKMS_PII_TAG_EMAIL: str = "email"
    DKMS_PII_TAG_FIRST_NAME: str = "name"
    DKMS_PII_TAG_LAST_NAME: str = "name"

    # --- Core / security ---
    JWT_SECRET: Optional[str] = None
    UPLOAD_DIR: str = "./uploads"
    FRONTEND_URL: Optional[str] = None
    NODE_ENV: Optional[str] = None
    PORT: int = 4001

    # SameSite attribute for the refresh-token/CSRF cookies (app/routers/auth.py,
    # app/security/csrf.py). Defaults to "strict", which only works when the
    # frontend and backend share a registrable domain (see DEPLOYMENT.md §4).
    # When they're on unrelated hosts/domains, browsers never send a
    # SameSite=Strict cookie cross-site — login appears to succeed but the
    # session cookie never gets sent back, so a page refresh (or /auth/refresh)
    # silently logs the user out. Set to "none" in that topology — it requires
    # secure=True (i.e. NODE_ENV=production and HTTPS) or browsers reject the
    # cookie outright.
    COOKIE_SAMESITE: str = "strict"

    # --- One-time admin seed (TODO(phase N): seed script equivalent) ---
    ADMIN_USER: Optional[str] = None
    ADMIN_EMAIL: Optional[str] = None
    ADMIN_PASSWORD_HASH: Optional[str] = None

    @property
    def is_production(self) -> bool:
        return self.NODE_ENV == "production"

    def require_jwt_secret(self) -> str:
        """Equivalent of `requireEnv("JWT_SECRET")` — fails loudly at first use
        rather than silently signing/verifying with an empty/`None` secret."""
        if not self.JWT_SECRET:
            raise RuntimeError("JWT_SECRET is not configured")
        return self.JWT_SECRET


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
