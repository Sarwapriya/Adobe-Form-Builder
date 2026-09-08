"""Tests for `/api/v1/admin/subsidiary-project-blocks`."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient


def _unique(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


class TestSubsidiaryProjectBlocks:
    def test_non_admin_forbidden(self, client: TestClient, standard_headers: dict):
        resp = client.get("/api/v1/admin/subsidiary-project-blocks", headers=standard_headers)
        assert resp.status_code == 403

    def test_create_list_and_delete(self, client: TestClient, admin_headers: dict):
        subsidiary_name = _unique("Sub")
        project_code = _unique("PC")

        created = client.post(
            "/api/v1/admin/subsidiary-project-blocks",
            json={"subsidiaryName": subsidiary_name, "projectCode": project_code},
            headers=admin_headers,
        )
        assert created.status_code == 201
        block_id = created.json()["id"]

        listed = client.get("/api/v1/admin/subsidiary-project-blocks", headers=admin_headers)
        assert any(b["id"] == block_id for b in listed.json())

        deleted = client.delete(f"/api/v1/admin/subsidiary-project-blocks/{block_id}", headers=admin_headers)
        assert deleted.status_code == 204

        deleted_again = client.delete(f"/api/v1/admin/subsidiary-project-blocks/{block_id}", headers=admin_headers)
        assert deleted_again.status_code == 404

    def test_duplicate_pair_conflicts(self, client: TestClient, admin_headers: dict):
        subsidiary_name = _unique("Sub")
        project_code = _unique("PC")
        body = {"subsidiaryName": subsidiary_name, "projectCode": project_code}

        first = client.post("/api/v1/admin/subsidiary-project-blocks", json=body, headers=admin_headers)
        assert first.status_code == 201
        second = client.post("/api/v1/admin/subsidiary-project-blocks", json=body, headers=admin_headers)
        assert second.status_code == 409

    def test_open_project_code_listing_excludes_blocked_subsidiary_only(
        self, client: TestClient, admin_headers: dict, standard_headers: dict
    ):
        subsidiary_name = _unique("Sub")
        project_code = _unique("PC")
        client.post("/api/v1/admin/project-codes", json={"code": project_code}, headers=admin_headers)
        client.post(
            "/api/v1/admin/subsidiary-project-blocks",
            json={"subsidiaryName": subsidiary_name, "projectCode": project_code},
            headers=admin_headers,
        )

        blocked_view = client.get(
            "/api/v1/project-codes/", params={"subsidiary": subsidiary_name}, headers=standard_headers
        )
        assert project_code not in {c["code"] for c in blocked_view.json()}

        other_view = client.get(
            "/api/v1/project-codes/", params={"subsidiary": _unique("OtherSub")}, headers=standard_headers
        )
        assert project_code in {c["code"] for c in other_view.json()}
