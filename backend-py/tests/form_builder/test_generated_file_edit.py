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
from app.models.form import Form
from app.models.generated_file import GeneratedFile as GeneratedFileEntity
from app.models.project_code import ProjectCode
from app.models.subsidiary import Subsidiary
from app.services import form_builder_service
from tests.form_builder.conftest import (
    create_admin_draft_form,
    create_and_publish_admin_form,
    sample_config_json,
    sample_definition_json,
)


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


class TestHandEditDoesNotSurviveRepublish:
    """The form definition is the single source of truth — every publish
    regenerates every file purely from it, full stop. A hand-edit made via
    Edit Files only lasts until the next publish; it is never carried
    forward (an earlier version of publish_form did carry it forward, which
    meant a config-level change, like a newly-required field, could keep
    silently producing stale output for any file that happened to have an
    old hand-edit — exactly the "two versions of one campaign" problem a
    form shouldn't have)."""

    def test_republishing_discards_the_hand_edited_content(
        self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        files = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        js_file = next(f for f in files if f["fileType"] == "js")
        original = client.get(f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", headers=admin_headers).json()["content"]
        edited_content = original + "\n// hand-added by an admin\n"

        resp = client.put(
            f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", json={"content": edited_content}, headers=admin_headers
        )
        assert resp.status_code == 200, resp.text

        # Re-publish the same form (e.g. after an unrelated draft change) —
        # every file, including this hand-edited one, must come back purely
        # freshly generated.
        publish_resp = client.post(f"/api/v1/admin/forms/{form_id}/publish", headers=admin_headers)
        assert publish_resp.status_code == 200, publish_resp.text

        republished_files = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        # Several "js" files can exist per form (FF/OC variants x languages) —
        # match on the exact file name the edit was made against, not just
        # "the first js file", since list ordering isn't guaranteed.
        republished_js = next(f for f in republished_files if f["fileName"] == js_file["fileName"])
        assert republished_js["id"] != js_file["id"], "publish must have produced a new GeneratedFile row"
        assert republished_js["editedAt"] is None
        assert republished_js["editedByUserId"] is None

        republished_content = client.get(
            f"/api/v1/admin/forms/{form_id}/files/{republished_js['id']}", headers=admin_headers
        ).json()["content"]
        assert republished_content == original
        assert republished_content != edited_content

    def test_republishing_a_never_edited_file_stays_freshly_generated(
        self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)

        publish_resp = client.post(f"/api/v1/admin/forms/{form_id}/publish", headers=admin_headers)
        assert publish_resp.status_code == 200, publish_resp.text

        republished_files = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        assert all(f["editedAt"] is None and f["editedByUserId"] is None for f in republished_files)


class TestDraftFiles:
    """Edit Files also works before a form is ever published — GET
    /{id}/files generates the file list from the draft definition the first
    time it's needed (ensure_draft_generated_files), a hand-edit survives
    further Save Draft calls untouched (Save Draft never regenerates while
    files already exist), "Regenerate" explicitly discards hand-edits and
    rebuilds fresh, and — unlike TestHandEditDoesNotSurviveRepublish's two
    scenarios, where the edit was made directly on an *already-published*
    version that the next publish never reads from in the first place — a
    hand-edit made on the draft that's actually about to be published DOES
    carry into that publish, as long as nothing structural (which
    questions/fields exist) changed since. See publish_form's own doc
    comment on structureFingerprint."""

    def test_listing_a_draft_generates_files_on_first_access(
        self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_admin_draft_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)

        resp = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers)
        assert resp.status_code == 200, resp.text
        files = resp.json()
        assert {f["fileType"] for f in files} == {"html", "js", "css", "data-js"}
        assert all(f["editedAt"] is None for f in files)

        # Listing again must return the exact same rows, not regenerate.
        again = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        assert {f["id"] for f in again} == {f["id"] for f in files}

    def test_a_standard_user_cannot_list_or_edit_draft_files(
        self, client: TestClient, admin_headers: dict, standard_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_admin_draft_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        assert client.get(f"/api/v1/admin/forms/{form_id}/files", headers=standard_headers).status_code == 403

    def test_draft_hand_edit_survives_a_save_draft_call(
        self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_admin_draft_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        files = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        js_file = next(f for f in files if f["fileType"] == "js")
        original = client.get(f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", headers=admin_headers).json()["content"]
        edited_content = original + "\n// hand-added before first publish\n"

        put_resp = client.put(
            f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", json={"content": edited_content}, headers=admin_headers
        )
        assert put_resp.status_code == 200, put_resp.text

        # Save Draft again (definition/config unchanged content-wise, but a
        # real resave all the same) must not touch the already-generated,
        # hand-edited files.
        draft_resp = client.patch(
            f"/api/v1/admin/forms/{form_id}/draft",
            json={"definition": sample_definition_json(subsidiary_row.name), "config": sample_config_json(["ff", "oc"])},
            headers=admin_headers,
        )
        assert draft_resp.status_code == 204, draft_resp.text

        after_save = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        same_file = next(f for f in after_save if f["id"] == js_file["id"])
        assert same_file["editedAt"] is not None
        reread = client.get(f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", headers=admin_headers).json()
        assert reread["content"] == edited_content

    def test_regenerate_discards_hand_edits_and_rebuilds_fresh(
        self, client: TestClient, admin_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_admin_draft_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        files = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        js_file = next(f for f in files if f["fileType"] == "js")
        client.put(
            f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", json={"content": "// hand-edited"}, headers=admin_headers
        )

        resp = client.post(f"/api/v1/admin/forms/{form_id}/files/regenerate", headers=admin_headers)
        assert resp.status_code == 200, resp.text
        regenerated = resp.json()
        assert all(f["editedAt"] is None for f in regenerated)
        # Rows are deleted and recreated, not merely reset in place.
        assert js_file["id"] not in {f["id"] for f in regenerated}

    def test_a_standard_user_cannot_regenerate(
        self, client: TestClient, admin_headers: dict, standard_headers: dict, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_admin_draft_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        resp = client.post(f"/api/v1/admin/forms/{form_id}/files/regenerate", headers=standard_headers)
        assert resp.status_code == 403

    def test_draft_hand_edit_carries_into_first_publish(
        self,
        client: TestClient,
        admin_headers: dict,
        db_session: Session,
        subsidiary_row: Subsidiary,
        project_code_row: ProjectCode,
    ):
        form_id = create_admin_draft_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        files = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        js_file = next(f for f in files if f["fileType"] == "js")
        original_content = client.get(f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", headers=admin_headers).json()["content"]
        edited_content = original_content + "\n// hand-added pre-publish\n"
        client.put(f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", json={"content": edited_content}, headers=admin_headers)

        pre_publish_draft_version_id = db_session.get(Form, form_id).currentDraftVersionId

        publish_resp = client.post(f"/api/v1/admin/forms/{form_id}/publish", headers=admin_headers)
        assert publish_resp.status_code == 200, publish_resp.text

        # A first-ever publish has no prior structureFingerprint to compare
        # against, so nothing can conflict — the hand-edit carries straight
        # through, editedAt/editedByUserId stamp included.
        published_files = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        published_js = next(f for f in published_files if f["fileName"] == js_file["fileName"])
        assert published_js["editedAt"] is not None
        assert published_js["editedByUserId"] is not None
        published_content = client.get(
            f"/api/v1/admin/forms/{form_id}/files/{published_js['id']}", headers=admin_headers
        ).json()["content"]
        assert published_content == edited_content
        assert published_content != original_content

        # The pre-publish draft's own GeneratedFile rows (same formVersionId
        # as what's now published, since publish_form promotes that row in
        # place) must have been replaced, not duplicated.
        db_session.expire_all()
        remaining = (
            db_session.query(GeneratedFileEntity)
            .filter(GeneratedFileEntity.formVersionId == pre_publish_draft_version_id)
            .all()
        )
        assert len(remaining) == len(published_files)

        # The fresh draft publish_form clones afterward inherits the same
        # hand-edited content too — an admin can keep building on it.
        new_draft_files = (
            db_session.query(GeneratedFileEntity)
            .filter(GeneratedFileEntity.formVersionId == db_session.get(Form, form_id).currentDraftVersionId)
            .all()
        )
        new_draft_js = next(f for f in new_draft_files if f.fileName == js_file["fileName"])
        assert new_draft_js.editedAt is not None
        with open(form_builder_service.absolute_file_path(new_draft_js.filePath), "r", encoding="utf-8", newline="") as fh:
            assert fh.read() == edited_content

    def test_a_structural_change_blocks_publish_until_confirmed_then_resets_only_affected_files(
        self,
        client: TestClient,
        admin_headers: dict,
        db_session: Session,
        subsidiary_row: Subsidiary,
        project_code_row: ProjectCode,
    ):
        form_id = create_admin_draft_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        files = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        html_file = next(f for f in files if f["fileType"] == "html")
        js_file = next(f for f in files if f["fileType"] == "js")
        css_file = next(f for f in files if f["fileType"] == "css")
        html_original = client.get(f"/api/v1/admin/forms/{form_id}/files/{html_file['id']}", headers=admin_headers).json()["content"]
        js_original = client.get(f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", headers=admin_headers).json()["content"]
        css_original = client.get(f"/api/v1/admin/forms/{form_id}/files/{css_file['id']}", headers=admin_headers).json()["content"]
        client.put(f"/api/v1/admin/forms/{form_id}/files/{html_file['id']}", json={"content": html_original + "\n<!-- hand-edit -->\n"}, headers=admin_headers)
        # JS (the per-language behavior script) is byte-identical regardless of
        # question/field structure — a hand-edit to it (e.g. a redirect URL)
        # must never be reset by a structural change, same as CSS.
        client.put(f"/api/v1/admin/forms/{form_id}/files/{js_file['id']}", json={"content": js_original + "\n// hand-edit\n"}, headers=admin_headers)
        client.put(f"/api/v1/admin/forms/{form_id}/files/{css_file['id']}", json={"content": css_original + "\n.hand-edit{}\n"}, headers=admin_headers)

        # First publish (no prior fingerprint — nothing can conflict yet).
        assert client.post(f"/api/v1/admin/forms/{form_id}/publish", headers=admin_headers).status_code == 200

        # Now add a new question — a genuine structural change. Order must
        # be sequential starting at 1 (validate_form_definition enforces
        # this), so it continues straight on from the sample's own questions.
        definition = sample_definition_json(subsidiary_row.name)
        next_order = len(definition["questions"]) + 1
        definition["questions"].append(
            {
                "id": "Q99", "order": next_order, "controlType": "radio", "required": False,
                "headingByLocale": {"en_GB": "New?"}, "answers": [
                    {"id": "A99", "order": 1, "textByLocale": {"en_GB": "Yes"}},
                    {"id": "A100", "order": 2, "textByLocale": {"en_GB": "No"}},
                ],
            }
        )
        draft_resp = client.patch(
            f"/api/v1/admin/forms/{form_id}/draft",
            json={"definition": definition, "config": sample_config_json(["ff", "oc"])},
            headers=admin_headers,
        )
        assert draft_resp.status_code == 204, draft_resp.text

        conflict = client.post(f"/api/v1/admin/forms/{form_id}/publish", headers=admin_headers)
        assert conflict.status_code == 409, conflict.text
        affected = set(conflict.json()["affectedFiles"])
        # Only HTML embeds per-question markup, so only it is fingerprint-checked.
        assert affected == {html_file["fileName"]}

        forced = client.post(f"/api/v1/admin/forms/{form_id}/publish", json={"force": True}, headers=admin_headers)
        assert forced.status_code == 200, forced.text

        after = client.get(f"/api/v1/admin/forms/{form_id}/files", headers=admin_headers).json()
        after_html = next(f for f in after if f["fileName"] == html_file["fileName"])
        assert after_html["editedAt"] is None  # reset — the question list changed

        after_js = next(f for f in after if f["fileName"] == js_file["fileName"])
        assert after_js["editedAt"] is not None  # js hand-edit untouched throughout
        after_js_content = client.get(f"/api/v1/admin/forms/{form_id}/files/{after_js['id']}", headers=admin_headers).json()["content"]
        assert after_js_content == js_original + "\n// hand-edit\n"

        after_css = next(f for f in after if f["fileName"] == css_file["fileName"])
        after_css_content = client.get(f"/api/v1/admin/forms/{form_id}/files/{after_css['id']}", headers=admin_headers).json()["content"]
        assert after_css_content == css_original + "\n.hand-edit{}\n"  # css hand-edit untouched throughout
