"""Tests for the project-codes admin CRUD (`app/routers/admin.py`) and the
open-only listing router (`app/routers/project_codes.py`)."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from tests.admin.conftest import auth_headers, make_user


def _unique_code() -> str:
    return f"PYTEST-{uuid.uuid4().hex[:10]}"


class TestAdminProjectCodeCrud:
    def test_non_admin_forbidden(self, client: TestClient, standard_headers: dict):
        resp = client.get("/api/v1/admin/project-codes", headers=standard_headers)
        assert resp.status_code == 403

    def test_create_and_list(self, client: TestClient, admin_headers: dict):
        code = _unique_code()
        create_resp = client.post("/api/v1/admin/project-codes", json={"code": code}, headers=admin_headers)
        assert create_resp.status_code == 201
        body = create_resp.json()
        assert body["code"] == code
        assert body["isOpen"] is True
        assert body["isLocked"] is False

        list_resp = client.get("/api/v1/admin/project-codes", headers=admin_headers)
        assert list_resp.status_code == 200
        assert any(c["id"] == body["id"] for c in list_resp.json())

    def test_create_duplicate_code_case_insensitive_conflicts(self, client: TestClient, admin_headers: dict):
        code = _unique_code()
        client.post("/api/v1/admin/project-codes", json={"code": code}, headers=admin_headers)
        resp = client.post("/api/v1/admin/project-codes", json={"code": code.lower()}, headers=admin_headers)
        assert resp.status_code == 409

    def test_create_with_date_range(self, client: TestClient, admin_headers: dict):
        code = _unique_code()
        resp = client.post(
            "/api/v1/admin/project-codes",
            json={"code": code, "startDate": "2026-01-01", "endDate": "2026-02-01", "cutoffDate": "2026-01-25"},
            headers=admin_headers,
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["startDate"] == "2026-01-01"
        assert body["endDate"] == "2026-02-01"
        assert body["cutoffDate"] == "2026-01-25"

    def test_create_rejects_malformed_date(self, client: TestClient, admin_headers: dict):
        resp = client.post(
            "/api/v1/admin/project-codes", json={"code": _unique_code(), "startDate": "01/01/2026"}, headers=admin_headers
        )
        assert resp.status_code == 400

    def test_patch_unknown_id_returns_404(self, client: TestClient, admin_headers: dict):
        resp = client.patch(
            "/api/v1/admin/project-codes/00000000-0000-0000-0000-000000000000",
            json={"isOpen": False},
            headers=admin_headers,
        )
        assert resp.status_code == 404

    def test_patch_toggle_open_and_locked_independently(self, client: TestClient, admin_headers: dict):
        created = client.post("/api/v1/admin/project-codes", json={"code": _unique_code()}, headers=admin_headers).json()

        closed = client.patch(f"/api/v1/admin/project-codes/{created['id']}", json={"isOpen": False}, headers=admin_headers)
        assert closed.status_code == 200
        assert closed.json()["isOpen"] is False
        assert closed.json()["isLocked"] is False

        locked = client.patch(f"/api/v1/admin/project-codes/{created['id']}", json={"isLocked": True}, headers=admin_headers)
        assert locked.status_code == 200
        assert locked.json()["isLocked"] is True
        # isOpen from the previous PATCH should be untouched by this one.
        assert locked.json()["isOpen"] is False

    def test_patch_rename_rejects_duplicate(self, client: TestClient, admin_headers: dict):
        code_a = _unique_code()
        code_b = _unique_code()
        a = client.post("/api/v1/admin/project-codes", json={"code": code_a}, headers=admin_headers).json()
        client.post("/api/v1/admin/project-codes", json={"code": code_b}, headers=admin_headers)

        resp = client.patch(f"/api/v1/admin/project-codes/{a['id']}", json={"code": code_b}, headers=admin_headers)
        assert resp.status_code == 409

    def test_patch_date_range_clears_with_explicit_null(self, client: TestClient, admin_headers: dict):
        created = client.post(
            "/api/v1/admin/project-codes",
            json={"code": _unique_code(), "startDate": "2026-01-01"},
            headers=admin_headers,
        ).json()
        resp = client.patch(f"/api/v1/admin/project-codes/{created['id']}", json={"startDate": None}, headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["startDate"] is None


class TestPublicProjectCodeListing:
    def test_open_codes_excludes_closed(self, client: TestClient, admin_headers: dict, standard_headers: dict):
        open_code = _unique_code()
        closed_code = _unique_code()
        client.post("/api/v1/admin/project-codes", json={"code": open_code}, headers=admin_headers)
        created_closed = client.post("/api/v1/admin/project-codes", json={"code": closed_code}, headers=admin_headers).json()
        client.patch(f"/api/v1/admin/project-codes/{created_closed['id']}", json={"isOpen": False}, headers=admin_headers)

        resp = client.get("/api/v1/project-codes/", headers=standard_headers)
        assert resp.status_code == 200
        codes = {c["code"] for c in resp.json()}
        assert open_code in codes
        assert closed_code not in codes

    def test_locked_code_excluded_for_standard_but_visible_to_admin(
        self, client: TestClient, admin_headers: dict, standard_headers: dict
    ):
        code = _unique_code()
        created = client.post("/api/v1/admin/project-codes", json={"code": code}, headers=admin_headers).json()
        client.patch(f"/api/v1/admin/project-codes/{created['id']}", json={"isLocked": True}, headers=admin_headers)

        standard_resp = client.get("/api/v1/project-codes/", headers=standard_headers)
        assert code not in {c["code"] for c in standard_resp.json()}

        admin_resp = client.get("/api/v1/project-codes/", headers=admin_headers)
        assert code in {c["code"] for c in admin_resp.json()}

    def test_requires_auth(self, client: TestClient):
        resp = client.get("/api/v1/project-codes/")
        assert resp.status_code == 401
