"""SQLAlchemy engine/session setup.

Mirrors `backend/src/config/data-source.ts`'s two connection paths:

1. Normal path — `SQL_CONNECTION_STRING` (an `mssql://user:pass@host:port/db`
   URL, TypeORM/`mssql`-driver style) is parsed and translated into a
   `mssql+pyodbc://` SQLAlchemy URL using "ODBC Driver 17 for SQL Server",
   with `Encrypt=yes` always and `TrustServerCertificate` gated by
   `SQL_TRUST_SERVER_CERTIFICATE` — same semantics as the TS `options.encrypt`/
   `options.trustServerCertificate`.

2. Trusted-connection path (`SQL_TRUSTED_CONNECTION=true`) — a Windows-login
   ODBC connection built from `SQL_SERVER`/`SQL_INSTANCE`/`SQL_DATABASE`,
   equivalent to the raw ODBC connection string the TS side hands to
   `mssql/msnodesqlv8` via `extra.connectionString`.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Generator
from urllib.parse import unquote, urlparse

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine, URL
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

ODBC_DRIVER = "ODBC Driver 17 for SQL Server"


def _build_trusted_connection_url() -> URL:
    server = settings.SQL_SERVER or "localhost"
    instance = settings.SQL_INSTANCE
    database = settings.SQL_DATABASE
    server_segment = f"{server}\\{instance}" if instance else server

    odbc_connect = (
        f"Driver={{{ODBC_DRIVER}}};"
        f"Server={server_segment};"
        f"Database={database};"
        "Trusted_Connection=Yes;"
        "Encrypt=yes;"
        "TrustServerCertificate=yes;"
    )
    return URL.create("mssql+pyodbc", query={"odbc_connect": odbc_connect})


def _build_sql_connection_string_url() -> URL:
    raw = settings.SQL_CONNECTION_STRING
    if not raw:
        raise RuntimeError("SQL_CONNECTION_STRING is not configured")

    # mssql://user:password@host:port/database — the same URL shape TypeORM's
    # mssql driver accepts via `url:`.
    parsed = urlparse(raw)
    username = unquote(parsed.username) if parsed.username else None
    password = unquote(parsed.password) if parsed.password else None
    host = parsed.hostname or "localhost"
    port = parsed.port or 1433
    database = parsed.path.lstrip("/") if parsed.path else None

    trust_cert = "yes" if settings.SQL_TRUST_SERVER_CERTIFICATE else "no"

    return URL.create(
        "mssql+pyodbc",
        username=username,
        password=password,
        host=host,
        port=port,
        database=database,
        query={
            "driver": ODBC_DRIVER,
            "Encrypt": "yes",
            "TrustServerCertificate": trust_cert,
        },
    )


def build_database_url() -> URL:
    if settings.SQL_TRUSTED_CONNECTION:
        return _build_trusted_connection_url()
    return _build_sql_connection_string_url()


@lru_cache
def get_engine() -> Engine:
    """Lazily builds the SQLAlchemy engine on first use, not at import time.

    Mirrors the Node side: `AppDataSource` is only actually `.initialize()`d
    from `src/index.ts`'s startup routine, never merely by importing
    `app.ts`/`data-source.ts` — so importing this module (or `app.main`) never
    requires SQL_CONNECTION_STRING/SQL_* env vars to be present, only actually
    querying the database does. `pool_pre_ping` guards against stale/dropped
    connections in a long-lived process, matching the resilience TypeORM's
    own connection pool gives you for free.
    """
    return create_engine(build_database_url(), pool_pre_ping=True, future=True)


@lru_cache
def get_sessionmaker() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), autoflush=False, autocommit=False, future=True)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding one SQLAlchemy session per request."""
    db = get_sessionmaker()()
    try:
        yield db
    finally:
        db.close()
