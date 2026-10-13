"""Tests for the locale -> default "page error" copy reference table
(`app/services/page_error_locale_default_service.py`, admin CRUD in
`app/routers/admin.py`)."""

from __future__ import annotations

import random
import string

from fastapi.testclient import TestClient


def _unique_locale() -> str:
    # Matches LOCALE_CODE_RE but won't collide with any real-world locale
    # or the migration-seeded rows.
    return "qq_" + "".join(random.choices(string.ascii_uppercase, k=2))


def _body(locale: str, **overrides) -> dict:
    body = {
        "localeCode": locale,
        "heading": "Something went wrong.",
        "subHeading": "Please try again later.",
        "subHeadingUrl": "https://example.com/why",
        "subHeadingUrlText": "Why Galaxy?",
    }
    body.update(overrides)
    return body


class TestAdminCrud:
    def test_non_admin_forbidden(self, client: TestClient, standard_headers: dict):
        resp = client.get("/api/v1/admin/page-error-defaults", headers=standard_headers)
        assert resp.status_code == 403

    def test_create_and_list(self, client: TestClient, admin_headers: dict):
        locale = _unique_locale()
        resp = client.post("/api/v1/admin/page-error-defaults", json=_body(locale), headers=admin_headers)
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["localeCode"] == locale
        assert body["heading"] == "Something went wrong."

        listed = client.get("/api/v1/admin/page-error-defaults", headers=admin_headers).json()
        assert any(r["id"] == body["id"] for r in listed)

    def test_upsert_replaces_the_copy_for_the_same_locale(self, client: TestClient, admin_headers: dict):
        locale = _unique_locale()
        first = client.post("/api/v1/admin/page-error-defaults", json=_body(locale), headers=admin_headers).json()
        second = client.post(
            "/api/v1/admin/page-error-defaults", json=_body(locale, heading="Updated heading"), headers=admin_headers
        ).json()
        assert second["id"] == first["id"]
        assert second["heading"] == "Updated heading"

    def test_rejects_bad_locale_code(self, client: TestClient, admin_headers: dict):
        resp = client.post("/api/v1/admin/page-error-defaults", json=_body("english"), headers=admin_headers)
        assert resp.status_code == 400

    def test_rejects_non_http_url(self, client: TestClient, admin_headers: dict):
        resp = client.post(
            "/api/v1/admin/page-error-defaults", json=_body(_unique_locale(), subHeadingUrl="javascript:alert(1)"), headers=admin_headers
        )
        assert resp.status_code == 400

    def test_delete(self, client: TestClient, admin_headers: dict):
        created = client.post("/api/v1/admin/page-error-defaults", json=_body(_unique_locale()), headers=admin_headers).json()
        resp = client.delete(f"/api/v1/admin/page-error-defaults/{created['id']}", headers=admin_headers)
        assert resp.status_code == 204
        assert not any(r["id"] == created["id"] for r in client.get("/api/v1/admin/page-error-defaults", headers=admin_headers).json())

    def test_delete_unknown_id_is_404(self, client: TestClient, admin_headers: dict):
        resp = client.delete("/api/v1/admin/page-error-defaults/00000000-0000-0000-0000-000000000000", headers=admin_headers)
        assert resp.status_code == 404
