"""Post-deployment availability checks of a published form's files on the
Adobe Campaign MENA frontal servers.

Flow:
  * `schedule_after_deploy` — called by `form_builder_service.publish_form`
    after a successful SFTP push: stores a `ResourceCheck` due
    `delayMinutes` later (default 20) with the exact file names deployed.
    Persisted, so a backend restart doesn't lose it.
  * `start_resource_check_scheduler` — a daemon thread (same pattern as the
    cutoff-reminder scheduler) that wakes every minute and runs every due
    check. `run_check` claims a row atomically (scheduled → running), so the
    scheduler and a manual "Check now" can never run the same row twice.
  * Each run requests `https://{host}.campaign.adobe.com/res/tracking/{file}`
    for every (file, server) pair in parallel (HEAD, falling back to GET
    when a server doesn't allow HEAD) and stores one result per URL.
  * A failed first check schedules one re-check `recheckDelayMinutes` after
    it completes (default 5 — Adobe's servers may still be syncing). If the
    re-check — or a manual "Check now" — still fails, every admin gets an
    email listing the failing files and servers.

Settings (Configuration > Deployment, AdminSettings rows): on/off, the
server list, the first-check delay and the re-check delay.
"""

from __future__ import annotations

import asyncio
import json
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from urllib.parse import quote

import httpx
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.errors import ConflictError, NotFoundError, ValidationError
from app.models.form import Form
from app.models.generated_file import GeneratedFile
from app.models.resource_check import ResourceCheck, ResourceCheckResult
from app.services.admin_settings_service import get_admin_setting, set_admin_setting

DEFAULT_HOSTS = [
    "samsung-mena-mid-prod7-1",
    "samsung-mena-mid-prod8-1",
    "samsung-mena-mid-prod7-2",
    "samsung-mena-mid-prod8-2",
]
DEFAULT_DELAY_MINUTES = 20
DEFAULT_RECHECK_DELAY_MINUTES = 5
MIN_DELAY_MINUTES = 1
MAX_DELAY_MINUTES = 24 * 60
MAX_HOSTS = 20

REQUEST_TIMEOUT_SECONDS = 6
MAX_PARALLEL_REQUESTS = 40
SCHEDULER_INTERVAL_SECONDS = 60
# A "running" row older than this was interrupted (e.g. a restart) — run it again.
STALE_RUNNING_MINUTES = 15
HISTORY_LIMIT = 5

_ENABLED_KEY = "resourceCheckEnabled"
_HOSTS_KEY = "resourceCheckHosts"
_DELAY_KEY = "resourceCheckDelayMinutes"
_RECHECK_DELAY_KEY = "resourceCheckRecheckDelayMinutes"


# --- settings ----------------------------------------------------------------

@dataclass
class ResourceCheckSettings:
    enabled: bool
    hosts: list[str]
    # First check: minutes after the SFTP deploy.
    delayMinutes: int
    # Re-check: minutes after a failed first check completes.
    recheckDelayMinutes: int


def _minutes_setting(db: Session, key: str, default: int) -> int:
    raw = get_admin_setting(db, key)
    try:
        value = int(raw) if raw else default
    except ValueError:
        value = default
    return max(MIN_DELAY_MINUTES, min(MAX_DELAY_MINUTES, value))


def _parse_hosts(raw: Optional[str]) -> list[str]:
    hosts: list[str] = []
    for part in (raw or "").replace(",", "\n").splitlines():
        host = part.strip().lower().removeprefix("https://").removeprefix("http://").rstrip("/")
        if host and host not in hosts:
            hosts.append(host)
    return hosts


def get_resource_check_settings(db: Session) -> ResourceCheckSettings:
    return ResourceCheckSettings(
        enabled=get_admin_setting(db, _ENABLED_KEY) != "false",
        hosts=_parse_hosts(get_admin_setting(db, _HOSTS_KEY)) or list(DEFAULT_HOSTS),
        delayMinutes=_minutes_setting(db, _DELAY_KEY, DEFAULT_DELAY_MINUTES),
        recheckDelayMinutes=_minutes_setting(db, _RECHECK_DELAY_KEY, DEFAULT_RECHECK_DELAY_MINUTES),
    )


def save_resource_check_settings(
    db: Session, enabled: bool, hosts: list[str], delay_minutes: int,
    recheck_delay_minutes: int = DEFAULT_RECHECK_DELAY_MINUTES,
) -> ResourceCheckSettings:
    cleaned = _parse_hosts("\n".join(hosts))
    if not cleaned:
        raise ValidationError("At least one server is required")
    if len(cleaned) > MAX_HOSTS:
        raise ValidationError(f"At most {MAX_HOSTS} servers are allowed")
    for host in cleaned:
        if any(c in host for c in "/?#@ ") or not all(c.isalnum() or c in ".-" for c in host):
            raise ValidationError(f'"{host}" is not a valid server name')
    for label, minutes in (("Delay", delay_minutes), ("Re-check delay", recheck_delay_minutes)):
        if not MIN_DELAY_MINUTES <= minutes <= MAX_DELAY_MINUTES:
            raise ValidationError(f"{label} must be between {MIN_DELAY_MINUTES} and {MAX_DELAY_MINUTES} minutes")
    set_admin_setting(db, _ENABLED_KEY, "true" if enabled else "false")
    set_admin_setting(db, _HOSTS_KEY, "\n".join(cleaned))
    set_admin_setting(db, _DELAY_KEY, str(delay_minutes))
    set_admin_setting(db, _RECHECK_DELAY_KEY, str(recheck_delay_minutes))
    return get_resource_check_settings(db)


def serialize_settings(value: ResourceCheckSettings) -> dict[str, Any]:
    return {
        "enabled": value.enabled,
        "hosts": value.hosts,
        "delayMinutes": value.delayMinutes,
        "recheckDelayMinutes": value.recheckDelayMinutes,
        "defaultHosts": DEFAULT_HOSTS,
    }


# --- URLs ----------------------------------------------------------------------

def host_name(host: str) -> str:
    """A bare server name ("samsung-mena-mid-prod7-1") is an Adobe Campaign
    subdomain; anything containing a dot is used as a full host name."""
    return host if "." in host else f"{host}.campaign.adobe.com"


def build_url(host: str, file_name: str) -> str:
    return f"https://{host_name(host)}/res/tracking/{quote(file_name)}"


# --- creating checks -----------------------------------------------------------

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _create_check(
    db: Session, form_id: str, version_id: str, file_names: list[str], hosts: list[str],
    trigger: str, scheduled_for: datetime, user_id: Optional[str],
) -> ResourceCheck:
    check = ResourceCheck(
        formId=form_id,
        formVersionId=version_id,
        trigger=trigger,
        status="scheduled",
        scheduledFor=scheduled_for,
        fileNames=json.dumps(file_names),
        hosts=json.dumps(hosts),
        totalUrls=len(file_names) * len(hosts),
        triggeredByUserId=user_id,
    )
    db.add(check)
    db.commit()
    db.refresh(check)
    return check


def schedule_after_deploy(
    db: Session, form_id: str, version_id: str, file_names: list[str], user_id: Optional[str]
) -> Optional[ResourceCheck]:
    """Schedules the automatic check for a just-deployed version. Never
    raises — a scheduling problem must not fail the publish."""
    try:
        config = get_resource_check_settings(db)
        if not config.enabled or not file_names:
            return None
        check = _create_check(
            db, form_id, version_id, sorted(set(file_names)), config.hosts, "scheduled",
            _now() + timedelta(minutes=config.delayMinutes), user_id,
        )
        print(f"[resource_check] scheduled check {check.id} for form {form_id} in {config.delayMinutes} min "
              f"({len(file_names)} files x {len(config.hosts)} servers)")
        return check
    except Exception as err:  # noqa: BLE001
        print(f"[resource_check] could not schedule a check for form {form_id}: {type(err).__name__}: {err}")
        db.rollback()
        return None


def start_manual_check(db: Session, form_id: str, user_id: str) -> ResourceCheck:
    """"Check now": checks the form's currently published files right away
    (in the background — poll `list_checks_for_form` for the result)."""
    form = db.execute(select(Form).where(Form.id == form_id, Form.isDeleted == False)).scalar_one_or_none()  # noqa: E712
    if form is None:
        raise NotFoundError("Form not found")
    if form.status != "published" or not form.publishedVersionId:
        raise ConflictError("Only a published form can be checked")
    file_names = sorted({
        row for row in db.execute(
            select(GeneratedFile.fileName).where(GeneratedFile.formVersionId == form.publishedVersionId)
        ).scalars().all()
    })
    if not file_names:
        raise ConflictError("The published version has no generated files to check")
    in_progress = db.execute(
        select(ResourceCheck.id).where(
            ResourceCheck.formId == form_id,
            ResourceCheck.trigger == "manual",
            ResourceCheck.status.in_(("scheduled", "running")),
        )
    ).first()
    if in_progress is not None:
        raise ConflictError("A check for this form is already running")

    config = get_resource_check_settings(db)
    check = _create_check(db, form_id, form.publishedVersionId, file_names, config.hosts, "manual", _now(), user_id)
    check_id = check.id

    from app.utils.background import run_in_background

    run_in_background(lambda session: run_check(session, check_id))
    return check


# --- running checks ------------------------------------------------------------

async def _check_one(client: httpx.AsyncClient, semaphore: asyncio.Semaphore, url: str) -> dict[str, Any]:
    result: dict[str, Any] = {"url": url, "statusCode": None, "ok": False, "elapsedMs": None, "error": None}
    async with semaphore:
        started = time.perf_counter()
        try:
            response = await client.head(url)
            if response.status_code in (405, 501):  # server doesn't allow HEAD
                async with client.stream("GET", url) as streamed:
                    response = streamed
            result["statusCode"] = response.status_code
            result["ok"] = 200 <= response.status_code < 400
        except httpx.HTTPError as exc:
            result["error"] = (str(exc) or type(exc).__name__)[:500]
        result["elapsedMs"] = round((time.perf_counter() - started) * 1000, 1)
    return result


async def _check_urls_async(urls: list[str]) -> list[dict[str, Any]]:
    semaphore = asyncio.Semaphore(MAX_PARALLEL_REQUESTS)
    limits = httpx.Limits(max_connections=MAX_PARALLEL_REQUESTS)
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS, follow_redirects=True, limits=limits) as client:
        return list(await asyncio.gather(*(_check_one(client, semaphore, url) for url in urls)))


def check_urls(urls: list[str]) -> list[dict[str, Any]]:
    """Requests every URL in parallel. Replaced in tests."""
    return asyncio.run(_check_urls_async(urls))


def _claim(db: Session, check_id: str) -> bool:
    result = db.execute(
        text("UPDATE fq.ResourceChecks SET status = 'running', startedAt = SYSDATETIMEOFFSET() "
             "WHERE id = :id AND status = 'scheduled'"),
        {"id": check_id},
    )
    db.commit()
    return result.rowcount == 1


def run_check(db: Session, check_id: str) -> Optional[ResourceCheck]:
    """Runs one check if it can be claimed. Never raises."""
    try:
        if not _claim(db, check_id):
            return None
        check = db.get(ResourceCheck, check_id)
        if check is None:
            return None
        file_names: list[str] = json.loads(check.fileNames)
        hosts: list[str] = json.loads(check.hosts)
        targets = [(file_name, host, build_url(host, file_name)) for file_name in file_names for host in hosts]

        by_url = {r["url"]: r for r in check_urls([url for _f, _h, url in targets])}
        ok_count = 0
        for file_name, host, url in targets:
            r = by_url.get(url) or {"statusCode": None, "ok": False, "elapsedMs": None, "error": "not checked"}
            ok_count += 1 if r["ok"] else 0
            db.add(ResourceCheckResult(
                checkId=check.id, fileName=file_name, host=host, url=url, statusCode=r["statusCode"],
                ok=bool(r["ok"]), elapsedMs=r["elapsedMs"], error=r["error"],
            ))
        check.totalUrls = len(targets)
        check.okUrls = ok_count
        check.failedUrls = len(targets) - ok_count
        check.status = "passed" if check.failedUrls == 0 else "failed"
        check.completedAt = _now()
        db.commit()
        print(f"[resource_check] check {check.id} ({check.trigger}) {check.status}: {ok_count}/{len(targets)} OK")

        if check.status == "failed":
            _after_failure(db, check)
        return check
    except Exception as err:  # noqa: BLE001 - a background check must never crash the process
        print(f"[resource_check] check {check_id} errored: {type(err).__name__}: {err}")
        db.rollback()
        try:
            db.execute(
                text("UPDATE fq.ResourceChecks SET status = 'error', completedAt = SYSDATETIMEOFFSET(), "
                     "errorMessage = :message WHERE id = :id"),
                {"id": check_id, "message": f"{type(err).__name__}: {err}"[:2000]},
            )
            db.commit()
        except Exception:  # noqa: BLE001
            db.rollback()
        return None


def _after_failure(db: Session, check: ResourceCheck) -> None:
    """First automatic failure → one re-check `recheckDelayMinutes` after it
    completed (servers may still be syncing). A failed re-check or manual
    check → email the admins."""
    if check.trigger == "scheduled":
        config = get_resource_check_settings(db)
        recheck = _create_check(
            db, check.formId, check.formVersionId, json.loads(check.fileNames), json.loads(check.hosts),
            "recheck", _now() + timedelta(minutes=config.recheckDelayMinutes), check.triggeredByUserId,
        )
        print(f"[resource_check] check {check.id} failed; re-check {recheck.id} in {config.recheckDelayMinutes} min")
        return
    _notify_admins(db, check)


def _notify_admins(db: Session, check: ResourceCheck) -> None:
    from app.services import email_service

    form = db.get(Form, check.formId)
    failures = db.execute(
        select(ResourceCheckResult).where(ResourceCheckResult.checkId == check.id, ResourceCheckResult.ok == False)  # noqa: E712
        .order_by(ResourceCheckResult.fileName, ResourceCheckResult.host)
    ).scalars().all()
    sent = email_service.send_resource_check_failed_notification(
        db,
        form_id=check.formId,
        form_name=form.name if form else check.formId,
        subsidiary_id=form.subsidiaryId if form else "",
        project_code=form.projectCode if form else None,
        trigger=check.trigger,
        total_urls=check.totalUrls,
        failures=[
            email_service.ResourceCheckFailure(
                file_name=f.fileName, host=f.host,
                problem=f"HTTP {f.statusCode}" if f.statusCode is not None else (f.error or "unreachable"),
            )
            for f in failures
        ],
    )
    if sent:
        check.notifiedAt = _now()
        db.commit()


# --- scheduler -----------------------------------------------------------------

def run_due_checks(db: Session, limit: int = 10) -> int:
    """One scheduler tick: re-queues interrupted runs, then runs every due
    check (oldest first). Returns how many ran."""
    db.execute(
        text("UPDATE fq.ResourceChecks SET status = 'scheduled', startedAt = NULL "
             "WHERE status = 'running' AND startedAt < DATEADD(minute, :stale, SYSDATETIMEOFFSET())"),
        {"stale": -STALE_RUNNING_MINUTES},
    )
    db.commit()
    due_ids = [
        str(row[0]) for row in db.execute(
            text(f"SELECT TOP {int(limit)} id FROM fq.ResourceChecks "
                 "WHERE status = 'scheduled' AND scheduledFor <= SYSDATETIMEOFFSET() ORDER BY scheduledFor"),
        ).all()
    ]
    ran = 0
    for check_id in due_ids:
        if run_check(db, check_id) is not None:
            ran += 1
    return ran


_scheduler_started = False
_scheduler_lock = threading.Lock()


def _tick() -> None:
    from app.db import get_sessionmaker

    db = get_sessionmaker()()
    try:
        run_due_checks(db)
    except Exception as err:  # noqa: BLE001 - a scheduled job must never crash the process
        print(f"[resource_check] scheduler tick failed: {type(err).__name__}: {err}")
    finally:
        db.close()


def start_resource_check_scheduler() -> None:
    """Checks for due checks every minute on a daemon thread. Call once at
    startup (see app/main.py)."""
    global _scheduler_started
    with _scheduler_lock:
        if _scheduler_started:
            return
        _scheduler_started = True

    def _loop() -> None:
        while True:
            _tick()
            threading.Event().wait(SCHEDULER_INTERVAL_SECONDS)

    threading.Thread(target=_loop, name="resource-check-scheduler", daemon=True).start()


# --- read side -----------------------------------------------------------------

def _iso(value: Any) -> Optional[str]:
    return value.isoformat() if hasattr(value, "isoformat") else None


def serialize_check(check: ResourceCheck, results: list[ResourceCheckResult]) -> dict[str, Any]:
    return {
        "id": check.id,
        "trigger": check.trigger,
        "status": check.status,
        "scheduledFor": _iso(check.scheduledFor),
        "startedAt": _iso(check.startedAt),
        "completedAt": _iso(check.completedAt),
        "fileNames": json.loads(check.fileNames),
        "hosts": json.loads(check.hosts),
        "totalUrls": check.totalUrls,
        "okUrls": check.okUrls,
        "failedUrls": check.failedUrls,
        "errorMessage": check.errorMessage,
        "notifiedAt": _iso(check.notifiedAt),
        "results": [
            {"fileName": r.fileName, "host": r.host, "url": r.url, "statusCode": r.statusCode,
             "ok": r.ok, "elapsedMs": r.elapsedMs, "error": r.error}
            for r in results
        ],
    }


def list_checks_for_form(db: Session, form_id: str, limit: int = HISTORY_LIMIT) -> list[dict[str, Any]]:
    """The form's most recent checks, newest first, each with its per-URL results."""
    checks = db.execute(
        select(ResourceCheck).where(ResourceCheck.formId == form_id)
        .order_by(ResourceCheck.createdAt.desc()).limit(limit)
    ).scalars().all()
    if not checks:
        return []
    results_by_check: dict[str, list[ResourceCheckResult]] = {}
    for r in db.execute(
        select(ResourceCheckResult).where(ResourceCheckResult.checkId.in_([c.id for c in checks]))
        .order_by(ResourceCheckResult.fileName, ResourceCheckResult.host)
    ).scalars().all():
        results_by_check.setdefault(str(r.checkId).lower(), []).append(r)
    return [serialize_check(c, results_by_check.get(str(c.id).lower(), [])) for c in checks]
