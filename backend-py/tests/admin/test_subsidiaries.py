"""Tests for subsidiary admin CRUD (`app/routers/admin.py`) and the
authenticated-user-facing subsidiary router (`app/routers/subsidiaries.py`).

Covers the cascade behavior verified against the real
`backend/src/services/subsidiaryService.ts` source: `set_subsidiary_active`
(PATCH .../subsidiaries/:id with isActive) does NOT cascade to that
subsidiary's users — only `delete_subsidiary` (disables) and
`create_subsidiary` (re-enables, for a name that already has users) do.
"""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.admin.conftest import auth_headers, make_user


def _unique_name() -> str:
    return f"Pytest Sub {uuid.uuid4().hex[:10]}"


class TestSubsidiaryCrud:
    def test_non_admin_forbidden(self, client: TestClient, standard_headers: dict):
        resp = client.get("/api/v1/admin/subsidiaries", headers=standard_headers)
        assert resp.status_code == 403

    def test_create_and_list(self, client: TestClient, admin_headers: dict):
        name = _unique_name()
        created = client.post("/api/v1/admin/subsidiaries", json={"name": name}, headers=admin_headers)
        assert created.status_code == 201
        assert created.json()["isActive"] is True

        listed = client.get("/api/v1/admin/subsidiaries", headers=admin_headers)
        assert any(s["id"] == created.json()["id"] for s in listed.json())

    def test_create_duplicate_case_insensitive_conflicts(self, client: TestClient, admin_headers: dict):
        name = _unique_name()
        client.post("/api/v1/admin/subsidiaries", json={"name": name}, headers=admin_headers)
        resp = client.post("/api/v1/admin/subsidiaries", json={"name": name.upper()}, headers=admin_headers)
        assert resp.status_code == 409

    def test_active_listing_excludes_inactive(self, client: TestClient, admin_headers: dict, standard_headers: dict):
        name = _unique_name()
        created = client.post("/api/v1/admin/subsidiaries", json={"name": name}, headers=admin_headers).json()
        client.patch(f"/api/v1/admin/subsidiaries/{created['id']}", json={"isActive": False}, headers=admin_headers)

        resp = client.get("/api/v1/subsidiaries/", headers=standard_headers)
        assert name not in {s["name"] for s in resp.json()}

    def test_set_active_false_does_not_disable_users(
        self, client: TestClient, admin_headers: dict, db_session: Session
    ):
        name = _unique_name()
        created = client.post("/api/v1/admin/subsidiaries", json={"name": name}, headers=admin_headers).json()
        scoped_user = make_user(db_session, role="standard", subsidiary_id=name, is_active=True)

        resp = client.patch(f"/api/v1/admin/subsidiaries/{created['id']}", json={"isActive": False}, headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["isActive"] is False

        db_session.refresh(scoped_user)
        assert scoped_user.isActive is True, "setSubsidiaryActive must not cascade to Users (verified against TS source)"

    def test_delete_cascades_disable_users_and_re_create_reenables(
        self, client: TestClient, admin_headers: dict, db_session: Session
    ):
        name = _unique_name()
        created = client.post("/api/v1/admin/subsidiaries", json={"name": name}, headers=admin_headers).json()
        scoped_user = make_user(db_session, role="standard", subsidiary_id=name, is_active=True)

        delete_resp = client.delete(f"/api/v1/admin/subsidiaries/{created['id']}", headers=admin_headers)
        assert delete_resp.status_code == 204

        db_session.refresh(scoped_user)
        assert scoped_user.isActive is False

        recreated = client.post("/api/v1/admin/subsidiaries", json={"name": name}, headers=admin_headers)
        assert recreated.status_code == 201

        db_session.refresh(scoped_user)
        assert scoped_user.isActive is True

    def test_delete_unknown_returns_404(self, client: TestClient, admin_headers: dict):
        resp = client.delete("/api/v1/admin/subsidiaries/00000000-0000-0000-0000-000000000000", headers=admin_headers)
        assert resp.status_code == 404

    def test_notification_emails_round_trip_and_empty_string_clears(self, client: TestClient, admin_headers: dict):
        created = client.post("/api/v1/admin/subsidiaries", json={"name": _unique_name()}, headers=admin_headers).json()

        set_resp = client.patch(
            f"/api/v1/admin/subsidiaries/{created['id']}",
            json={"notificationEmail1": "one@example.com", "notificationEmail2": "two@example.com"},
            headers=admin_headers,
        )
        assert set_resp.status_code == 200
        assert set_resp.json()["notificationEmail1"] == "one@example.com"
        assert set_resp.json()["notificationEmail2"] == "two@example.com"

        clear_resp = client.patch(
            f"/api/v1/admin/subsidiaries/{created['id']}", json={"notificationEmail1": ""}, headers=admin_headers
        )
        assert clear_resp.status_code == 200
        assert clear_resp.json()["notificationEmail1"] is None
        assert clear_resp.json()["notificationEmail2"] == "two@example.com"


class TestMySubsidiary:
    def test_not_scoped_returns_400(self, client: TestClient, admin_headers: dict):
        resp = client.get("/api/v1/subsidiaries/mine", headers=admin_headers)
        assert resp.status_code == 400

    def test_scoped_user_can_see_and_update_own_subsidiary(
        self, client: TestClient, admin_headers: dict, db_session: Session
    ):
        name = _unique_name()
        client.post("/api/v1/admin/subsidiaries", json={"name": name}, headers=admin_headers)
        scoped_user = make_user(db_session, role="standard", subsidiary_id=name)
        headers = auth_headers(scoped_user)

        mine = client.get("/api/v1/subsidiaries/mine", headers=headers)
        assert mine.status_code == 200
        assert mine.json()["name"] == name

        updated = client.patch(
            "/api/v1/subsidiaries/mine/notification-email", json={"notificationEmail1": "mine@example.com"}, headers=headers
        )
        assert updated.status_code == 200
        assert updated.json()["notificationEmail1"] == "mine@example.com"
