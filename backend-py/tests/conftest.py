"""Shared pytest fixtures for `backend-py/tests/`.

These tests need a REAL, reachable SQL Server instance — `uniqueidentifier`/
`datetimeoffset` columns don't translate to SQLite, so there is deliberately
no in-memory fallback here (same constraint the Node backend's own
`backend/tests/` accepts). Point `SQL_CONNECTION_STRING` (or the
`SQL_TRUSTED_CONNECTION=true` variables) at a real dev/test database before
running `pytest` — every test in this suite is skipped with a clear reason
if no database is reachable, rather than failing confusingly on a connection
error deep in SQLAlchemy.

Each test runs inside its own transaction that's rolled back afterwards, so
the suite never leaves rows behind in a shared database.
"""

from __future__ import annotations

import socket
import uuid
from typing import Generator
from urllib.parse import urlparse

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db, get_engine
from app.main import app
from app.middleware.rate_limit import limiter
from app.models import Base, User
from app.security.passwords import hash_password


def _database_reachable() -> bool:
    try:
        engine = get_engine()
        with engine.connect():
            return True
    except SQLAlchemyError:
        return False
    except Exception:
        return False


@pytest.fixture(scope="session")
def database_available() -> bool:
    return _database_reachable()


def _dkms_reachable() -> bool:
    """A plain TCP-connect probe (not a real request to any of the three
    DKMS endpoints) — mirrors `_database_reachable`'s "can we even reach
    it" check, kept short-timeout so an unreachable DKMS doesn't slow down
    every test run that collects this fixture."""
    if not settings.DKMS_BASE_URL:
        return False
    parsed = urlparse(settings.DKMS_BASE_URL)
    if not parsed.hostname:
        return False
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    try:
        with socket.create_connection((parsed.hostname, port), timeout=3):
            return True
    except OSError:
        return False


@pytest.fixture(scope="session")
def dkms_available() -> bool:
    return _dkms_reachable()


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    """Each test's several login/refresh calls would otherwise share one
    process-wide rate-limit counter (`slowapi`'s in-memory storage, keyed by
    the TestClient's fixed fake IP) and blow through the real 10-per-15-min
    `AUTH_RATE_LIMIT` within a handful of tests — reset it before every test
    so each one starts with a clean quota, matching how the limit behaves
    against real, distinct client IPs in production."""
    limiter.reset()
    yield


@pytest.fixture()
def db_session(database_available: bool) -> Generator[Session, None, None]:
    if not database_available:
        pytest.skip(
            "No reachable SQL Server test database — set SQL_CONNECTION_STRING "
            "(or SQL_TRUSTED_CONNECTION=true + SQL_SERVER/SQL_INSTANCE/SQL_DATABASE) "
            "in backend-py/.env to run this suite."
        )

    engine = get_engine()
    # Ensure every table exists (a fresh test DB might not have run the
    # Node-side migrations / backend/sql/init.sql) — safe/idempotent, only
    # creates tables that are missing.
    Base.metadata.create_all(engine, checkfirst=True)

    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    def _override_get_db():
        yield session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        yield session
    finally:
        app.dependency_overrides.pop(get_db, None)
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session: Session) -> TestClient:
    return TestClient(app)


@pytest.fixture()
def active_user(db_session: Session):
    user = User(
        username=f"pytest_{uuid.uuid4().hex[:12]}",
        email=f"pytest_{uuid.uuid4().hex[:12]}@example.com",
        passwordHash=hash_password("correct horse battery staple"),
        role="standard",
        isActive=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def inactive_user(db_session: Session):
    user = User(
        username=f"pytest_inactive_{uuid.uuid4().hex[:12]}",
        email=f"pytest_inactive_{uuid.uuid4().hex[:12]}@example.com",
        passwordHash=hash_password("correct horse battery staple"),
        role="standard",
        isActive=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user
