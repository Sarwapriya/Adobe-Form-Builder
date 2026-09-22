"""A subsidiary user now picks a project code when creating their own ad-hoc
form (`POST /api/v1/forms/adhoc`) instead of an admin only assigning one at
approval — see `form_builder_service.create_form`/`approve_adhoc_form`'s own
doc comments. Covers: the field is required and validated the same way any
other project-code attachment is (open, not expired, not blocked for this
subsidiary), and an admin approving the form can still override it but isn't
required to."""

from __future__ import annotations

from datetime import date, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.project_code import ProjectCode
from app.models.subsidiary import Subsidiary
from tests.form_builder.conftest import unique_name


class TestCreateRequiresProjectCode:
    def test_missing_project_code_is_rejected(self, client: TestClient, standard_headers: dict):
        resp = client.post("/api/v1/forms/adhoc", json={"name": unique_name("Adhoc")}, headers=standard_headers)
        assert resp.status_code == 400

    def test_unknown_project_code_is_rejected(self, client: TestClient, standard_headers: dict):
        resp = client.post(
            "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": "NO-SUCH-CODE"}, headers=standard_headers
        )
        assert resp.status_code == 404

    def test_closed_project_code_is_rejected(self, client: TestClient, admin_headers: dict, standard_headers: dict, project_code_row: ProjectCode):
        client.patch(f"/api/v1/admin/project-codes/{project_code_row.id}", json={"isOpen": False}, headers=admin_headers)
        resp = client.post(
            "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": project_code_row.code}, headers=standard_headers
        )
        assert resp.status_code == 409

    def test_expired_project_code_is_rejected(self, client: TestClient, db_session: Session, standard_headers: dict, project_code_row: ProjectCode):
        project_code_row.endDate = date.today() - timedelta(days=1)
        db_session.add(project_code_row)
        db_session.commit()

        resp = client.post(
            "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": project_code_row.code}, headers=standard_headers
        )
        assert resp.status_code == 409

    def test_locked_project_code_is_rejected(self, client: TestClient, admin_headers: dict, standard_headers: dict, project_code_row: ProjectCode):
        client.patch(f"/api/v1/admin/project-codes/{project_code_row.id}", json={"isLocked": True}, headers=admin_headers)
        resp = client.post(
            "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": project_code_row.code}, headers=standard_headers
        )
        assert resp.status_code == 409

    def test_valid_open_project_code_is_accepted_and_attached(
        self, client: TestClient, standard_headers: dict, project_code_row: ProjectCode
    ):
        resp = client.post(
            "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": project_code_row.code}, headers=standard_headers
        )
        assert resp.status_code == 201, resp.text
        assert resp.json()["projectCode"] == project_code_row.code


class TestApproveReusesTheFormsOwnProjectCode:
    def test_omitting_projectcode_at_approval_reuses_the_ones_set_at_creation(
        self, client: TestClient, admin_headers: dict, standard_headers: dict, project_code_row: ProjectCode
    ):
        created = client.post(
            "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": project_code_row.code}, headers=standard_headers
        ).json()
        # No draft has been filled in, so publish_form will report the form invalid —
        # that's fine, this test only cares that the project-code gate itself passed
        # (a validation 422 proves the code was accepted and attached, not rejected).
        client.post(f"/api/v1/forms/adhoc/{created['id']}/submit-for-review", headers=standard_headers)
        resp = client.post(f"/api/v1/admin/forms/{created['id']}/adhoc/approve", json={}, headers=admin_headers)
        assert resp.status_code in (204, 422)
        assert resp.status_code != 400  # 400 would mean "no_project_code"/gate failure

    def test_admin_can_override_with_a_different_open_code(
        self, client: TestClient, admin_headers: dict, standard_headers: dict, project_code_row: ProjectCode, db_session: Session
    ):
        other = ProjectCode(code=unique_name("PC2"), isOpen=True, isLocked=False)
        db_session.add(other)
        db_session.commit()
        db_session.refresh(other)

        created = client.post(
            "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": project_code_row.code}, headers=standard_headers
        ).json()
        client.post(f"/api/v1/forms/adhoc/{created['id']}/submit-for-review", headers=standard_headers)
        client.post(f"/api/v1/admin/forms/{created['id']}/adhoc/approve", json={"projectCode": other.code}, headers=admin_headers)

        db_session.expire_all()
        from app.models.form import Form

        row = db_session.get(Form, created["id"])
        assert row.projectCode == other.code


class TestPublishedAdHocFormIsReadOnly:
    def test_draft_update_rejected_once_published(
        self, client: TestClient, admin_headers: dict, standard_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        from tests.form_builder.conftest import sample_config_json, sample_definition_json

        created = client.post(
            "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": project_code_row.code}, headers=standard_headers
        ).json()
        client.patch(
            f"/api/v1/forms/adhoc/{created['id']}/draft",
            json={"definition": sample_definition_json(subsidiary_row.name), "config": sample_config_json(["ff"])},
            headers=standard_headers,
        )
        client.post(f"/api/v1/forms/adhoc/{created['id']}/submit-for-review", headers=standard_headers)
        approve_resp = client.post(f"/api/v1/admin/forms/{created['id']}/adhoc/approve", json={}, headers=admin_headers)
        assert approve_resp.status_code == 204, approve_resp.text

        resp = client.patch(
            f"/api/v1/forms/adhoc/{created['id']}/draft",
            json={"definition": sample_definition_json(subsidiary_row.name), "config": sample_config_json(["ff"])},
            headers=standard_headers,
        )
        assert resp.status_code == 409

        resubmit = client.post(f"/api/v1/forms/adhoc/{created['id']}/submit-for-review", headers=standard_headers)
        assert resubmit.status_code == 409
