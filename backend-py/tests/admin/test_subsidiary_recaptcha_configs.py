"""Tests for the subsidiary -> Google reCAPTCHA site key reference table
(`app/services/subsidiary_recaptcha_config_service.py`, admin CRUD in
`app/routers/admin.py`, any-auth read in `app/routers/subsidiary_recaptcha_configs.py`)."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient


def _unique_subsidiary() -> str:
    return f"PYTEST-SUB-{uuid.uuid4().hex[:8]}"


class TestAdminCrud:
    def test_non_admin_forbidden(self, client: TestClient, standard_headers: dict):
        resp = client.get("/api/v1/admin/subsidiary-recaptcha-configs", headers=standard_headers)
        assert resp.status_code == 403

    def test_create_and_list(self, client: TestClient, admin_headers: dict):
        sub = _unique_subsidiary()
        resp = client.post(
            "/api/v1/admin/subsidiary-recaptcha-configs",
            json={"subsidiaryName": sub, "siteKey": "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"},
            headers=admin_headers,
        )
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["subsidiaryName"] == sub
        assert body["siteKey"] == "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"

        listed = client.get("/api/v1/admin/subsidiary-recaptcha-configs", headers=admin_headers).json()
        assert any(r["id"] == body["id"] for r in listed)

    def test_upsert_replaces_the_site_key_for_the_same_subsidiary(self, client: TestClient, admin_headers: dict):
        sub = _unique_subsidiary()
        first = client.post(
            "/api/v1/admin/subsidiary-recaptcha-configs",
            json={"subsidiaryName": sub, "siteKey": "first-key"},
            headers=admin_headers,
        ).json()
        second = client.post(
            "/api/v1/admin/subsidiary-recaptcha-configs",
            json={"subsidiaryName": sub, "siteKey": "second-key"},
            headers=admin_headers,
        ).json()
        assert second["id"] == first["id"]
        assert second["siteKey"] == "second-key"

    def test_rejects_blank_site_key(self, client: TestClient, admin_headers: dict):
        resp = client.post(
            "/api/v1/admin/subsidiary-recaptcha-configs",
            json={"subsidiaryName": _unique_subsidiary(), "siteKey": "   "},
            headers=admin_headers,
        )
        assert resp.status_code == 400

    def test_delete(self, client: TestClient, admin_headers: dict):
        created = client.post(
            "/api/v1/admin/subsidiary-recaptcha-configs",
            json={"subsidiaryName": _unique_subsidiary(), "siteKey": "a-site-key"},
            headers=admin_headers,
        ).json()
        resp = client.delete(f"/api/v1/admin/subsidiary-recaptcha-configs/{created['id']}", headers=admin_headers)
        assert resp.status_code == 204
        assert not any(
            r["id"] == created["id"] for r in client.get("/api/v1/admin/subsidiary-recaptcha-configs", headers=admin_headers).json()
        )

    def test_delete_unknown_id_is_404(self, client: TestClient, admin_headers: dict):
        resp = client.delete("/api/v1/admin/subsidiary-recaptcha-configs/00000000-0000-0000-0000-000000000000", headers=admin_headers)
        assert resp.status_code == 404


class TestPublicRead:
    def test_any_authenticated_user_can_read_by_subsidiary(self, client: TestClient, admin_headers: dict, standard_headers: dict):
        sub = _unique_subsidiary()
        client.post(
            "/api/v1/admin/subsidiary-recaptcha-configs",
            json={"subsidiaryName": sub, "siteKey": "a-site-key"},
            headers=admin_headers,
        )
        resp = client.get(f"/api/v1/subsidiary-recaptcha-configs?subsidiary={sub}", headers=standard_headers)
        assert resp.status_code == 200
        assert resp.json() == {"siteKey": "a-site-key"}

    def test_missing_subsidiary_query_returns_null(self, client: TestClient, standard_headers: dict):
        resp = client.get("/api/v1/subsidiary-recaptcha-configs", headers=standard_headers)
        assert resp.status_code == 200
        assert resp.json() == {"siteKey": None}

    def test_subsidiary_with_no_config_returns_null(self, client: TestClient, standard_headers: dict):
        resp = client.get(f"/api/v1/subsidiary-recaptcha-configs?subsidiary={_unique_subsidiary()}", headers=standard_headers)
        assert resp.status_code == 200
        assert resp.json() == {"siteKey": None}

    def test_requires_auth(self, client: TestClient):
        resp = client.get("/api/v1/subsidiary-recaptcha-configs")
        assert resp.status_code == 401
