"""Port of `backend/src/services/cutoffReminderService.ts`.

The first (and only) scheduled/recurring job in this backend — there's no
job queue or cron library here, so `start_cutoff_reminder_scheduler` is a
plain background thread that wakes up hourly and only actually runs
`run_cutoff_reminders` once per calendar day (tracked in-memory). A server
restart resets that in-memory guard, so restarting more than once on the
same day re-triggers that day's run — acceptable for a best-effort reminder
email, not worth a persistent lock for.
"""

from __future__ import annotations

import threading
from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.form_pipeline import FormDefinition
from app.models.form import Form
from app.models.form_version import FormVersion
from app.models.project_code import ProjectCode
from app.services import email_service
from app.services.admin_settings_service import get_admin_setting
from app.services.auth_service import list_admin_notification_emails
from app.services.form_contribution_service import list_contributions_for_form
from app.services.subsidiary_recipients import resolve_subsidiary_recipients

DEFAULT_REMINDER_DAYS_BEFORE = 7


def _days_until(target: date, from_: date) -> int:
    return (target - from_).days


def _is_not_finalized(db: Session, form: Form) -> bool:
    """A form counts as "not yet finalized" for its subsidiary if it isn't
    even published yet, or if its latest contribution isn't "approved"."""
    if form.status != "published":
        return True
    contributions = list_contributions_for_form(db, form.id)
    return not contributions or contributions[0]["status"] != "approved"


def _has_terms_and_conditions_gap(db: Session, form: Form) -> bool:
    """Whether this form's Terms & Conditions is missing entirely, or
    incomplete for any of the form's own locales — checked against the
    form's current *draft* version so a subsidiary user's own translation
    fix is picked up immediately without needing a republish first."""
    if not form.currentDraftVersionId:
        return True
    version = db.get(FormVersion, form.currentDraftVersionId)
    if version is None:
        return True
    definition = FormDefinition.model_validate_json(version.definition)
    terms = definition.fields.termsAndConditions
    if terms is None:
        return True
    return any(not terms.textByLocale.get(l.code) or not terms.urlByLocale.get(l.code) for l in definition.locales)


def run_cutoff_reminders(db: Session) -> None:
    """Runs once per calendar day (see `start_cutoff_reminder_scheduler`):
    for every open project code with a cutoffDate within the configured
    reminder window, finds every subsidiary that has at least one form
    under that code with something still pending, and emails that
    subsidiary's users a reminder listing exactly which forms still need
    attention and why. Separately, every pending item across the entire
    run is also collected into one consolidated summary email sent to
    every admin's own notification email."""
    days_before_setting = get_admin_setting(db, "cutoffReminderDaysBefore")
    days_before = int(days_before_setting) if days_before_setting and days_before_setting.isdigit() else DEFAULT_REMINDER_DAYS_BEFORE
    today = datetime.now(timezone.utc).date()

    all_pending_items: list[email_service.AdminPendingItem] = []

    codes = db.execute(select(ProjectCode).where(ProjectCode.isOpen == True)).scalars().all()  # noqa: E712
    for code in codes:
        if not code.cutoffDate:
            continue
        remaining = _days_until(code.cutoffDate, today)
        if remaining < 0 or remaining > days_before:
            continue

        forms = db.execute(select(Form).where(Form.projectCode == code.code, Form.isDeleted == False)).scalars().all()  # noqa: E712
        if not forms:
            continue

        forms_by_subsidiary: dict[str, list[Form]] = {}
        for form in forms:
            forms_by_subsidiary.setdefault(form.subsidiaryId, []).append(form)

        for subsidiary_id, subsidiary_forms in forms_by_subsidiary.items():
            pending_for_subsidiary: list[email_service.AdminPendingItem] = []
            for form in subsidiary_forms:
                reasons: list[str] = []
                if _is_not_finalized(db, form):
                    reasons.append("Translation not yet approved")
                if _has_terms_and_conditions_gap(db, form):
                    reasons.append("Terms & Conditions not configured")
                if not reasons:
                    continue
                pending_for_subsidiary.append(
                    email_service.AdminPendingItem(
                        subsidiary_id=subsidiary_id, project_code=code.code, form_name=form.name, cutoff_date=code.cutoffDate, reasons=reasons
                    )
                )
            if not pending_for_subsidiary:
                continue

            all_pending_items.extend(pending_for_subsidiary)

            recipients = resolve_subsidiary_recipients(db, subsidiary_id)
            if recipients:
                email_service.send_cutoff_reminder(
                    db,
                    recipients,
                    subsidiary_id,
                    code.code,
                    code.cutoffDate,
                    [email_service.CutoffReminderItem(form_name=p.form_name, reasons=p.reasons) for p in pending_for_subsidiary],
                )

    if all_pending_items:
        admin_recipients = list_admin_notification_emails(db)
        if admin_recipients:
            email_service.send_admin_pending_items_summary(db, admin_recipients, all_pending_items)


_last_run_date_key: str | None = None
_scheduler_lock = threading.Lock()


def _run_once_for_today() -> None:
    global _last_run_date_key
    today_key = datetime.now(timezone.utc).date().isoformat()
    with _scheduler_lock:
        if today_key == _last_run_date_key:
            return
        _last_run_date_key = today_key

    from app.db import get_sessionmaker

    db = get_sessionmaker()()
    try:
        run_cutoff_reminders(db)
    except Exception as err:  # noqa: BLE001 — a scheduled job must never crash the process
        print(f"[cutoff_reminder_service] Cutoff reminder run failed: {err}")
    finally:
        db.close()


def start_cutoff_reminder_scheduler() -> None:
    """Runs once immediately, then hourly, via a daemon background thread
    (so it never blocks process shutdown). Call once at startup (see
    `app/main.py`)."""

    def _loop() -> None:
        _run_once_for_today()
        while True:
            threading.Event().wait(60 * 60)
            _run_once_for_today()

    threading.Thread(target=_loop, name="cutoff-reminder-scheduler", daemon=True).start()
