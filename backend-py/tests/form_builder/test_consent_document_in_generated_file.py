"""End-to-end: an uploaded Terms & Conditions / Privacy Policy PDF's resolved
URL must actually reach the published data.js's `fields[locale].
privacyPolicyLink.url` / `termsAndConditionsLink.url` — the whole reason to
upload one at all. Covers the full chain: upload (patches the draft) ->
publish (regenerates from that draft) -> read the real file back off disk,
same as a deployed form would serve it."""

from __future__ import annotations

import io
import json

from pypdf import PdfWriter
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.form import Form
from app.models.generated_file import GeneratedFile as GeneratedFileEntity
from app.services.file_service import absolute_file_path
from tests.form_builder.conftest import create_admin_draft_form


def _pdf_bytes() -> bytes:
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def _read_fields_block(db: Session, form_id: str) -> dict:
    form = db.get(Form, form_id)
    data_file = db.execute(
        select(GeneratedFileEntity).where(
            GeneratedFileEntity.formVersionId == form.publishedVersionId, GeneratedFileEntity.fileType == "data-js"
        )
    ).scalar_one()
    with open(absolute_file_path(data_file.filePath), "r", encoding="utf-8") as f:
        contents = f.read()
    marker = "const fields = "
    start = contents.index(marker) + len(marker)
    end = contents.index(";\n", start)
    return json.loads(contents[start:end])


def test_uploaded_privacy_policy_url_reaches_the_published_data_js(client, db_session, admin_headers, subsidiary_row):
    form_id = create_admin_draft_form(client, admin_headers, subsidiary_row.name)
    upload_resp = client.post(
        f"/api/v1/admin/forms/{form_id}/consent-documents",
        data={"kind": "privacyPolicy"},
        files={"file": ("policy.pdf", _pdf_bytes(), "application/pdf")},
        headers=admin_headers,
    )
    assert upload_resp.status_code == 200, upload_resp.text
    expected_url = upload_resp.json()["url"]

    publish_resp = client.post(f"/api/v1/admin/forms/{form_id}/publish", headers=admin_headers)
    assert publish_resp.status_code == 200, publish_resp.text

    fields = _read_fields_block(db_session, form_id)
    for locale_fields in fields.values():
        assert locale_fields["privacyPolicyLink"]["url"] == expected_url


def test_uploaded_terms_and_conditions_url_reaches_the_published_data_js(client, db_session, admin_headers, subsidiary_row):
    form_id = create_admin_draft_form(client, admin_headers, subsidiary_row.name)
    upload_resp = client.post(
        f"/api/v1/admin/forms/{form_id}/consent-documents",
        data={"kind": "termsAndConditions"},
        files={"file": ("terms.pdf", _pdf_bytes(), "application/pdf")},
        headers=admin_headers,
    )
    assert upload_resp.status_code == 200, upload_resp.text
    expected_url = upload_resp.json()["url"]

    publish_resp = client.post(f"/api/v1/admin/forms/{form_id}/publish", headers=admin_headers)
    assert publish_resp.status_code == 200, publish_resp.text

    fields = _read_fields_block(db_session, form_id)
    for locale_fields in fields.values():
        assert locale_fields["termsAndConditionsLink"]["url"] == expected_url
