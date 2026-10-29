"""form_builder_service.publish_form: the "a new form is ready for your
subsidiary" notification on an admin-origin form's first publish — see
email_service.send_form_published_notification. Mirrors the background-call
capture pattern test_resource_checks.py uses for its own "manual check"
background assertion, since publish_form's notification is also fired via
run_in_background on a real daemon thread (never directly observable
without capturing the queued callable)."""

from __future__ import annotations

import pytest
from sqlalchemy.orm import Session

from app.services import email_service, form_builder_service
from tests.form_builder.conftest import (
    create_and_publish_admin_form,
    sample_config_json,
    sample_definition_json,
    unique_name,
)


@pytest.fixture
def queued_background(monkeypatch):
    """Captures every run_in_background call from form_builder_service
    instead of actually spawning a thread — the caller then invokes each
    queued callable synchronously against the test's own db_session."""
    queued = []
    monkeypatch.setattr(form_builder_service, "run_in_background", lambda work: queued.append(work))
    return queued


@pytest.fixture
def sent_published_emails(monkeypatch):
    sent = []

    def fake_send(db, recipients, form_name, subsidiary_id):
        sent.append({"recipients": recipients, "form_name": form_name, "subsidiary_id": subsidiary_id})

    monkeypatch.setattr(email_service, "send_form_published_notification", fake_send)
    return sent


def test_first_publish_of_admin_form_notifies_subsidiary(
    client, db_session: Session, admin_headers: dict, subsidiary_row, queued_background, sent_published_emails
):
    form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name)
    assert len(queued_background) == 1
    queued_background[0](db_session)
    assert len(sent_published_emails) == 1
    assert sent_published_emails[0]["subsidiary_id"] == subsidiary_row.name


def test_republish_does_not_notify_again(
    client, db_session: Session, admin_headers: dict, subsidiary_row, queued_background, sent_published_emails
):
    form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name)
    queued_background[0](db_session)
    assert len(sent_published_emails) == 1

    # Edit the draft and publish a second time — already published before
    # this call, so the notification must not fire again.
    client.patch(
        f"/api/v1/admin/forms/{form_id}/draft",
        json={"definition": sample_definition_json(subsidiary_row.name), "config": sample_config_json(["ff"])},
        headers=admin_headers,
    )
    resp = client.post(f"/api/v1/admin/forms/{form_id}/publish", headers=admin_headers)
    assert resp.status_code == 200, resp.text
    assert len(queued_background) == 1  # no second queued notification
    assert len(sent_published_emails) == 1  # unchanged


def test_adhoc_approval_does_not_notify_form_published(
    client, db_session: Session, admin_headers: dict, standard_headers: dict, project_code_row, queued_background, sent_published_emails
):
    """An ad-hoc form's first publish happens via approve_adhoc_form, not a
    plain admin create+publish — it must not also fire the admin-origin
    "form published" notification (that subsidiary already knows about its
    own submission; see publish_form's own doc comment)."""
    created = client.post(
        "/api/v1/forms/adhoc", json={"name": unique_name("Adhoc"), "projectCode": project_code_row.code}, headers=standard_headers
    ).json()
    client.patch(
        f"/api/v1/forms/adhoc/{created['id']}/draft",
        json={"definition": sample_definition_json(created["subsidiaryId"]), "config": sample_config_json(["ff"])},
        headers=standard_headers,
    )
    client.post(f"/api/v1/forms/adhoc/{created['id']}/submit-for-review", headers=standard_headers)
    approve_resp = client.post(f"/api/v1/admin/forms/{created['id']}/adhoc/approve", json={}, headers=admin_headers)
    assert approve_resp.status_code == 204, approve_resp.text

    for work in queued_background:
        work(db_session)
    assert sent_published_emails == []
