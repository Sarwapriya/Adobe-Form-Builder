"""Shared fixtures for `tests/form_builder/` — a real, active `Subsidiary`
row plus scoped `standard` users, an admin, and an open `ProjectCode`, all
needed because `form_builder_service.create_form`/`approve_adhoc_form` call
the real `assert_subsidiary_active`/`assert_project_code_open`/
`assert_not_blocked` governance gates ported in the phase-3 admin-config
services — a form can't be created against a subsidiary name that doesn't
exist as an active row, unlike `tests/admin/conftest.py`'s `standard_user`
fixture (which hardcodes subsidiaryId="Acme Co" purely as a string, with no
backing `Subsidiary` row, since the admin-config tests never exercise those
governance gates).
"""

from __future__ import annotations

import uuid
from typing import Optional

import pytest
from sqlalchemy.orm import Session

from app.form_pipeline import default_builder_config
from app.models.project_code import ProjectCode
from app.models.subsidiary import Subsidiary
from app.models.user import User, UserRole
from tests.admin.conftest import auth_headers, make_user
from tests.form_pipeline.fixtures import sample_form_definition

__all__ = ["auth_headers", "make_user"]


def unique_name(prefix: str = "PYTEST") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


@pytest.fixture()
def subsidiary_row(db_session: Session) -> Subsidiary:
    sub = Subsidiary(name=unique_name("Sub"), isActive=True)
    db_session.add(sub)
    db_session.commit()
    db_session.refresh(sub)
    return sub


@pytest.fixture()
def other_subsidiary_row(db_session: Session) -> Subsidiary:
    sub = Subsidiary(name=unique_name("OtherSub"), isActive=True)
    db_session.add(sub)
    db_session.commit()
    db_session.refresh(sub)
    return sub


@pytest.fixture()
def project_code_row(db_session: Session) -> ProjectCode:
    pc = ProjectCode(code=unique_name("PC"), isOpen=True, isLocked=False)
    db_session.add(pc)
    db_session.commit()
    db_session.refresh(pc)
    return pc


@pytest.fixture()
def admin_user(db_session: Session) -> User:
    return make_user(db_session, role="admin")


@pytest.fixture()
def admin_headers(admin_user: User) -> dict:
    return auth_headers(admin_user)


@pytest.fixture()
def standard_user(db_session: Session, subsidiary_row: Subsidiary) -> User:
    return make_user(db_session, role="standard", subsidiary_id=subsidiary_row.name)


@pytest.fixture()
def standard_headers(standard_user: User) -> dict:
    return auth_headers(standard_user)


@pytest.fixture()
def other_standard_user(db_session: Session, other_subsidiary_row: Subsidiary) -> User:
    return make_user(db_session, role="standard", subsidiary_id=other_subsidiary_row.name)


@pytest.fixture()
def other_standard_headers(other_standard_user: User) -> dict:
    return auth_headers(other_standard_user)


def make_standard_user(db_session: Session, subsidiary_name: str) -> User:
    return make_user(db_session, role="standard", subsidiary_id=subsidiary_name)


def sample_definition_json(subsidiary_name: str) -> dict:
    """A fully-specified, publish-ready `FormDefinition` (see
    `tests/form_pipeline/fixtures.sample_form_definition`), re-pointed at
    `subsidiary_name`, serialized to the plain JSON dict shape the API's
    `PATCH .../draft` body expects."""
    definition = sample_form_definition()
    definition.meta.subsidiary = subsidiary_name
    return definition.model_dump(mode="json")


def sample_config_json(variants: Optional[list[str]] = None) -> dict:
    config = default_builder_config()
    if variants is not None:
        config.variants = variants
    return config.model_dump(mode="json")


def create_and_publish_admin_form(
    client,
    admin_headers: dict,
    subsidiary_name: str,
    project_code: Optional[str] = None,
    variants: Optional[list[str]] = None,
) -> str:
    """Test helper: creates a blank admin form, fills its draft with a
    publish-ready definition, publishes it, and returns the new form's id."""
    body: dict = {"name": unique_name("Form"), "subsidiaryId": subsidiary_name}
    if project_code:
        body["projectCode"] = project_code
    create_resp = client.post("/api/v1/admin/forms/", json=body, headers=admin_headers)
    assert create_resp.status_code == 201, create_resp.text
    form_id = create_resp.json()["id"]

    draft_resp = client.patch(
        f"/api/v1/admin/forms/{form_id}/draft",
        json={"definition": sample_definition_json(subsidiary_name), "config": sample_config_json(variants or ["ff", "oc"])},
        headers=admin_headers,
    )
    assert draft_resp.status_code == 204, draft_resp.text

    publish_resp = client.post(f"/api/v1/admin/forms/{form_id}/publish", headers=admin_headers)
    assert publish_resp.status_code == 200, publish_resp.text

    return form_id
