"""Tests for `/api/v1/admin/users` — CRUD plus the inline authorization
rules re-checked against `backend/src/routes/admin.router.ts`:

- A plain "admin" may only provision/enable-disable a "standard" account;
  only a "superadmin" may provision/toggle another "admin"/"superadmin".
- Nobody may disable their own account.
- Profile edits (`PATCH .../profile`) apply the same split twice: against
  the target's *current* role and the *requested* role.
- Notification-email edits are looser: a plain admin may manage their own,
  any other admin's, or any standard user's — but not a superadmin's.
"""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.admin.conftest import make_user


def _unique_username() -> str:
    return f"pytest_new_{uuid.uuid4().hex[:10]}"


def _create_user_body(role: str = "standard", subsidiary_id: str | None = "Some Sub") -> dict:
    body = {
        "username": _unique_username(),
        "email": f"{uuid.uuid4().hex[:10]}@example.com",
        "password": "correct horse battery staple",
        "role": role,
    }
    if subsidiary_id is not None:
        body["subsidiaryId"] = subsidiary_id
    return body


class TestCreateUser:
    """Every case here calls `POST /api/v1/admin/users`, which now hashes
    and encrypts the new user's email via DKMS (see
    `auth_service.create_user`) — genuinely needs a reachable DKMS, unlike
    most of this module's other tests (see the `dkms_available`-gated case
    in `TestUpdateUserProfile` below for why the rest don't)."""

    @pytest.fixture(autouse=True)
    def _require_dkms(self, dkms_available: bool):
        if not dkms_available:
            pytest.skip("DKMS not reachable — set DKMS_BASE_URL/DKMS_TASK_ID to run this test")

    def test_non_admin_forbidden(self, client: TestClient, standard_headers: dict):
        resp = client.post("/api/v1/admin/users", json=_create_user_body(), headers=standard_headers)
        assert resp.status_code == 403

    def test_admin_can_create_standard(self, client: TestClient, admin_headers: dict):
        resp = client.post("/api/v1/admin/users", json=_create_user_body(role="standard"), headers=admin_headers)
        assert resp.status_code == 201
        assert resp.json()["role"] == "standard"

    def test_admin_cannot_create_admin(self, client: TestClient, admin_headers: dict):
        resp = client.post(
            "/api/v1/admin/users", json=_create_user_body(role="admin", subsidiary_id=None), headers=admin_headers
        )
        assert resp.status_code == 403

    def test_superadmin_can_create_admin(self, client: TestClient, superadmin_headers: dict):
        resp = client.post(
            "/api/v1/admin/users", json=_create_user_body(role="admin", subsidiary_id=None), headers=superadmin_headers
        )
        assert resp.status_code == 201
        assert resp.json()["role"] == "admin"

    def test_standard_without_subsidiary_rejected(self, client: TestClient, admin_headers: dict):
        resp = client.post(
            "/api/v1/admin/users", json=_create_user_body(role="standard", subsidiary_id=None), headers=admin_headers
        )
        assert resp.status_code == 400

    def test_duplicate_username_conflicts(self, client: TestClient, admin_headers: dict):
        body = _create_user_body()
        first = client.post("/api/v1/admin/users", json=body, headers=admin_headers)
        assert first.status_code == 201
        dup_body = {**body, "email": f"{uuid.uuid4().hex[:10]}@example.com"}
        second = client.post("/api/v1/admin/users", json=dup_body, headers=admin_headers)
        assert second.status_code == 409


class TestSetUserActive:
    def test_cannot_disable_own_account(self, client: TestClient, admin_headers: dict, admin_user):
        resp = client.patch(f"/api/v1/admin/users/{admin_user.id}", json={"isActive": False}, headers=admin_headers)
        assert resp.status_code == 403

    def test_admin_can_disable_standard(self, client: TestClient, admin_headers: dict, db_session: Session):
        target = make_user(db_session, role="standard", subsidiary_id="Sub")
        resp = client.patch(f"/api/v1/admin/users/{target.id}", json={"isActive": False}, headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["isActive"] is False

    def test_admin_cannot_disable_another_admin(self, client: TestClient, admin_headers: dict, db_session: Session):
        target = make_user(db_session, role="admin")
        resp = client.patch(f"/api/v1/admin/users/{target.id}", json={"isActive": False}, headers=admin_headers)
        assert resp.status_code == 403

    def test_superadmin_can_disable_admin(self, client: TestClient, superadmin_headers: dict, db_session: Session):
        target = make_user(db_session, role="admin")
        resp = client.patch(f"/api/v1/admin/users/{target.id}", json={"isActive": False}, headers=superadmin_headers)
        assert resp.status_code == 200
        assert resp.json()["isActive"] is False

    def test_unknown_user_404(self, client: TestClient, admin_headers: dict):
        resp = client.patch(
            "/api/v1/admin/users/00000000-0000-0000-0000-000000000000", json={"isActive": False}, headers=admin_headers
        )
        assert resp.status_code == 404


class TestDeleteUser:
    def test_cannot_delete_own_account(self, client: TestClient, admin_headers: dict, admin_user):
        resp = client.delete(f"/api/v1/admin/users/{admin_user.id}", headers=admin_headers)
        assert resp.status_code == 403

    def test_admin_can_delete_standard_with_no_records(
        self, client: TestClient, admin_headers: dict, db_session: Session
    ):
        target = make_user(db_session, role="standard", subsidiary_id="Sub")
        resp = client.delete(f"/api/v1/admin/users/{target.id}", headers=admin_headers)
        assert resp.status_code == 204

        # actually gone, not just deactivated
        follow_up = client.patch(f"/api/v1/admin/users/{target.id}", json={"isActive": False}, headers=admin_headers)
        assert follow_up.status_code == 404

    def test_admin_cannot_delete_another_admin(self, client: TestClient, admin_headers: dict, db_session: Session):
        target = make_user(db_session, role="admin")
        resp = client.delete(f"/api/v1/admin/users/{target.id}", headers=admin_headers)
        assert resp.status_code == 403

    def test_superadmin_can_delete_admin(self, client: TestClient, superadmin_headers: dict, db_session: Session):
        target = make_user(db_session, role="admin")
        resp = client.delete(f"/api/v1/admin/users/{target.id}", headers=superadmin_headers)
        assert resp.status_code == 204

    def test_unknown_user_404(self, client: TestClient, admin_headers: dict):
        resp = client.delete("/api/v1/admin/users/00000000-0000-0000-0000-000000000000", headers=admin_headers)
        assert resp.status_code == 404

    def test_user_with_a_created_form_cannot_be_deleted(
        self, client: TestClient, admin_headers: dict, db_session: Session
    ):
        from app.models.form import Form

        target = make_user(db_session, role="standard", subsidiary_id="Sub")
        db_session.add(Form(name="Some Campaign", subsidiaryId="Sub", createdByUserId=target.id))
        db_session.commit()

        resp = client.delete(f"/api/v1/admin/users/{target.id}", headers=admin_headers)
        assert resp.status_code == 409
        assert "deactivate" in resp.json()["error"].lower()

        # still there, and can still be deactivated instead
        follow_up = client.patch(f"/api/v1/admin/users/{target.id}", json={"isActive": False}, headers=admin_headers)
        assert follow_up.status_code == 200
        assert follow_up.json()["isActive"] is False


class TestUpdateUserProfile:
    def test_admin_can_edit_standard_profile(
        self, client: TestClient, admin_headers: dict, db_session: Session, dkms_available: bool
    ):
        if not dkms_available:
            pytest.skip("DKMS not reachable — set DKMS_BASE_URL/DKMS_TASK_ID to run this test")
        # A real DKMS encrypt-then-decrypt round trip: this route encrypts
        # "Ada" via DKMS before storing it, then `_serialize_user_full`
        # decrypts it again for the response — see auth_service.update_user.
        target = make_user(db_session, role="standard", subsidiary_id="Sub")
        resp = client.patch(
            f"/api/v1/admin/users/{target.id}/profile", json={"firstName": "Ada"}, headers=admin_headers
        )
        assert resp.status_code == 200
        assert resp.json()["firstName"] == "Ada"

    def test_admin_cannot_edit_another_admin_profile(self, client: TestClient, admin_headers: dict, db_session: Session):
        target = make_user(db_session, role="admin")
        resp = client.patch(
            f"/api/v1/admin/users/{target.id}/profile", json={"firstName": "Ada"}, headers=admin_headers
        )
        assert resp.status_code == 403

    def test_admin_cannot_grant_admin_role_via_profile(self, client: TestClient, admin_headers: dict, db_session: Session):
        target = make_user(db_session, role="standard", subsidiary_id="Sub")
        resp = client.patch(
            f"/api/v1/admin/users/{target.id}/profile", json={"role": "admin"}, headers=admin_headers
        )
        assert resp.status_code == 403

    def test_superadmin_can_grant_admin_role(self, client: TestClient, superadmin_headers: dict, db_session: Session):
        target = make_user(db_session, role="standard", subsidiary_id="Sub")
        resp = client.patch(
            f"/api/v1/admin/users/{target.id}/profile", json={"role": "admin"}, headers=superadmin_headers
        )
        assert resp.status_code == 200
        assert resp.json()["role"] == "admin"

    def test_clearing_subsidiary_on_standard_user_rejected(
        self, client: TestClient, admin_headers: dict, db_session: Session
    ):
        target = make_user(db_session, role="standard", subsidiary_id="Sub")
        resp = client.patch(
            f"/api/v1/admin/users/{target.id}/profile", json={"subsidiaryId": None}, headers=admin_headers
        )
        assert resp.status_code == 400


class TestUpdateUserNotificationEmail:
    def test_self_can_update_own(self, client: TestClient, admin_user, admin_headers: dict):
        resp = client.patch(
            f"/api/v1/admin/users/{admin_user.id}/notification-email",
            json={"notificationEmail": "self@example.com"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["notificationEmail"] == "self@example.com"

    def test_admin_can_update_standard_users_email(self, client: TestClient, admin_headers: dict, db_session: Session):
        target = make_user(db_session, role="standard", subsidiary_id="Sub")
        resp = client.patch(
            f"/api/v1/admin/users/{target.id}/notification-email",
            json={"notificationEmail": "target@example.com"},
            headers=admin_headers,
        )
        assert resp.status_code == 200

    def test_admin_cannot_update_superadmins_email(self, client: TestClient, admin_headers: dict, db_session: Session):
        target = make_user(db_session, role="superadmin")
        resp = client.patch(
            f"/api/v1/admin/users/{target.id}/notification-email",
            json={"notificationEmail": "target@example.com"},
            headers=admin_headers,
        )
        assert resp.status_code == 403

    def test_superadmin_can_update_anyones_email(self, client: TestClient, superadmin_headers: dict, db_session: Session):
        target = make_user(db_session, role="admin")
        resp = client.patch(
            f"/api/v1/admin/users/{target.id}/notification-email",
            json={"notificationEmail": "target@example.com"},
            headers=superadmin_headers,
        )
        assert resp.status_code == 200

    def test_empty_string_clears_email(self, client: TestClient, admin_headers: dict, db_session: Session):
        target = make_user(db_session, role="standard", subsidiary_id="Sub")
        client.patch(
            f"/api/v1/admin/users/{target.id}/notification-email",
            json={"notificationEmail": "target@example.com"},
            headers=admin_headers,
        )
        resp = client.patch(
            f"/api/v1/admin/users/{target.id}/notification-email", json={"notificationEmail": ""}, headers=admin_headers
        )
        assert resp.status_code == 200
        assert resp.json()["notificationEmail"] is None


class TestListUsers:
    def test_list_never_includes_password_hash(self, client: TestClient, admin_headers: dict, db_session: Session):
        make_user(db_session, role="standard", subsidiary_id="Sub")
        resp = client.get("/api/v1/admin/users", headers=admin_headers)
        assert resp.status_code == 200
        assert all("passwordHash" not in u for u in resp.json())
