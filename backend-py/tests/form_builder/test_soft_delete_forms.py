"""Deleting a form (admin, HR or ad-hoc) is a soft delete: the row and its versions
stay in the database, flagged `isDeleted`, and vanish from every list."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.subsidiary import Subsidiary
from tests.form_builder.conftest import unique_name


def _create(client: TestClient, headers: dict, sub: str, **extra) -> dict:
    resp = client.post("/api/v1/admin/forms", json={"name": unique_name("Form"), "subsidiaryId": sub, **extra}, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


def _listed_ids(client: TestClient, headers: dict, sub: str) -> set[str]:
    resp = client.get(f"/api/v1/admin/forms?subsidiaryId={sub}", headers=headers)
    assert resp.status_code == 200, resp.text
    return {f["id"] for f in resp.json()["items"]}


class TestSoftDeleteForm:
    def test_a_never_published_form_is_flagged_not_removed(
        self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary, db_session: Session
    ):
        created = _create(client, admin_headers, subsidiary_row.name)
        assert created["id"] in _listed_ids(client, admin_headers, subsidiary_row.name)

        resp = client.delete(f"/api/v1/admin/forms/{created['id']}", headers=admin_headers)
        assert resp.status_code == 204

        assert created["id"] not in _listed_ids(client, admin_headers, subsidiary_row.name)
        assert client.get(f"/api/v1/admin/forms/{created['id']}", headers=admin_headers).status_code == 404

        db_session.expire_all()
        row = db_session.get(Form, created["id"])
        assert row is not None, "the form row must still exist"
        assert row.isDeleted is True
        versions = db_session.execute(select(func.count()).select_from(FormVersion).where(FormVersion.formId == created["id"])).scalar_one()
        assert versions >= 1, "its draft version must be kept too"

    def test_deleting_twice_or_an_unknown_form_is_a_404(self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary):
        created = _create(client, admin_headers, subsidiary_row.name, origin="adhoc")
        assert client.delete(f"/api/v1/admin/forms/{created['id']}", headers=admin_headers).status_code == 204
        assert client.delete(f"/api/v1/admin/forms/{created['id']}", headers=admin_headers).status_code == 404
        assert client.delete("/api/v1/admin/forms/00000000-0000-0000-0000-000000000000", headers=admin_headers).status_code == 404

    def test_a_subsidiary_user_deleting_their_own_adhoc_draft_is_soft_too(
        self, client: TestClient, admin_headers: dict, standard_headers: dict, subsidiary_row: Subsidiary, db_session: Session
    ):
        created = _create(client, admin_headers, subsidiary_row.name, origin="adhoc")
        resp = client.delete(f"/api/v1/forms/adhoc/{created['id']}", headers=standard_headers)
        assert resp.status_code == 204, resp.text

        db_session.expire_all()
        row = db_session.get(Form, created["id"])
        assert row is not None and row.isDeleted is True
        listed = client.get("/api/v1/forms/adhoc", headers=standard_headers).json()
        assert created["id"] not in {f["id"] for f in listed}
