"""Shared fixtures for `tests/admin/` — mints access tokens directly (via
`issue_access_token`) rather than going through `POST /api/v1/auth/login`,
since these tests are about the admin-config surface, not login itself
(`tests/test_auth.py` already covers that path)."""

from __future__ import annotations

import uuid
from typing import Optional

import pytest
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.security.passwords import hash_password
from app.services.auth_service import issue_access_token


def make_user(
    db_session: Session,
    role: UserRole = "standard",
    subsidiary_id: Optional[str] = None,
    is_active: bool = True,
) -> User:
    user = User(
        username=f"pytest_{role}_{uuid.uuid4().hex[:10]}",
        email=f"pytest_{role}_{uuid.uuid4().hex[:10]}@example.com",
        passwordHash=hash_password("correct horse battery staple"),
        role=role,
        subsidiaryId=subsidiary_id,
        isActive=is_active,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def auth_headers(user: User) -> dict:
    return {"Authorization": f"Bearer {issue_access_token(user)}"}


@pytest.fixture()
def admin_user(db_session: Session) -> User:
    return make_user(db_session, role="admin")


@pytest.fixture()
def superadmin_user(db_session: Session) -> User:
    return make_user(db_session, role="superadmin")


@pytest.fixture()
def standard_user(db_session: Session) -> User:
    return make_user(db_session, role="standard", subsidiary_id="Acme Co")


@pytest.fixture()
def admin_headers(admin_user: User) -> dict:
    return auth_headers(admin_user)


@pytest.fixture()
def superadmin_headers(superadmin_user: User) -> dict:
    return auth_headers(superadmin_user)


@pytest.fixture()
def standard_headers(standard_user: User) -> dict:
    return auth_headers(standard_user)
