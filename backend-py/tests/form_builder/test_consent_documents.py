"""Admin/subsidiary PDF upload backing a form's Terms & Conditions /
Privacy Policy Link URL — see consent_document_service.py and
form_builder_service.upload_consent_document. Real DB; SFTP mocked where it
matters (deploy_form's push)."""

from __future__ import annotations

import io
import json

import pytest
from pypdf import PdfWriter
from sqlalchemy.orm import Session

from app.form_pipeline import FormDefinition
from app.models.form_version import FormVersion
from app.services import consent_document_service as svc
from app.services.sftp_service import SftpDeployResult
from tests.form_builder.conftest import (
    create_admin_draft_form,
    create_and_publish_admin_form,
    sample_config_json,
    sample_definition_json,
    unique_name,
)


def _pdf_bytes(encrypt_with: str | None = None) -> bytes:
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    if encrypt_with:
        writer.encrypt(user_password=encrypt_with, owner_password=None)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def _draft_definition(db_session: Session, form_id: str) -> FormDefinition:
    from app.models.form import Form

    form = db_session.get(Form, form_id)
    db_session.refresh(form)
    version = db_session.get(FormVersion, form.currentDraftVersionId)
    db_session.refresh(version)
    return FormDefinition.model_validate_json(version.definition)


# --- pure functions -----------------------------------------------------------


def test_build_file_name_follows_the_convention():
    name = svc.build_file_name("My Policy Doc.pdf", "SGE", "termsAndConditions")
    assert name.startswith("My_Policy_Doc_SGE_TnC_") and name.endswith(".pdf")
    assert svc.build_file_name("x.pdf", "SGE", "privacyPolicy").split("_")[-2] == "PVC"


def test_resolve_sample_url_joins_the_given_base_url():
    assert svc.resolve_sample_url("a.pdf", "https://res6.mena2p.crm.samsung.com/res/tracking/") == (
        "https://res6.mena2p.crm.samsung.com/res/tracking/a.pdf"
    )
    assert svc.resolve_sample_url("a.pdf", "https://res6.mena2p.crm.samsung.com/res/tracking") == (
        "https://res6.mena2p.crm.samsung.com/res/tracking/a.pdf"
    )  # trailing slash optional on the configured base URL


def test_validate_pdf_accepts_a_real_readable_pdf():
    assert svc.validate_pdf("doc.pdf", _pdf_bytes()) is None


def test_validate_pdf_rejects_wrong_extension():
    assert svc.validate_pdf("doc.docx", _pdf_bytes()) == svc.WRONG_FORMAT_MESSAGE


def test_validate_pdf_rejects_wrong_magic_bytes():
    # Named .pdf but isn't one — this is an "unreadable" case, not a "wrong
    # format" one; WRONG_FORMAT_MESSAGE is reserved for the extension check.
    assert svc.validate_pdf("doc.pdf", b"not a pdf at all") == svc.UNREADABLE_MESSAGE


def test_validate_pdf_rejects_oversized_file():
    oversized = b"%PDF-1.7\n" + b"0" * (svc.MAX_SIZE_BYTES + 1)
    assert svc.validate_pdf("doc.pdf", oversized) == "This file is too large (20MB max)."


def test_validate_pdf_rejects_password_protected_file():
    assert svc.validate_pdf("doc.pdf", _pdf_bytes(encrypt_with="secret123")) == svc.UNREADABLE_MESSAGE


def test_validate_pdf_rejects_corrupt_file():
    assert svc.validate_pdf("doc.pdf", b"%PDF-1.7\ngarbage, not a real pdf structure") == svc.UNREADABLE_MESSAGE


# --- through the admin API ------------------------------------------------------


def test_admin_upload_sets_url_for_every_locale(client, db_session, admin_headers, subsidiary_row):
    form_id = create_admin_draft_form(client, admin_headers, subsidiary_row.name)
    resp = client.post(
        f"/api/v1/admin/forms/{form_id}/consent-documents",
        data={"kind": "privacyPolicy"},
        files={"file": ("policy.pdf", _pdf_bytes(), "application/pdf")},
        headers=admin_headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["fileName"].startswith("policy_") and body["fileName"].endswith(".pdf")
    # Default active environment (no deployment-settings configured in this
    # fresh test DB) is "staging" — see sftp_settings_service.get_sftp_deployment_settings.
    assert body["url"] == svc.resolve_sample_url(body["fileName"], "https://res5.africa2s.crm.samsung.com/res/tracking/")

    definition = _draft_definition(db_session, form_id)
    assert definition.fields.privacyPolicy.uploadedFileName == body["fileName"]
    assert definition.fields.privacyPolicy.linkUrlByLocale == {"en_GB": body["url"], "ar_AE": body["url"]}


def test_admin_upload_termsAndConditions_auto_creates_the_field(client, db_session, admin_headers, subsidiary_row):
    form_id = create_admin_draft_form(client, admin_headers, subsidiary_row.name)
    resp = client.post(
        f"/api/v1/admin/forms/{form_id}/consent-documents",
        data={"kind": "termsAndConditions"},
        files={"file": ("terms.pdf", _pdf_bytes(), "application/pdf")},
        headers=admin_headers,
    )
    assert resp.status_code == 200, resp.text
    definition = _draft_definition(db_session, form_id)
    assert definition.fields.termsAndConditions.uploadedFileName == resp.json()["fileName"]


def test_admin_upload_rejects_a_non_pdf(client, admin_headers, subsidiary_row):
    form_id = create_admin_draft_form(client, admin_headers, subsidiary_row.name)
    resp = client.post(
        f"/api/v1/admin/forms/{form_id}/consent-documents",
        data={"kind": "privacyPolicy"},
        files={"file": ("policy.txt", b"hello", "text/plain")},
        headers=admin_headers,
    )
    assert resp.status_code == 400 and "PDF" in resp.json()["error"]


def test_admin_upload_rejects_an_encrypted_pdf(client, admin_headers, subsidiary_row):
    form_id = create_admin_draft_form(client, admin_headers, subsidiary_row.name)
    resp = client.post(
        f"/api/v1/admin/forms/{form_id}/consent-documents",
        data={"kind": "privacyPolicy"},
        files={"file": ("policy.pdf", _pdf_bytes(encrypt_with="secret123"), "application/pdf")},
        headers=admin_headers,
    )
    assert resp.status_code == 400 and resp.json()["error"] == svc.UNREADABLE_MESSAGE


def test_admin_upload_404s_for_an_unknown_form(client, admin_headers):
    import uuid

    resp = client.post(
        f"/api/v1/admin/forms/{uuid.uuid4()}/consent-documents",
        data={"kind": "privacyPolicy"},
        files={"file": ("policy.pdf", _pdf_bytes(), "application/pdf")},
        headers=admin_headers,
    )
    assert resp.status_code == 404


def test_admin_upload_requires_admin(client, standard_headers):
    import uuid

    resp = client.post(
        f"/api/v1/admin/forms/{uuid.uuid4()}/consent-documents",
        data={"kind": "privacyPolicy"},
        files={"file": ("policy.pdf", _pdf_bytes(), "application/pdf")},
        headers=standard_headers,
    )
    assert resp.status_code == 403


# --- through the subsidiary (ad-hoc) API ----------------------------------------


def test_adhoc_upload_sets_url_while_still_editable(client, db_session, standard_headers, project_code_row):
    created = client.post(
        "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": project_code_row.code}, headers=standard_headers
    ).json()
    resp = client.post(
        f"/api/v1/forms/adhoc/{created['id']}/consent-documents",
        data={"kind": "privacyPolicy"},
        files={"file": ("policy.pdf", _pdf_bytes(), "application/pdf")},
        headers=standard_headers,
    )
    assert resp.status_code == 200, resp.text


def test_adhoc_upload_rejected_once_pending_review(client, standard_headers, project_code_row, subsidiary_row, admin_headers):
    created = client.post(
        "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": project_code_row.code}, headers=standard_headers
    ).json()
    client.patch(
        f"/api/v1/forms/adhoc/{created['id']}/draft",
        json={"definition": sample_definition_json(subsidiary_row.name), "config": sample_config_json(["ff"])},
        headers=standard_headers,
    )
    client.post(f"/api/v1/forms/adhoc/{created['id']}/submit-for-review", headers=standard_headers)
    resp = client.post(
        f"/api/v1/forms/adhoc/{created['id']}/consent-documents",
        data={"kind": "privacyPolicy"},
        files={"file": ("policy.pdf", _pdf_bytes(), "application/pdf")},
        headers=standard_headers,
    )
    assert resp.status_code == 409


def test_adhoc_upload_rejected_once_published(client, standard_headers, admin_headers, project_code_row, subsidiary_row):
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

    resp = client.post(
        f"/api/v1/forms/adhoc/{created['id']}/consent-documents",
        data={"kind": "privacyPolicy"},
        files={"file": ("policy.pdf", _pdf_bytes(), "application/pdf")},
        headers=standard_headers,
    )
    assert resp.status_code == 409


def test_adhoc_upload_404s_for_a_form_owned_by_another_subsidiary(client, standard_headers, admin_headers, other_subsidiary_row):
    other_form = client.post(
        "/api/v1/admin/forms/", json={"name": unique_name("Other"), "subsidiaryId": other_subsidiary_row.name}, headers=admin_headers
    ).json()
    resp = client.post(
        f"/api/v1/forms/adhoc/{other_form['id']}/consent-documents",
        data={"kind": "privacyPolicy"},
        files={"file": ("policy.pdf", _pdf_bytes(), "application/pdf")},
        headers=standard_headers,
    )
    assert resp.status_code == 404


# --- deploy pushes the uploaded PDF alongside the generated files --------------


def test_deploy_pushes_the_uploaded_consent_document(client, db_session, admin_headers, subsidiary_row, monkeypatch):
    form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name)
    resp = client.post(
        f"/api/v1/admin/forms/{form_id}/consent-documents",
        data={"kind": "privacyPolicy"},
        files={"file": ("policy.pdf", _pdf_bytes(), "application/pdf")},
        headers=admin_headers,
    )
    file_name = resp.json()["fileName"]

    # Republish so the just-uploaded draft field becomes the *published*
    # version deploy_form actually reads.
    publish_resp = client.post(f"/api/v1/admin/forms/{form_id}/publish", headers=admin_headers)
    assert publish_resp.status_code == 200, publish_resp.text

    captured = {}

    def fake_deploy(db, files):
        captured["remote_names"] = [f.remoteFileName for f in files]
        return SftpDeployResult(ok=True, filesDeployed=len(files), environment="staging")

    from app.services import form_builder_service

    monkeypatch.setattr(form_builder_service, "deploy_generated_files", fake_deploy)
    deploy_resp = client.post(f"/api/v1/admin/forms/{form_id}/deploy", headers=admin_headers)
    assert deploy_resp.status_code == 200, deploy_resp.text
    assert file_name in captured["remote_names"]
