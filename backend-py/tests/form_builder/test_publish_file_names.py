"""Publishing a form stores one page per language, named per the convention in
`app/form_pipeline/codegen/file_names.py`, with the form's own project code
(`Form.projectCode`, injected at generation time by `publish_form` — the code is
not part of the stored draft config or the form definition)."""

from __future__ import annotations

import json

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.generated_file import GeneratedFile as GeneratedFileEntity
from app.models.project_code import ProjectCode
from app.models.subsidiary import Subsidiary
from app.services.preview_service import build_form_version_preview
from tests.form_builder.conftest import create_and_publish_admin_form


def _stored_files(db: Session, form_id: str) -> set[tuple[str, str]]:
    form = db.get(Form, form_id)
    rows = db.execute(
        select(GeneratedFileEntity).where(GeneratedFileEntity.formVersionId == form.publishedVersionId)
    ).scalars()
    return {(r.fileName, r.fileType) for r in rows}


class TestPublishedFileNames:
    def test_files_are_named_per_language_with_the_forms_project_code(
        self, client: TestClient, admin_headers: dict, db_session: Session, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        sub, code = subsidiary_row.name, project_code_row.code
        form_id = create_and_publish_admin_form(client, admin_headers, sub, project_code=code)

        # The sample form has two languages (en_GB + ar_AE), both variants requested.
        assert _stored_files(db_session, form_id) == {
            (f"{sub}_{code}.js", "data-js"),
            (f"EN-{code}.css", "css"),
            (f"AR-{code}.css", "css"),
            (f"{sub}-EN_{code}_FF.html", "html"),
            (f"{sub}-AR_{code}_FF.html", "html"),
            (f"{sub}-EN_{code}_OC.html", "html"),
            (f"{sub}-AR_{code}_OC.html", "html"),
            (f"{sub}-EN_{code}_FF.js", "js"),
            (f"{sub}-AR_{code}_FF.js", "js"),
            (f"{sub}-EN_{code}_OC.js", "js"),
            (f"{sub}-AR_{code}_OC.js", "js"),
        }

    def test_a_form_without_a_project_code_gets_the_short_names(
        self, client: TestClient, admin_headers: dict, db_session: Session, subsidiary_row: Subsidiary
    ):
        sub = subsidiary_row.name
        form_id = create_and_publish_admin_form(client, admin_headers, sub, project_code=None, variants=["ff"])

        assert _stored_files(db_session, form_id) == {
            (f"{sub}.js", "data-js"),
            ("EN.css", "css"),
            ("AR.css", "css"),
            (f"{sub}-EN_FF.html", "html"),
            (f"{sub}-AR_FF.html", "html"),
            (f"{sub}-EN_FF.js", "js"),
            (f"{sub}-AR_FF.js", "js"),
        }

    def test_the_published_version_records_the_project_code_but_the_fresh_draft_does_not(
        self, client: TestClient, admin_headers: dict, db_session: Session, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        code = project_code_row.code
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=code)
        form = db_session.get(Form, form_id)

        published = db_session.get(FormVersion, form.publishedVersionId)
        assert json.loads(published.config)["projectCode"] == code

        draft = db_session.get(FormVersion, form.currentDraftVersionId)
        assert draft.id != published.id
        assert json.loads(draft.config).get("projectCode") is None

    def test_preview_serves_the_default_languages_page_with_its_own_css_and_js_inlined(
        self, client: TestClient, admin_headers: dict, db_session: Session, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        sub, code = subsidiary_row.name, project_code_row.code
        form_id = create_and_publish_admin_form(client, admin_headers, sub, project_code=code)

        for variant in ("ff", "oc"):
            result = build_form_version_preview(db_session, form_id, variant, strict=True)
            assert result["outcome"] == "ok"
            html = result["html"]
            assert '<html lang="en" dir="ltr">' in html
            assert 'param["fallbackLanguage"] = "en_GB";' in html
            assert "const fields = " in html  # the shared data file is inlined
            # every external reference was replaced by its inline equivalent
            assert f'href="EN-{code}.css"' not in html
            assert f'src="{sub}_{code}.js"' not in html
            assert f'src="{sub}-EN_{code}_{variant.upper()}.js"' not in html
            # ...and the other language's page was not the one served
            assert 'param["fallbackLanguage"] = "ar_AE";' not in html
