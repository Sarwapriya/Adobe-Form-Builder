"""An admin can start a new ad-hoc campaign directly (`POST /api/v1/admin/forms`
with `origin: "adhoc"`) — the admin panel's Ad-hoc Forms page "New Form" button.
Omitting `origin` keeps creating an ordinary admin/HR form, exactly as before."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.models.subsidiary import Subsidiary
from tests.form_builder.conftest import unique_name


def _create(client: TestClient, headers: dict, sub: str, **extra) -> dict:
    resp = client.post("/api/v1/admin/forms", json={"name": unique_name("Form"), "subsidiaryId": sub, **extra}, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestAdminCreatesAdHoc:
    def test_origin_adhoc_creates_an_adhoc_form_that_is_full_form_only(
        self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary
    ):
        created = _create(client, admin_headers, subsidiary_row.name, origin="adhoc")
        assert created["origin"] == "adhoc"
        assert created["status"] == "draft"

        detail = client.get(f"/api/v1/admin/forms/{created['id']}", headers=admin_headers).json()
        assert detail["draft"]["config"]["variants"] == ["ff"]

    def test_omitting_origin_still_creates_an_admin_form_with_both_variants(
        self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary
    ):
        created = _create(client, admin_headers, subsidiary_row.name)
        assert created["origin"] == "admin"

        detail = client.get(f"/api/v1/admin/forms/{created['id']}", headers=admin_headers).json()
        assert detail["draft"]["config"]["variants"] == ["ff", "oc"]

    def test_it_lists_under_adhoc_and_not_under_admin_forms(
        self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary
    ):
        created = _create(client, admin_headers, subsidiary_row.name, origin="adhoc")

        def ids(origin: str) -> set[str]:
            resp = client.get(f"/api/v1/admin/forms?origin={origin}&subsidiaryId={subsidiary_row.name}", headers=admin_headers)
            assert resp.status_code == 200, resp.text
            return {f["id"] for f in resp.json()["items"]}

        assert created["id"] in ids("adhoc")
        assert created["id"] not in ids("admin")

    def test_an_optional_project_code_is_accepted(
        self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary, project_code_row
    ):
        created = _create(client, admin_headers, subsidiary_row.name, origin="adhoc", projectCode=project_code_row.code)
        assert created["projectCode"] == project_code_row.code

    def test_an_unknown_origin_is_rejected(self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary):
        resp = client.post(
            "/api/v1/admin/forms",
            json={"name": unique_name("Form"), "subsidiaryId": subsidiary_row.name, "origin": "bogus"},
            headers=admin_headers,
        )
        assert resp.status_code == 400  # this API reports request-validation errors as 400

    def test_a_standard_user_still_cannot_use_the_admin_create_route(
        self, client: TestClient, standard_headers: dict, subsidiary_row: Subsidiary
    ):
        resp = client.post(
            "/api/v1/admin/forms",
            json={"name": unique_name("Form"), "subsidiaryId": subsidiary_row.name, "origin": "adhoc"},
            headers=standard_headers,
        )
        assert resp.status_code == 403

    def test_the_subsidiarys_own_users_see_it_under_their_adhoc_forms(
        self, client: TestClient, admin_headers: dict, standard_headers: dict, subsidiary_row: Subsidiary
    ):
        """Ad-hoc forms are scoped to a subsidiary, not to their creator, so one an admin
        starts for a subsidiary is visible to (and editable by) that subsidiary's users —
        documented behaviour of the feature, pinned here."""
        created = _create(client, admin_headers, subsidiary_row.name, origin="adhoc")
        resp = client.get("/api/v1/forms/adhoc", headers=standard_headers)
        assert resp.status_code == 200, resp.text
        assert created["id"] in {f["id"] for f in resp.json()}
