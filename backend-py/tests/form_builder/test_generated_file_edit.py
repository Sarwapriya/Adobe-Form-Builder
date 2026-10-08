"""Edit Files window: GET /{id}/files, GET /{id}/files/{fileId}, PUT
/{id}/files/{fileId} — hand-editing one of a published form's generated
files in place (form_builder_service.update_generated_file_content). See
that function's own doc comment for why no other code path (preview,
download, deploy) needs to change for an edit to take effect."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.errors import NotFoundError, ValidationError
from app.models.project_code import ProjectCode
from app.models.subsidiary import Subsidiary
from app.services import form_builder_service
from tests.form_builder.conftest import create_and_publish_admin_form


class TestListAndGetGeneratedFiles:
    def test_lists_every_file_type_for_the_published_version(
        self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)

        resp = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers)
        assert resp.status_code == 200, resp.text
        files = resp.json()
        file_types = {f["fileType"] for f in files}
        assert file_types == {"html", "js", "css", "data-js"}
        assert all(f["editedAt"] is None and f["editedByUserId"] is None for f in files)

    def test_get_one_files_content_matches_what_was_generated(
        self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        files = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        js_file = next(f for f in files if f["fileType"] == "js")

        resp = client.get(f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", headers=admin_headers)
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["fileName"] == js_file["fileName"]
        assert len(body["content"]) > 0

    def test_a_standard_user_cannot_list_or_read_generated_files(
        self, client: TestClient, admin_headers: dict, standard_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)

        assert client.get(f"/api/v1/admin/forms/{form_id}/files", headers=standard_headers).status_code == 403

    def test_listing_a_draft_never_published_form_is_rejected(
        self, client: TestClient, admin_headers: dict, db_session: Session, subsidiary_row: Subsidiary
    ):
        create_resp = client.post(
            "/api/v1/admin/forms/", json={"name": "Never Published", "subsidiaryId": subsidiary_row.name}, headers=admin_headers
        )
        assert create_resp.status_code == 201, create_resp.text
        form_id = create_resp.json()["id"]

        with pytest.raises(ValidationError):
            form_builder_service.list_generated_files(db_session, form_id)

    def test_listing_a_nonexistent_form_is_not_found(self, db_session: Session):
        with pytest.raises(NotFoundError):
            form_builder_service.list_generated_files(db_session, "00000000-0000-0000-0000-000000000000")


class TestUpdateGeneratedFileContent:
    def test_save_overwrites_the_file_and_stamps_who_and_when(
        self, client: TestClient, admin_headers: dict, admin_user, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        files = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        js_file = next(f for f in files if f["fileType"] == "js")

        original = client.get(f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", headers=admin_headers).json()["content"]
        new_content = original + "\n// hand-added by an admin\n"

        resp = client.put(
            f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", json={"content": new_content}, headers=admin_headers
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["editedAt"] is not None
        assert body["editedByUserId"] == admin_user.id

        reread = client.get(f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", headers=admin_headers).json()
        assert reread["content"] == new_content
        assert reread["editedAt"] is not None

        # the file list itself reflects the edit too, not just the single-file read
        listed = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        edited_entry = next(f for f in listed if f["id"] == js_file["id"])
        assert edited_entry["editedAt"] is not None
        assert edited_entry["editedByUserId"] == admin_user.id

    def test_rejects_unbalanced_js_content(
        self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        files = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        js_file = next(f for f in files if f["fileType"] == "js")

        resp = client.put(
            f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", json={"content": "function f() {"}, headers=admin_headers
        )
        assert resp.status_code == 400, resp.text

        # the on-disk file (and its editedAt) must be untouched by the rejected save
        reread = client.get(f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", headers=admin_headers).json()
        assert reread["content"] != "function f() {"
        assert reread["editedAt"] is None

    def test_rejects_empty_content(
        self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        files = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        html_file = next(f for f in files if f["fileType"] == "html")

        resp = client.put(f"/api/v1/admin/forms/{form_id}/files/{html_file['id']}", json={"content": "   "}, headers=admin_headers)
        assert resp.status_code == 400, resp.text

    def test_the_js_balance_guard_does_not_apply_to_html_or_css(
        self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        """HTML/CSS are saved as typed — an admin hand-editing markup/styles
        shouldn't be blocked by a brace-matching heuristic meant for JS."""
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        files = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        css_file = next(f for f in files if f["fileType"] == "css")

        resp = client.put(
            f"/api/v1/admin/forms/{form_id}/files/{css_file['id']}", json={"content": ".foo { color: red;"}, headers=admin_headers
        )
        assert resp.status_code == 200, resp.text

    def test_a_standard_user_cannot_save_an_edit(
        self, client: TestClient, admin_headers: dict, standard_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        files = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        js_file = next(f for f in files if f["fileType"] == "js")

        resp = client.put(
            f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", json={"content": "// x"}, headers=standard_headers
        )
        assert resp.status_code == 403

    def test_unknown_file_id_is_not_found(self, db_session: Session, admin_user, subsidiary_row: Subsidiary, project_code_row: ProjectCode, client: TestClient, admin_headers: dict):
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        with pytest.raises(NotFoundError):
            form_builder_service.get_generated_file_content(db_session, form_id, "00000000-0000-0000-0000-000000000000")
