"""Two related subsidiary-side restrictions, and the one escape hatch they
share:

  - A project code's own `cutoffDate` (admin-set, independent of `endDate`)
    now actually blocks subsidiary edits once it's passed — see
    `project_code_service.assert_project_code_cutoff_not_passed`'s own doc
    comment. Previously this field only drove a reminder email.
  - A form is locked for subsidiary editing once it's actually been deployed
    to Adobe over SFTP (ad-hoc's own draft: once published, unchanged
    trigger point from before this existed; Translate & Extend: once
    deployed specifically, a genuinely new restriction) — see
    `form_builder_service.is_edit_locked_post_deploy`.
  - Either lock can be bypassed by an admin-approved `FormUpdateRequest` for
    that one `(form, subsidiary)` pair, consumed the next time the form is
    actually republished — see `form_update_request_service.py`.
"""

from __future__ import annotations

from datetime import date, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.project_code import ProjectCode
from app.models.subsidiary import Subsidiary
from app.services.sftp_service import SftpDeployResult
from tests.form_builder.conftest import create_and_publish_admin_form, sample_config_json, sample_definition_json, unique_name


def _fake_deploy_ok(db, files):
    return SftpDeployResult(ok=True, filesDeployed=len(files), environment="staging")


def _deploy_form(client: TestClient, monkeypatch, admin_headers: dict, form_id: str) -> None:
    """Test helper: stubs SFTP to always succeed and hits the real /deploy
    endpoint, so `Form.lastDeployedVersionId` gets stamped for real."""
    from app.services import form_builder_service

    monkeypatch.setattr(form_builder_service, "deploy_generated_files", _fake_deploy_ok)
    resp = client.post(f"/api/v1/admin/forms/{form_id}/deploy", headers=admin_headers)
    assert resp.status_code == 200, resp.text


class TestProjectCodeCutoffBlocksNewAdHocForms:
    def test_past_cutoff_rejects_creating_a_new_adhoc_form(
        self, client: TestClient, admin_headers: dict, standard_headers: dict, project_code_row: ProjectCode
    ):
        client.patch(
            f"/api/v1/admin/project-codes/{project_code_row.id}",
            json={"cutoffDate": (date.today() - timedelta(days=1)).isoformat()},
            headers=admin_headers,
        )
        resp = client.post(
            "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": project_code_row.code}, headers=standard_headers
        )
        assert resp.status_code == 409

    def test_future_cutoff_still_allows_creating_a_new_adhoc_form(
        self, client: TestClient, admin_headers: dict, standard_headers: dict, project_code_row: ProjectCode
    ):
        client.patch(
            f"/api/v1/admin/project-codes/{project_code_row.id}",
            json={"cutoffDate": (date.today() + timedelta(days=7)).isoformat()},
            headers=admin_headers,
        )
        resp = client.post(
            "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": project_code_row.code}, headers=standard_headers
        )
        assert resp.status_code == 201, resp.text

    def test_admin_stays_exempt_from_cutoff(
        self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        client.patch(
            f"/api/v1/admin/project-codes/{project_code_row.id}",
            json={"cutoffDate": (date.today() - timedelta(days=1)).isoformat()},
            headers=admin_headers,
        )
        resp = client.post(
            "/api/v1/admin/forms/",
            json={"name": unique_name("Form"), "subsidiaryId": subsidiary_row.name, "projectCode": project_code_row.code},
            headers=admin_headers,
        )
        assert resp.status_code == 201, resp.text


class TestProjectCodeCutoffBlocksAdHocEditing:
    def test_past_cutoff_rejects_updating_an_unpublished_adhoc_draft(
        self, client: TestClient, admin_headers: dict, standard_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        created = client.post(
            "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": project_code_row.code}, headers=standard_headers
        ).json()
        client.patch(
            f"/api/v1/admin/project-codes/{project_code_row.id}",
            json={"cutoffDate": (date.today() - timedelta(days=1)).isoformat()},
            headers=admin_headers,
        )
        resp = client.patch(
            f"/api/v1/forms/adhoc/{created['id']}/draft",
            json={"definition": sample_definition_json(subsidiary_row.name), "config": sample_config_json(["ff"])},
            headers=standard_headers,
        )
        assert resp.status_code == 409

    def test_past_cutoff_rejects_submit_for_review(
        self, client: TestClient, admin_headers: dict, standard_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        created = client.post(
            "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": project_code_row.code}, headers=standard_headers
        ).json()
        client.patch(
            f"/api/v1/forms/adhoc/{created['id']}/draft",
            json={"definition": sample_definition_json(subsidiary_row.name), "config": sample_config_json(["ff"])},
            headers=standard_headers,
        )
        client.patch(
            f"/api/v1/admin/project-codes/{project_code_row.id}",
            json={"cutoffDate": (date.today() - timedelta(days=1)).isoformat()},
            headers=admin_headers,
        )
        resp = client.post(f"/api/v1/forms/adhoc/{created['id']}/submit-for-review", headers=standard_headers)
        assert resp.status_code == 409

    def test_no_cutoff_set_is_unaffected(
        self, client: TestClient, standard_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        created = client.post(
            "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": project_code_row.code}, headers=standard_headers
        ).json()
        resp = client.patch(
            f"/api/v1/forms/adhoc/{created['id']}/draft",
            json={"definition": sample_definition_json(subsidiary_row.name), "config": sample_config_json(["ff"])},
            headers=standard_headers,
        )
        assert resp.status_code == 204, resp.text


class TestProjectCodeCutoffBlocksContributions:
    def test_past_cutoff_rejects_submitting_a_contribution(
        self, client: TestClient, monkeypatch, admin_headers: dict, standard_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        client.patch(
            f"/api/v1/admin/project-codes/{project_code_row.id}",
            json={"cutoffDate": (date.today() - timedelta(days=1)).isoformat()},
            headers=admin_headers,
        )
        resp = client.post(
            f"/api/v1/forms/{form_id}/contributions",
            json={"content": {}},
            headers=standard_headers,
        )
        assert resp.status_code == 409


class TestDeployLockAndUpdateRequestAdHoc:
    def _publish_adhoc_form(self, client, admin_headers, standard_headers, subsidiary_row, project_code_row) -> str:
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
        return created["id"]

    def test_request_update_then_edit_again_then_consumed_on_republish(
        self, client: TestClient, monkeypatch, admin_headers: dict, standard_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = self._publish_adhoc_form(client, admin_headers, standard_headers, subsidiary_row, project_code_row)

        # Still locked — no request yet.
        locked_resp = client.patch(
            f"/api/v1/forms/adhoc/{form_id}/draft",
            json={"definition": sample_definition_json(subsidiary_row.name), "config": sample_config_json(["ff"])},
            headers=standard_headers,
        )
        assert locked_resp.status_code == 409

        request_resp = client.post("/api/v1/forms/{}/update-request".format(form_id), json={"note": "need to fix a typo"}, headers=standard_headers)
        assert request_resp.status_code == 201, request_resp.text
        request_id = request_resp.json()["id"]

        # A second request while one is already open is rejected.
        dup_resp = client.post(f"/api/v1/forms/{form_id}/update-request", json={}, headers=standard_headers)
        assert dup_resp.status_code == 409

        own_status = client.get(f"/api/v1/forms/{form_id}/update-request", headers=standard_headers)
        assert own_status.json()["status"] == "pending"

        approve_resp = client.post(
            f"/api/v1/admin/forms/{form_id}/update-requests/{request_id}/approve", json={}, headers=admin_headers
        )
        assert approve_resp.status_code == 204, approve_resp.text

        # Now editable again.
        edit_resp = client.patch(
            f"/api/v1/forms/adhoc/{form_id}/draft",
            json={"definition": sample_definition_json(subsidiary_row.name), "config": sample_config_json(["ff"])},
            headers=standard_headers,
        )
        assert edit_resp.status_code == 204, edit_resp.text

        resubmit_resp = client.post(f"/api/v1/forms/adhoc/{form_id}/submit-for-review", headers=standard_headers)
        assert resubmit_resp.status_code == 204, resubmit_resp.text

        reapprove_resp = client.post(f"/api/v1/admin/forms/{form_id}/adhoc/approve", json={}, headers=admin_headers)
        assert reapprove_resp.status_code == 204, reapprove_resp.text

        # Consumed by the republish — locked again without a fresh request.
        relocked_resp = client.patch(
            f"/api/v1/forms/adhoc/{form_id}/draft",
            json={"definition": sample_definition_json(subsidiary_row.name), "config": sample_config_json(["ff"])},
            headers=standard_headers,
        )
        assert relocked_resp.status_code == 409

    def test_rejected_request_keeps_form_locked_and_allows_a_new_request(
        self, client: TestClient, admin_headers: dict, standard_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = self._publish_adhoc_form(client, admin_headers, standard_headers, subsidiary_row, project_code_row)

        request_resp = client.post(f"/api/v1/forms/{form_id}/update-request", json={}, headers=standard_headers)
        request_id = request_resp.json()["id"]

        reject_resp = client.post(
            f"/api/v1/admin/forms/{form_id}/update-requests/{request_id}/reject", json={"reviewNote": "not needed"}, headers=admin_headers
        )
        assert reject_resp.status_code == 204, reject_resp.text

        still_locked = client.patch(
            f"/api/v1/forms/adhoc/{form_id}/draft",
            json={"definition": sample_definition_json(subsidiary_row.name), "config": sample_config_json(["ff"])},
            headers=standard_headers,
        )
        assert still_locked.status_code == 409

        own_status = client.get(f"/api/v1/forms/{form_id}/update-request", headers=standard_headers)
        assert own_status.json()["status"] == "rejected"

        new_request_resp = client.post(f"/api/v1/forms/{form_id}/update-request", json={}, headers=standard_headers)
        assert new_request_resp.status_code == 201, new_request_resp.text


class TestDeployLockAndUpdateRequestContributions:
    def test_contribution_allowed_before_deploy_locked_after_deploy_and_bypassed_by_approved_request(
        self, client: TestClient, monkeypatch, admin_headers: dict, standard_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)

        content: dict = {}

        # Published but not yet deployed — still open, same as before this feature.
        first_resp = client.post(f"/api/v1/forms/{form_id}/contributions", json={"content": content}, headers=standard_headers)
        assert first_resp.status_code == 201, first_resp.text

        _deploy_form(client, monkeypatch, admin_headers, form_id)

        locked_resp = client.post(f"/api/v1/forms/{form_id}/contributions", json={"content": content}, headers=standard_headers)
        assert locked_resp.status_code == 409

        draft_locked_resp = client.patch(f"/api/v1/forms/{form_id}/contributions/draft", json={"content": content}, headers=standard_headers)
        assert draft_locked_resp.status_code == 409

        request_resp = client.post(f"/api/v1/forms/{form_id}/update-request", json={}, headers=standard_headers)
        assert request_resp.status_code == 201, request_resp.text
        request_id = request_resp.json()["id"]

        approve_resp = client.post(
            f"/api/v1/admin/forms/{form_id}/update-requests/{request_id}/approve", json={}, headers=admin_headers
        )
        assert approve_resp.status_code == 204, approve_resp.text

        unlocked_resp = client.post(f"/api/v1/forms/{form_id}/contributions", json={"content": content}, headers=standard_headers)
        assert unlocked_resp.status_code == 201, unlocked_resp.text

    def test_republish_without_redeploy_reopens_the_contribution_window_even_without_a_request(
        self, client: TestClient, monkeypatch, admin_headers: dict, standard_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        """Deploying v1, then republishing v2 (never redeploying it), should
        re-open the edit window on its own — publishedVersionId no longer
        matches lastDeployedVersionId, so is_edit_locked_post_deploy is false
        again without needing an update request at all."""
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        _deploy_form(client, monkeypatch, admin_headers, form_id)

        content: dict = {}
        locked_resp = client.post(f"/api/v1/forms/{form_id}/contributions", json={"content": content}, headers=standard_headers)
        assert locked_resp.status_code == 409

        republish_resp = client.post(f"/api/v1/admin/forms/{form_id}/publish", headers=admin_headers)
        assert republish_resp.status_code == 200, republish_resp.text

        reopened_resp = client.post(f"/api/v1/forms/{form_id}/contributions", json={"content": content}, headers=standard_headers)
        assert reopened_resp.status_code == 201, reopened_resp.text
