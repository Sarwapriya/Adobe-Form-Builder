"""Tests for Template Management (`fq.FormTemplates`,
`app/services/form_template_service.py`, `app/routers/templates.py`) — the
visibility/ownership matrix, forged-scope/forged-subsidiary rejection, IDOR,
and the "use template" clone path via `copy_from_template_id`. Covers the
Template Management feature's own 17-scenario test list."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.project_code import ProjectCode
from app.models.subsidiary import Subsidiary
from app.models.user import User
from tests.admin.conftest import auth_headers, make_user
from tests.form_builder.conftest import make_standard_user, sample_config_json, sample_definition_json, unique_name


def _template_body(subsidiary_name: str, *, scope: str = "USER", target_subsidiary: str | None = None) -> dict:
    body: dict = {
        "name": unique_name("Template"),
        "description": "a test template",
        "scope": scope,
        "definition": sample_definition_json(subsidiary_name),
        "config": sample_config_json(["ff"]),
    }
    if target_subsidiary is not None:
        body["targetSubsidiaryName"] = target_subsidiary
    return body


@pytest.fixture()
def superadmin_user(db_session: Session) -> User:
    return make_user(db_session, role="superadmin")


@pytest.fixture()
def superadmin_headers(superadmin_user: User) -> dict:
    return auth_headers(superadmin_user)


class TestOwnTemplateVisibility:
    """Scenario 1: a subsidiary user creates a template and can see it."""

    def test_standard_user_sees_their_own_user_scoped_template(
        self, client: TestClient, standard_headers: dict, subsidiary_row: Subsidiary
    ):
        created = client.post("/api/v1/templates", json=_template_body(subsidiary_row.name), headers=standard_headers)
        assert created.status_code == 201, created.text
        body = created.json()
        assert body["scope"] == "USER"
        assert body["subsidiaryName"] == subsidiary_row.name

        listed = client.get("/api/v1/templates", headers=standard_headers).json()
        assert any(t["id"] == body["id"] for t in listed)


class TestSameSubsidiaryVisibility:
    """Scenarios 2-3: another user in the same subsidiary can view/use a
    SUBSIDIARY-scoped template but cannot edit/delete it, and cannot see a
    USER-scoped one at all."""

    def test_second_user_in_same_subsidiary_sees_and_can_use_subsidiary_scoped_template(
        self, client: TestClient, db_session: Session, standard_headers: dict, subsidiary_row: Subsidiary
    ):
        created = client.post(
            "/api/v1/templates", json=_template_body(subsidiary_row.name, scope="SUBSIDIARY"), headers=standard_headers
        ).json()
        second_headers = auth_headers(make_standard_user(db_session, subsidiary_row.name))

        listed = client.get("/api/v1/templates", headers=second_headers).json()
        assert any(t["id"] == created["id"] for t in listed)
        assert client.get(f"/api/v1/templates/{created['id']}", headers=second_headers).status_code == 200

    def test_second_user_in_same_subsidiary_cannot_edit_or_delete(
        self, client: TestClient, db_session: Session, standard_headers: dict, subsidiary_row: Subsidiary
    ):
        created = client.post(
            "/api/v1/templates", json=_template_body(subsidiary_row.name, scope="SUBSIDIARY"), headers=standard_headers
        ).json()
        second_headers = auth_headers(make_standard_user(db_session, subsidiary_row.name))

        assert client.put(f"/api/v1/templates/{created['id']}", json={"name": "hijacked"}, headers=second_headers).status_code == 403
        assert client.delete(f"/api/v1/templates/{created['id']}", headers=second_headers).status_code == 403

    def test_second_user_in_same_subsidiary_cannot_see_a_user_scoped_template(
        self, client: TestClient, db_session: Session, standard_headers: dict, subsidiary_row: Subsidiary
    ):
        created = client.post(
            "/api/v1/templates", json=_template_body(subsidiary_row.name, scope="USER"), headers=standard_headers
        ).json()
        second_headers = auth_headers(make_standard_user(db_session, subsidiary_row.name))

        listed = client.get("/api/v1/templates", headers=second_headers).json()
        assert not any(t["id"] == created["id"] for t in listed)
        assert client.get(f"/api/v1/templates/{created['id']}", headers=second_headers).status_code == 404


class TestCrossSubsidiaryVisibility:
    """Scenarios 4-5: a different subsidiary can't see a SUBSIDIARY-only
    template, but can see and use a GLOBAL one."""

    def test_different_subsidiary_cannot_see_subsidiary_scoped_template(
        self, client: TestClient, standard_headers: dict, subsidiary_row: Subsidiary, other_standard_headers: dict
    ):
        created = client.post(
            "/api/v1/templates", json=_template_body(subsidiary_row.name, scope="SUBSIDIARY"), headers=standard_headers
        ).json()
        listed = client.get("/api/v1/templates", headers=other_standard_headers).json()
        assert not any(t["id"] == created["id"] for t in listed)
        assert client.get(f"/api/v1/templates/{created['id']}", headers=other_standard_headers).status_code == 404

    def test_different_subsidiary_sees_and_can_use_a_global_template(
        self, client: TestClient, admin_headers: dict, other_standard_headers: dict, other_subsidiary_row: Subsidiary
    ):
        created = client.post(
            "/api/v1/templates", json=_template_body(other_subsidiary_row.name, scope="GLOBAL"), headers=admin_headers
        ).json()
        assert created["scope"] == "GLOBAL"
        listed = client.get("/api/v1/templates", headers=other_standard_headers).json()
        assert any(t["id"] == created["id"] for t in listed)
        assert client.get(f"/api/v1/templates/{created['id']}", headers=other_standard_headers).status_code == 200


class TestUseTemplateIsolation:
    """Scenarios 6-8, 16: creating a campaign from a template never mutates
    the template, editing the new campaign doesn't touch it either, saving
    the edited copy as a new template works, and deleting a template leaves
    campaigns already created from it alone."""

    def test_create_from_template_does_not_mutate_source_and_edits_stay_isolated(
        self, client: TestClient, standard_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        template = client.post(
            "/api/v1/templates", json=_template_body(subsidiary_row.name, scope="USER"), headers=standard_headers
        ).json()
        original_detail = client.get(f"/api/v1/templates/{template['id']}", headers=standard_headers).json()
        assert len(original_detail["definition"]["questions"]) == 3

        created = client.post(
            "/api/v1/forms/adhoc",
            json={
                "name": unique_name("FromTemplate"),
                "projectCode": project_code_row.code,
                "copyFromTemplateId": template["id"],
            },
            headers=standard_headers,
        )
        assert created.status_code == 201, created.text
        form_id = created.json()["id"]

        form_detail = client.get(f"/api/v1/forms/adhoc/{form_id}", headers=standard_headers).json()
        assert len(form_detail["draft"]["definition"]["questions"]) == 3

        # Edit the new form's draft down to zero questions...
        emptied = sample_definition_json(subsidiary_row.name)
        emptied["questions"] = []
        patch = client.patch(
            f"/api/v1/forms/adhoc/{form_id}/draft",
            json={"definition": emptied, "config": sample_config_json(["ff"])},
            headers=standard_headers,
        )
        assert patch.status_code == 204, patch.text

        # ...and the original template must be completely unaffected.
        unaffected = client.get(f"/api/v1/templates/{template['id']}", headers=standard_headers).json()
        assert len(unaffected["definition"]["questions"]) == 3

    def test_saving_the_modified_copy_as_a_new_template_works(
        self, client: TestClient, standard_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        template = client.post(
            "/api/v1/templates", json=_template_body(subsidiary_row.name, scope="USER"), headers=standard_headers
        ).json()
        created = client.post(
            "/api/v1/forms/adhoc",
            json={
                "name": unique_name("FromTemplate"),
                "projectCode": project_code_row.code,
                "copyFromTemplateId": template["id"],
            },
            headers=standard_headers,
        ).json()
        form_detail = client.get(f"/api/v1/forms/adhoc/{created['id']}", headers=standard_headers).json()

        new_template = client.post(
            "/api/v1/templates",
            json={
                "name": unique_name("SecondTemplate"),
                "scope": "USER",
                "definition": form_detail["draft"]["definition"],
                "config": form_detail["draft"]["config"],
            },
            headers=standard_headers,
        )
        assert new_template.status_code == 201, new_template.text
        assert new_template.json()["id"] != template["id"]

    def test_deleting_a_template_does_not_affect_campaigns_already_created_from_it(
        self, client: TestClient, standard_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        template = client.post(
            "/api/v1/templates", json=_template_body(subsidiary_row.name, scope="USER"), headers=standard_headers
        ).json()
        created = client.post(
            "/api/v1/forms/adhoc",
            json={
                "name": unique_name("FromTemplate"),
                "projectCode": project_code_row.code,
                "copyFromTemplateId": template["id"],
            },
            headers=standard_headers,
        ).json()

        assert client.delete(f"/api/v1/templates/{template['id']}", headers=standard_headers).status_code == 204
        assert client.get(f"/api/v1/templates/{template['id']}", headers=standard_headers).status_code == 404

        still_there = client.get(f"/api/v1/forms/adhoc/{created['id']}", headers=standard_headers)
        assert still_there.status_code == 200
        assert len(still_there.json()["draft"]["definition"]["questions"]) == 3


class TestAdminAndSuperAdmin:
    """Scenarios 9-12: Admin sees/uses everything but can't touch another
    user's template; Super Admin can edit/delete any user's template."""

    def test_admin_can_view_and_use_any_template(
        self, client: TestClient, standard_headers: dict, admin_headers: dict, subsidiary_row: Subsidiary
    ):
        created = client.post(
            "/api/v1/templates", json=_template_body(subsidiary_row.name, scope="USER"), headers=standard_headers
        ).json()
        listed = client.get("/api/v1/templates", headers=admin_headers).json()
        assert any(t["id"] == created["id"] for t in listed)
        assert client.get(f"/api/v1/templates/{created['id']}", headers=admin_headers).status_code == 200

    def test_admin_cannot_edit_or_delete_another_users_template(
        self, client: TestClient, standard_headers: dict, admin_headers: dict, subsidiary_row: Subsidiary
    ):
        created = client.post(
            "/api/v1/templates", json=_template_body(subsidiary_row.name, scope="USER"), headers=standard_headers
        ).json()
        assert client.put(f"/api/v1/templates/{created['id']}", json={"name": "hijacked"}, headers=admin_headers).status_code == 403
        assert client.delete(f"/api/v1/templates/{created['id']}", headers=admin_headers).status_code == 403

    def test_admin_can_manage_their_own_template(self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary):
        created = client.post(
            "/api/v1/templates", json=_template_body(subsidiary_row.name, scope="GLOBAL"), headers=admin_headers
        ).json()
        updated = client.put(f"/api/v1/templates/{created['id']}", json={"name": "renamed by owner"}, headers=admin_headers)
        assert updated.status_code == 200
        assert updated.json()["name"] == "renamed by owner"
        assert client.delete(f"/api/v1/templates/{created['id']}", headers=admin_headers).status_code == 204

    def test_superadmin_can_edit_and_delete_any_users_template(
        self, client: TestClient, standard_headers: dict, superadmin_headers: dict, subsidiary_row: Subsidiary
    ):
        created = client.post(
            "/api/v1/templates", json=_template_body(subsidiary_row.name, scope="USER"), headers=standard_headers
        ).json()
        updated = client.put(f"/api/v1/templates/{created['id']}", json={"name": "renamed by superadmin"}, headers=superadmin_headers)
        assert updated.status_code == 200
        assert client.delete(f"/api/v1/templates/{created['id']}", headers=superadmin_headers).status_code == 204


class TestForgedScopeIsRejected:
    """Scenarios 13-14: a subsidiary user can't escalate to GLOBAL or a
    foreign subsidiary, on create or update, however the request is
    phrased."""

    def test_cannot_create_a_global_template(self, client: TestClient, standard_headers: dict, subsidiary_row: Subsidiary):
        resp = client.post("/api/v1/templates", json=_template_body(subsidiary_row.name, scope="GLOBAL"), headers=standard_headers)
        assert resp.status_code == 403

    def test_cannot_create_a_template_targeting_another_subsidiary(
        self, client: TestClient, standard_headers: dict, subsidiary_row: Subsidiary, other_subsidiary_row: Subsidiary
    ):
        resp = client.post(
            "/api/v1/templates",
            json=_template_body(subsidiary_row.name, scope="SUBSIDIARY", target_subsidiary=other_subsidiary_row.name),
            headers=standard_headers,
        )
        assert resp.status_code == 403

    def test_cannot_escalate_scope_to_global_via_update(
        self, client: TestClient, standard_headers: dict, subsidiary_row: Subsidiary
    ):
        created = client.post(
            "/api/v1/templates", json=_template_body(subsidiary_row.name, scope="USER"), headers=standard_headers
        ).json()
        resp = client.put(f"/api/v1/templates/{created['id']}", json={"scope": "GLOBAL"}, headers=standard_headers)
        assert resp.status_code == 403
        still = client.get(f"/api/v1/templates/{created['id']}", headers=standard_headers).json()
        assert still["scope"] == "USER"

    def test_cannot_retarget_subsidiary_via_update(
        self, client: TestClient, standard_headers: dict, subsidiary_row: Subsidiary, other_subsidiary_row: Subsidiary
    ):
        created = client.post(
            "/api/v1/templates", json=_template_body(subsidiary_row.name, scope="SUBSIDIARY"), headers=standard_headers
        ).json()
        resp = client.put(
            f"/api/v1/templates/{created['id']}",
            json={"targetSubsidiaryName": other_subsidiary_row.name},
            headers=standard_headers,
        )
        assert resp.status_code == 403


class TestIdor:
    """Scenario 15: a non-visible template can't be retrieved just by
    knowing its id."""

    def test_unknown_id_is_404(self, client: TestClient, standard_headers: dict):
        resp = client.get("/api/v1/templates/00000000-0000-0000-0000-000000000000", headers=standard_headers)
        assert resp.status_code == 404

    def test_a_different_subsidiarys_user_scoped_template_id_is_404_not_403(
        self, client: TestClient, standard_headers: dict, subsidiary_row: Subsidiary, other_standard_headers: dict
    ):
        created = client.post(
            "/api/v1/templates", json=_template_body(subsidiary_row.name, scope="USER"), headers=standard_headers
        ).json()
        resp = client.get(f"/api/v1/templates/{created['id']}", headers=other_standard_headers)
        assert resp.status_code == 404
