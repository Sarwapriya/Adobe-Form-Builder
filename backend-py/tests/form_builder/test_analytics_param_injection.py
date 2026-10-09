"""Publishing injects real Adobe Campaign tracking values into the data
file's `param`/`param.analytics` objects (apiEndpoint by SFTP deployment
environment, project from the form's own project code, reportSuiteID from
its subsidiary) — see form_builder_service._resolve_analytics_param_updates,
called from publish_form. These used to be left as the generic tool's blank
defaults; this is a deliberate product-specific override."""

from __future__ import annotations

import json

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.form import Form
from app.models.generated_file import GeneratedFile as GeneratedFileEntity
from app.models.project_code import ProjectCode
from app.models.subsidiary import Subsidiary
from app.services.admin_settings_service import set_admin_setting
from app.services.file_service import absolute_file_path
from tests.form_builder.conftest import create_and_publish_admin_form


def _read_data_js_param(db: Session, form_id: str) -> dict:
    form = db.get(Form, form_id)
    data_file = db.execute(
        select(GeneratedFileEntity).where(
            GeneratedFileEntity.formVersionId == form.publishedVersionId, GeneratedFileEntity.fileType == "data-js"
        )
    ).scalar_one()
    with open(absolute_file_path(data_file.filePath), "r", encoding="utf-8") as f:
        contents = f.read()

    # `const param = {...};` is one top-level statement in the generated
    # file (see buildDataJs.ts) — isolate and parse just that block.
    marker = "const param = "
    start = contents.index(marker) + len(marker)
    end = contents.index(";\n", start)
    return json.loads(contents[start:end])


class TestAnalyticsParamInjection:
    def test_publish_injects_project_and_fixed_constants(
        self, client: TestClient, admin_headers: dict, db_session: Session, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        param = _read_data_js_param(db_session, form_id)

        assert param["project"] == project_code_row.code
        assert param["channel"] == {"fullForm": "COM", "oneClick": "EMAIL"}
        assert param["channelDetail"] == {"fullForm": "COM", "oneClick": "EMAIL"}
        assert param["source"] == {"fullForm": "full_form", "oneClick": "one_click"}
        assert param["voucherRequired"] == "N"
        assert param["reCaptchaSiteKey"] == ""
        assert param["redirectAfterSuccessInSecond"] == "5"
        assert param["analytics"]["enabled"] is True
        assert param["analytics"]["imsOrgID"] == "3D4865E655DF7BD27F000101@AdobeOrg"
        assert param["analytics"]["datastreamID"] == "fc12b34c-0f82-454d-a76e-4b923ba4a679"

    def test_publish_injects_the_subsidiarys_own_report_suite_id(
        self, client: TestClient, admin_headers: dict, db_session: Session, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        subsidiary_row.reportSuiteId = "sssamsung4test"
        db_session.commit()

        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        param = _read_data_js_param(db_session, form_id)

        assert param["analytics"]["reportSuiteID"] == "sssamsung4test"

    def test_a_subsidiary_with_no_report_suite_id_publishes_without_the_key(
        self, client: TestClient, admin_headers: dict, db_session: Session, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        """analytics.model_dump(exclude_none=True) (build_data_js.py) omits
        an unset key entirely rather than emitting `null` — matching the
        real reference data file's own convention."""
        assert subsidiary_row.reportSuiteId is None
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        param = _read_data_js_param(db_session, form_id)

        assert "reportSuiteID" not in param["analytics"]
        assert param["analytics"]["enabled"] is True

    def test_apiendpoint_follows_the_active_sftp_environment(
        self, client: TestClient, admin_headers: dict, db_session: Session, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        set_admin_setting(db_session, "sftpActiveEnvironment", "production")
        db_session.commit()
        prod_form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        prod_param = _read_data_js_param(db_session, prod_form_id)
        assert prod_param["apiEndpoint"] == "https://res6.mena2p.crm.samsung.com/ingest"

        set_admin_setting(db_session, "sftpActiveEnvironment", "staging")
        db_session.commit()
        staging_form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        staging_param = _read_data_js_param(db_session, staging_form_id)
        assert staging_param["apiEndpoint"] == "https://samsung-mena-mid-stage5-all-res.adobe-campaign.com/ingest"

    def test_fallback_language_is_still_the_forms_own_default_locale(
        self, client: TestClient, admin_headers: dict, db_session: Session, subsidiary_row: Subsidiary, project_code_row: ProjectCode
    ):
        form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name, project_code=project_code_row.code)
        param = _read_data_js_param(db_session, form_id)
        assert param["fallbackLanguage"] == "en_GB"
