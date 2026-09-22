"""Tests for the subsidiary+locale -> Privacy Policy URL reference table
(`app/services/subsidiary_privacy_link_service.py`, admin CRUD in
`app/routers/admin.py`, any-auth read in `app/routers/subsidiary_privacy_links.py`)."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient


def _unique_subsidiary() -> str:
    return f"PYTEST-SUB-{uuid.uuid4().hex[:8]}"


class TestAdminCrud:
    def test_non_admin_forbidden(self, client: TestClient, standard_headers: dict):
        resp = client.get("/api/v1/admin/subsidiary-privacy-links", headers=standard_headers)
        assert resp.status_code == 403

    def test_create_and_list(self, client: TestClient, admin_headers: dict):
        sub = _unique_subsidiary()
        resp = client.post(
            "/api/v1/admin/subsidiary-privacy-links",
            json={"subsidiaryName": sub, "localeCode": "en_AE", "url": "https://www.samsung.com/ae/info/privacy/"},
            headers=admin_headers,
        )
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["subsidiaryName"] == sub
        assert body["localeCode"] == "en_AE"

        listed = client.get("/api/v1/admin/subsidiary-privacy-links", headers=admin_headers).json()
        assert any(r["id"] == body["id"] for r in listed)

    def test_upsert_replaces_the_url_for_the_same_pair(self, client: TestClient, admin_headers: dict):
        sub = _unique_subsidiary()
        first = client.post(
            "/api/v1/admin/subsidiary-privacy-links",
            json={"subsidiaryName": sub, "localeCode": "en_AE", "url": "https://example.com/first"},
            headers=admin_headers,
        ).json()
        second = client.post(
            "/api/v1/admin/subsidiary-privacy-links",
            json={"subsidiaryName": sub, "localeCode": "en_AE", "url": "https://example.com/second"},
            headers=admin_headers,
        ).json()
        assert second["id"] == first["id"]
        assert second["url"] == "https://example.com/second"

    def test_rejects_bad_locale_code(self, client: TestClient, admin_headers: dict):
        resp = client.post(
            "/api/v1/admin/subsidiary-privacy-links",
            json={"subsidiaryName": _unique_subsidiary(), "localeCode": "english", "url": "https://example.com"},
            headers=admin_headers,
        )
        assert resp.status_code == 400

    def test_rejects_non_http_url(self, client: TestClient, admin_headers: dict):
        resp = client.post(
            "/api/v1/admin/subsidiary-privacy-links",
            json={"subsidiaryName": _unique_subsidiary(), "localeCode": "en_AE", "url": "javascript:alert(1)"},
            headers=admin_headers,
        )
        assert resp.status_code == 400

    def test_delete(self, client: TestClient, admin_headers: dict):
        created = client.post(
            "/api/v1/admin/subsidiary-privacy-links",
            json={"subsidiaryName": _unique_subsidiary(), "localeCode": "en_AE", "url": "https://example.com"},
            headers=admin_headers,
        ).json()
        resp = client.delete(f"/api/v1/admin/subsidiary-privacy-links/{created['id']}", headers=admin_headers)
        assert resp.status_code == 204
        assert not any(r["id"] == created["id"] for r in client.get("/api/v1/admin/subsidiary-privacy-links", headers=admin_headers).json())

    def test_delete_unknown_id_is_404(self, client: TestClient, admin_headers: dict):
        resp = client.delete("/api/v1/admin/subsidiary-privacy-links/00000000-0000-0000-0000-000000000000", headers=admin_headers)
        assert resp.status_code == 404


class TestPublicRead:
    def test_any_authenticated_user_can_read_by_subsidiary(self, client: TestClient, admin_headers: dict, standard_headers: dict):
        sub = _unique_subsidiary()
        client.post(
            "/api/v1/admin/subsidiary-privacy-links",
            json={"subsidiaryName": sub, "localeCode": "ar_AE", "url": "https://www.samsung.com/ae_ar/info/privacy/"},
            headers=admin_headers,
        )
        resp = client.get(f"/api/v1/subsidiary-privacy-links?subsidiary={sub}", headers=standard_headers)
        assert resp.status_code == 200
        assert resp.json() == {"ar_AE": "https://www.samsung.com/ae_ar/info/privacy/"}

    def test_missing_subsidiary_query_returns_empty(self, client: TestClient, standard_headers: dict):
        resp = client.get("/api/v1/subsidiary-privacy-links", headers=standard_headers)
        assert resp.status_code == 200
        assert resp.json() == {}

    def test_requires_auth(self, client: TestClient):
        resp = client.get("/api/v1/subsidiary-privacy-links")
        assert resp.status_code == 401
