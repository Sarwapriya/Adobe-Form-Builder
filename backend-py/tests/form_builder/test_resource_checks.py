"""resource_check_service: post-deployment availability checks of published
files on the Adobe frontal servers (real DB; HTTP and email mocked)."""

from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timedelta, timezone

import httpx
import pytest
from sqlalchemy import select, text

from app.models.resource_check import ResourceCheck, ResourceCheckResult
from app.services import email_service, form_builder_service, resource_check_service as svc
from app.services.sftp_service import SftpDeployResult
from tests.form_builder.conftest import create_and_publish_admin_form

FILES = ["SGE-EN_TV2H26_FF.html", "SGE_TV2H26.js"]


@pytest.fixture
def fake_http(monkeypatch):
    """URLs listed in `failing` return 404; everything else 200."""
    state = {"failing": set(), "calls": []}

    def check_urls(urls):
        state["calls"].append(list(urls))
        return [
            {"url": u, "statusCode": 404 if u in state["failing"] else 200, "ok": u not in state["failing"],
             "elapsedMs": 12.0, "error": None}
            for u in urls
        ]

    monkeypatch.setattr(svc, "check_urls", check_urls)
    return state


@pytest.fixture
def sent_emails(monkeypatch):
    sent = []

    def fake_send(db, **kwargs):
        sent.append(kwargs)
        return True

    monkeypatch.setattr(email_service, "send_resource_check_failed_notification", fake_send)
    return sent


def _form_id() -> str:
    return str(uuid.uuid4())


def _schedule(db, form_id=None, due_now=True):
    check = svc.schedule_after_deploy(db, form_id or _form_id(), str(uuid.uuid4()), FILES, None)
    if due_now:
        check.scheduledFor = datetime.now(timezone.utc) - timedelta(seconds=1)
        db.commit()
    return check


def _checks_for(db, form_id):
    return db.execute(select(ResourceCheck).where(ResourceCheck.formId == form_id).order_by(ResourceCheck.createdAt)).scalars().all()


# --- URLs and settings ----------------------------------------------------------

def test_urls_match_the_frontal_server_pattern():
    assert svc.build_url("samsung-mena-mid-prod7-1", "SGE-EN_TV2H26_FF.html") == (
        "https://samsung-mena-mid-prod7-1.campaign.adobe.com/res/tracking/SGE-EN_TV2H26_FF.html"
    )
    assert svc.build_url("cdn.example.com", "a b.js") == "https://cdn.example.com/res/tracking/a%20b.js"


def test_default_settings_are_the_four_mena_servers_and_20_minutes(db_session):
    config = svc.get_resource_check_settings(db_session)
    assert config.enabled and config.delayMinutes == 20 and config.recheckDelayMinutes == 5
    assert config.hosts == svc.DEFAULT_HOSTS and len(config.hosts) == 4


def test_settings_are_cleaned_and_validated(db_session):
    saved = svc.save_resource_check_settings(db_session, True, [" HTTPS://Host-A/ ", "host-a", "host-b"], 30)
    assert saved.hosts == ["host-a", "host-b"] and saved.delayMinutes == 30
    with pytest.raises(svc.ValidationError):
        svc.save_resource_check_settings(db_session, True, ["bad host/../x"], 20)
    with pytest.raises(svc.ValidationError):
        svc.save_resource_check_settings(db_session, True, ["   "], 20)


# --- scheduling -------------------------------------------------------------------

def test_deploy_schedules_a_check_after_the_delay(db_session):
    before = datetime.now(timezone.utc)
    check = svc.schedule_after_deploy(db_session, _form_id(), str(uuid.uuid4()), FILES + FILES, None)
    assert check.status == "scheduled" and check.trigger == "scheduled"
    assert json.loads(check.fileNames) == sorted(FILES)  # de-duplicated
    assert check.totalUrls == len(FILES) * 4
    due = check.scheduledFor if check.scheduledFor.tzinfo else check.scheduledFor.replace(tzinfo=timezone.utc)
    assert timedelta(minutes=19) < due - before < timedelta(minutes=21)


def test_disabled_setting_schedules_nothing(db_session):
    svc.save_resource_check_settings(db_session, False, svc.DEFAULT_HOSTS, 20)
    assert svc.schedule_after_deploy(db_session, _form_id(), str(uuid.uuid4()), FILES, None) is None


# --- running --------------------------------------------------------------------------

def test_all_ok_passes_without_recheck_or_email(db_session, fake_http, sent_emails):
    check = _schedule(db_session)
    done = svc.run_check(db_session, check.id)
    assert done.status == "passed" and done.okUrls == 8 and done.failedUrls == 0
    results = db_session.execute(select(ResourceCheckResult).where(ResourceCheckResult.checkId == check.id)).scalars().all()
    assert len(results) == 8 and {r.host for r in results} == set(svc.DEFAULT_HOSTS)
    assert len(_checks_for(db_session, check.formId)) == 1 and sent_emails == []


def test_first_failure_schedules_one_recheck_without_email(db_session, fake_http, sent_emails):
    fake_http["failing"].add(svc.build_url(svc.DEFAULT_HOSTS[2], FILES[0]))
    check = _schedule(db_session)
    done = svc.run_check(db_session, check.id)
    assert done.status == "failed" and done.failedUrls == 1
    checks = _checks_for(db_session, check.formId)
    assert [c.trigger for c in checks] == ["scheduled", "recheck"] and checks[1].status == "scheduled"
    assert sent_emails == []
    # The re-check waits 5 minutes after the first check completed — not another 20.
    completed = done.completedAt if done.completedAt.tzinfo else done.completedAt.replace(tzinfo=timezone.utc)
    due = checks[1].scheduledFor if checks[1].scheduledFor.tzinfo else checks[1].scheduledFor.replace(tzinfo=timezone.utc)
    assert timedelta(minutes=4, seconds=50) < due - completed < timedelta(minutes=5, seconds=10)


def test_recheck_delay_is_its_own_setting(db_session, fake_http, sent_emails):
    svc.save_resource_check_settings(db_session, True, svc.DEFAULT_HOSTS, 20, 3)
    fake_http["failing"].add(svc.build_url(svc.DEFAULT_HOSTS[0], FILES[0]))
    check = _schedule(db_session)
    svc.run_check(db_session, check.id)
    recheck = _checks_for(db_session, check.formId)[1]
    due = recheck.scheduledFor if recheck.scheduledFor.tzinfo else recheck.scheduledFor.replace(tzinfo=timezone.utc)
    assert timedelta(minutes=2, seconds=50) < due - datetime.now(timezone.utc) <= timedelta(minutes=3)


def test_failed_recheck_emails_admins(db_session, fake_http, sent_emails):
    failing_url = svc.build_url(svc.DEFAULT_HOSTS[1], FILES[1])
    fake_http["failing"].add(failing_url)
    first = _schedule(db_session)
    svc.run_check(db_session, first.id)
    recheck = _checks_for(db_session, first.formId)[1]
    recheck.scheduledFor = datetime.now(timezone.utc) - timedelta(seconds=1)
    db_session.commit()

    done = svc.run_check(db_session, recheck.id)
    assert done.status == "failed" and done.notifiedAt is not None
    assert len(_checks_for(db_session, first.formId)) == 2  # no endless re-checks
    assert len(sent_emails) == 1
    failure = sent_emails[0]["failures"][0]
    assert (failure.file_name, failure.host, failure.problem) == (FILES[1], svc.DEFAULT_HOSTS[1], "HTTP 404")


def test_a_check_runs_only_once(db_session, fake_http, sent_emails):
    check = _schedule(db_session)
    assert svc.run_check(db_session, check.id) is not None
    assert svc.run_check(db_session, check.id) is None
    assert len(fake_http["calls"]) == 1


def test_scheduler_runs_only_due_checks_and_requeues_interrupted(db_session, fake_http, sent_emails):
    due = _schedule(db_session)
    future = _schedule(db_session, due_now=False)
    stuck = _schedule(db_session)
    db_session.execute(
        text("UPDATE fq.ResourceChecks SET status = 'running', startedAt = DATEADD(minute, -30, SYSDATETIMEOFFSET()) WHERE id = :id"),
        {"id": stuck.id},
    )
    db_session.commit()

    svc.run_due_checks(db_session, limit=1000)
    for row in (due, future, stuck):
        db_session.refresh(row)
    assert due.status == "passed" and stuck.status == "passed" and future.status == "scheduled"


def test_http_errors_become_errors_not_exceptions(db_session, monkeypatch, sent_emails):
    def boom(urls):
        raise RuntimeError("network down")

    monkeypatch.setattr(svc, "check_urls", boom)
    check = _schedule(db_session)
    assert svc.run_check(db_session, check.id) is None
    db_session.refresh(check)
    assert check.status == "error" and "network down" in check.errorMessage


def test_real_http_client_head_fallback_and_connection_errors(monkeypatch):
    seen = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append((request.method, request.url.path))
        if request.url.host == "down.example.com":
            raise httpx.ConnectError("refused")
        if request.url.path.endswith("nohead.js") and request.method == "HEAD":
            return httpx.Response(405)
        return httpx.Response(404 if request.url.path.endswith("missing.js") else 200)

    real_client = httpx.AsyncClient
    monkeypatch.setattr(svc.httpx, "AsyncClient", lambda **kw: real_client(transport=httpx.MockTransport(handler), **kw))
    urls = [svc.build_url("ok.example.com", "a.js"), svc.build_url("ok.example.com", "missing.js"),
            svc.build_url("ok.example.com", "nohead.js"), svc.build_url("down.example.com", "a.js")]
    by_url = {r["url"]: r for r in asyncio.run(svc._check_urls_async(urls))}
    assert by_url[urls[0]]["ok"] and by_url[urls[0]]["statusCode"] == 200
    assert not by_url[urls[1]]["ok"] and by_url[urls[1]]["statusCode"] == 404
    assert by_url[urls[2]]["ok"] and ("GET", "/res/tracking/nohead.js") in seen
    assert not by_url[urls[3]]["ok"] and by_url[urls[3]]["statusCode"] is None and "refused" in by_url[urls[3]]["error"]


# --- through the API ------------------------------------------------------------------

@pytest.fixture
def deploy_ok(monkeypatch):
    monkeypatch.setattr(form_builder_service, "deploy_generated_files", lambda db, files: SftpDeployResult(ok=True, filesDeployed=len(files)))


def test_publish_schedules_check_and_api_lists_it(client, db_session, admin_headers, subsidiary_row, deploy_ok):
    form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name)
    resp = client.get(f"/api/v1/admin/forms/{form_id}/resource-checks", headers=admin_headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["enabled"] is True and len(body["checks"]) == 1
    check = body["checks"][0]
    assert check["trigger"] == "scheduled" and check["status"] == "scheduled"
    assert check["fileNames"] and all(name.endswith((".html", ".js", ".css")) for name in check["fileNames"])


def test_failed_sftp_deploy_schedules_nothing(client, db_session, admin_headers, subsidiary_row):
    form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name)  # SFTP not configured in tests
    assert client.get(f"/api/v1/admin/forms/{form_id}/resource-checks", headers=admin_headers).json()["checks"] == []


def test_check_now_runs_in_background(client, db_session, admin_headers, subsidiary_row, monkeypatch, fake_http, sent_emails):
    import app.utils.background as background

    queued = []
    monkeypatch.setattr(background, "run_in_background", lambda work: queued.append(work))
    form_id = create_and_publish_admin_form(client, admin_headers, subsidiary_row.name)

    resp = client.post(f"/api/v1/admin/forms/{form_id}/resource-checks", headers=admin_headers)
    assert resp.status_code == 202, resp.text
    assert resp.json()["trigger"] == "manual" and len(queued) == 1
    # A second click while one is pending is refused.
    assert client.post(f"/api/v1/admin/forms/{form_id}/resource-checks", headers=admin_headers).status_code == 409

    queued[0](db_session)
    latest = client.get(f"/api/v1/admin/forms/{form_id}/resource-checks", headers=admin_headers).json()["checks"][0]
    assert latest["status"] == "passed" and latest["okUrls"] == latest["totalUrls"] > 0


def test_check_now_requires_a_published_form_and_an_admin(client, admin_headers, standard_headers):
    missing = client.post(f"/api/v1/admin/forms/{uuid.uuid4()}/resource-checks", headers=admin_headers)
    assert missing.status_code == 404
    assert client.get(f"/api/v1/admin/forms/{uuid.uuid4()}/resource-checks", headers=standard_headers).status_code == 403


def test_settings_api(client, admin_headers, standard_headers):
    resp = client.get("/api/v1/admin/resource-check-settings", headers=admin_headers)
    assert resp.status_code == 200 and resp.json()["hosts"] == svc.DEFAULT_HOSTS
    saved = client.patch("/api/v1/admin/resource-check-settings", headers=admin_headers,
                       json={"enabled": True, "hosts": ["samsung-mena-mid-prod7-1"], "delayMinutes": 25, "recheckDelayMinutes": 4})
    assert saved.status_code == 200 and saved.json()["delayMinutes"] == 25 and saved.json()["recheckDelayMinutes"] == 4
    bad = client.patch("/api/v1/admin/resource-check-settings", headers=admin_headers,
                     json={"enabled": True, "hosts": ["x"], "delayMinutes": 0})
    assert bad.status_code == 400  # this app maps request-body validation errors to 400
    assert client.get("/api/v1/admin/resource-check-settings", headers=standard_headers).status_code == 403
