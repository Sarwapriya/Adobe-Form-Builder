"""Tests for `/api/v1/admin/subsidiary-locales` and the read-only
`/api/v1/subsidiary-locales` router."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient


def _unique_subsidiary() -> str:
    return f"LocaleSub-{uuid.uuid4().hex[:10]}"


def _locale_body(subsidiary_name: str, code: str, is_fallback: bool) -> dict:
    return {
        "subsidiaryName": subsidiary_name,
        "code": code,
        "langSubtag": code.split("_")[0],
        "isRtl": False,
        "label": code,
        "isFallback": is_fallback,
    }


class TestSubsidiaryLocaleCrud:
    def test_non_admin_forbidden(self, client: TestClient, standard_headers: dict):
        resp = client.get("/api/v1/admin/subsidiary-locales", headers=standard_headers)
        assert resp.status_code == 403

    def test_add_list_and_remove(self, client: TestClient, admin_headers: dict):
        subsidiary_name = _unique_subsidiary()
        created = client.post(
            "/api/v1/admin/subsidiary-locales", json=_locale_body(subsidiary_name, "en_GB", True), headers=admin_headers
        )
        assert created.status_code == 201
        assert created.json()["isFallback"] is True

        listed = client.get("/api/v1/admin/subsidiary-locales", headers=admin_headers)
        assert any(loc["id"] == created.json()["id"] for loc in listed.json())

        removed = client.delete(f"/api/v1/admin/subsidiary-locales/{created.json()['id']}", headers=admin_headers)
        assert removed.status_code == 204
        removed_again = client.delete(f"/api/v1/admin/subsidiary-locales/{created.json()['id']}", headers=admin_headers)
        assert removed_again.status_code == 404

    def test_duplicate_code_for_same_subsidiary_conflicts(self, client: TestClient, admin_headers: dict):
        subsidiary_name = _unique_subsidiary()
        body = _locale_body(subsidiary_name, "ar_AE", False)
        first = client.post("/api/v1/admin/subsidiary-locales", json=body, headers=admin_headers)
        assert first.status_code == 201
        second = client.post("/api/v1/admin/subsidiary-locales", json=body, headers=admin_headers)
        assert second.status_code == 409

    def test_rejects_malformed_code(self, client: TestClient, admin_headers: dict):
        resp = client.post(
            "/api/v1/admin/subsidiary-locales",
            json=_locale_body(_unique_subsidiary(), "english", False),
            headers=admin_headers,
        )
        assert resp.status_code == 400

    def test_only_one_fallback_per_subsidiary(self, client: TestClient, admin_headers: dict):
        subsidiary_name = _unique_subsidiary()
        first = client.post(
            "/api/v1/admin/subsidiary-locales", json=_locale_body(subsidiary_name, "en_GB", True), headers=admin_headers
        ).json()
        second = client.post(
            "/api/v1/admin/subsidiary-locales", json=_locale_body(subsidiary_name, "fr_FR", True), headers=admin_headers
        ).json()
        assert second["isFallback"] is True

        listed = client.get("/api/v1/admin/subsidiary-locales", headers=admin_headers).json()
        this_subsidiary = [loc for loc in listed if loc["subsidiaryName"] == subsidiary_name]
        fallbacks = [loc for loc in this_subsidiary if loc["isFallback"]]
        assert len(fallbacks) == 1
        assert fallbacks[0]["id"] == second["id"]
        first_after = next(loc for loc in this_subsidiary if loc["id"] == first["id"])
        assert first_after["isFallback"] is False

    def test_public_listing_fallback_first_and_requires_subsidiary_param(
        self, client: TestClient, admin_headers: dict, standard_headers: dict
    ):
        subsidiary_name = _unique_subsidiary()
        client.post("/api/v1/admin/subsidiary-locales", json=_locale_body(subsidiary_name, "fr_FR", False), headers=admin_headers)
        client.post("/api/v1/admin/subsidiary-locales", json=_locale_body(subsidiary_name, "en_GB", True), headers=admin_headers)

        no_param = client.get("/api/v1/subsidiary-locales/", headers=standard_headers)
        assert no_param.status_code == 200
        assert no_param.json() == []

        with_param = client.get(
            "/api/v1/subsidiary-locales/", params={"subsidiary": subsidiary_name}, headers=standard_headers
        )
        assert with_param.status_code == 200
        codes = [loc["code"] for loc in with_param.json()]
        assert codes[0] == "en_GB"  # fallback sorts first
        assert "fr_FR" in codes
