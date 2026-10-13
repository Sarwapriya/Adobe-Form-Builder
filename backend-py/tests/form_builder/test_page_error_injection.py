"""Publishing auto-fills `page_error[locale].hrErr` in the data file from the
admin-managed, locale-keyed default table for every locale the form has —
see form_builder_service._resolve_page_error_updates, called from
publish_form. Previously always blank (no builder UI ever set
FormDefinition.pageError), requiring a hand-edit after every publish."""

from __future__ import annotations

import json

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.form import Form
from app.models.generated_file import GeneratedFile as GeneratedFileEntity
from app.models.project_code import ProjectCode
from app.models.subsidiary import Subsidiary
from app.services.file_service import absolute_file_path
from app.services.page_error_locale_default_service import upsert_page_error_locale_default
from tests.form_builder.conftest import create_and_publish_admin_form


def _read_page_error(db: Session, form_id: str) -> dict:
    form = db.get(Form, form_id)
    data_file = db.execute(
        select(GeneratedFileEntity).where(
            GeneratedFileEntity.formVersionId == form.publishedVersionId, GeneratedFileEntity.fileType == "data-js"
        )
    ).scalar_one()
    with open(absolute_file_path(data_file.filePath), "r", encoding="utf-8") as f:
        contents = f.read()

    marker = "const page_error = "
    start = contents.index(marker) + len(marker)
    end = contents.index(";\n", start)
    return json.loads(contents[start:end])


class TestPageErrorInjection:
    def test_a_locale_with_a_configured_default_gets_it_at_publish_time(
        self, client: TestClient, admin_headers: dict, db_session: Session, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        """The sample form definition's own `ar_AE` locale has no pageError
        entry at all (see tests/form_pipeline/fixtures.py) — before this
        feature it would have fallen back to the English default-locale
        copy. A configured master default now wins instead."""
        upsert_page_error_locale_default(
            db_session,
            "ar_AE",
            heading="PYTEST heading",
            sub_heading="PYTEST sub-heading",
            sub_heading_url="https://example.com/pytest",
            sub_heading_url_text="PYTEST link",
        )
        db_session.commit()

        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        page_error = _read_page_error(db_session, form_id)

        assert page_error["ar_AE"]["hrErr"] == {
            "heading": "PYTEST heading",
            "subHeading": "PYTEST sub-heading",
            "subHeadingUrl": "https://example.com/pytest",
            "subHeadingUrlText": "PYTEST link",
        }

    def test_a_locale_with_no_configured_default_keeps_the_forms_own_copy(
        self, client: TestClient, admin_headers: dict, db_session: Session, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        """`en_GB` is the sample form's own default locale and has its own
        pageError entry (heading only) — untouched since no master default
        exists for it."""
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        page_error = _read_page_error(db_session, form_id)

        assert page_error["en_GB"]["hrErr"]["heading"] == "Something went wrong."
        assert page_error["en_GB"]["hrErr"]["subHeading"] == ""
