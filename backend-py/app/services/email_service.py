"""Port of `backend/src/services/emailService.ts`.

`sendUploadNotification`/`sendSubmissionNotification` are deliberately NOT
ported — they backed the removed Excel-upload feature (see `EmailLog.uploadId`,
an unused nullable column) and have no live caller on either side of the repo.
Every other sender here has a real call site.
"""

from __future__ import annotations

import smtplib
from dataclasses import dataclass
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape as escape_html
from typing import Optional

from sqlalchemy.orm import Session

from app.config import settings
from app.services.smtp_settings_service import get_smtp_settings


@dataclass
class _ResolvedSmtpConfig:
    host: str
    port: int
    secure: bool
    user: Optional[str]
    password: Optional[str]
    from_: Optional[str]


@dataclass
class EmailContent:
    subject: str
    text: str
    html: str


@dataclass
class SendResult:
    ok: bool
    error: Optional[str] = None


def _resolve_smtp_config(db: Session) -> Optional[_ResolvedSmtpConfig]:
    """DB-stored settings (admin-configurable via Configuration) win if
    present, otherwise falls back to the SMTP_* env vars — same precedence
    as the Node original, re-resolved fresh on every call (no caching), so
    an admin's settings change takes effect on the very next email."""
    db_settings = get_smtp_settings(db)
    if db_settings is not None:
        return _ResolvedSmtpConfig(
            host=db_settings.host,
            port=db_settings.port,
            secure=db_settings.secure,
            user=db_settings.user,
            password=db_settings.password,
            from_=db_settings.from_,
        )

    if not settings.SMTP_HOST:
        return None
    return _ResolvedSmtpConfig(
        host=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        secure=settings.SMTP_SECURE,
        user=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        from_=settings.SMTP_FROM,
    )


def _resolve_admin_recipients(db: Session) -> list[str]:
    """Every admin-facing notification goes to the same recipient set:
    FORMBUILDER_NOTIFY_EMAIL if set (a single hard override), otherwise
    every notification-email address set on an active admin/superadmin
    account."""
    from app.services.auth_service import list_admin_notification_emails

    env_recipient = settings.FORMBUILDER_NOTIFY_EMAIL
    if env_recipient and env_recipient.strip():
        return [env_recipient.strip()]
    return list_admin_notification_emails(db)


def _send_email(db_or_none: Optional[Session], config: Optional[_ResolvedSmtpConfig], to: list[str], content: EmailContent) -> SendResult:
    if config is None:
        return SendResult(ok=False, error="SMTP not configured")

    from_addr = config.from_ or config.user or to[0]
    message = MIMEMultipart("alternative")
    message["Subject"] = content.subject
    message["From"] = from_addr
    message["To"] = ", ".join(to)
    message.attach(MIMEText(content.text, "plain"))
    message.attach(MIMEText(content.html, "html"))

    try:
        smtp_cls = smtplib.SMTP_SSL if config.secure else smtplib.SMTP
        with smtp_cls(config.host, config.port, timeout=15) as client:
            if not config.secure:
                try:
                    client.starttls()
                except smtplib.SMTPException:
                    pass
            if config.user:
                client.login(config.user, config.password or "")
            client.sendmail(from_addr, to, message.as_string())
        return SendResult(ok=True)
    except Exception as err:  # noqa: BLE001 — normalized into the same {ok, error} shape as every other sender
        return SendResult(ok=False, error=str(err))


def send_email(db: Session, to: list[str], content: EmailContent) -> SendResult:
    return _send_email(db, _resolve_smtp_config(db), to, content)


def _escape(value: str) -> str:
    return escape_html(value, quote=False)


def _render_email_html(
    title: str,
    intro: Optional[str] = None,
    rows: Optional[list[tuple[str, str]]] = None,
    items: Optional[list[str]] = None,
    cta_label: Optional[str] = None,
    cta_url: Optional[str] = None,
    footer_note: Optional[str] = None,
) -> str:
    rows_html = ""
    if rows:
        row_cells = "".join(
            f'<tr><td style="padding:8px 0;color:#5f6473;font-size:13px;width:170px;vertical-align:top;">{_escape(label)}</td>'
            f'<td style="padding:8px 0;color:#1a1c23;font-size:14px;">{_escape(value)}</td></tr>'
            for label, value in rows
        )
        rows_html = f'<table role="presentation" style="width:100%;border-collapse:collapse;margin:16px 0;">{row_cells}</table>'

    items_html = ""
    if items:
        item_cells = "".join(f'<li style="margin-bottom:6px;">{_escape(i)}</li>' for i in items)
        items_html = f'<ul style="margin:16px 0;padding-left:20px;color:#1a1c23;font-size:14px;">{item_cells}</ul>'

    cta_html = ""
    if cta_label and cta_url:
        cta_html = (
            f'<div style="margin:24px 0 8px;"><a href="{cta_url}" style="display:inline-block;background:#1428a0;'
            f'color:#ffffff;text-decoration:none;padding:10px 22px;border-radius:999px;font-size:14px;font-weight:600;">'
            f"{_escape(cta_label)}</a></div>"
        )

    intro_html = f'<p style="margin:0 0 8px;color:#1a1c23;font-size:14px;line-height:1.5;">{_escape(intro)}</p>' if intro else ""
    footer_html = (
        f'<p style="margin:20px 0 0;color:#5f6473;font-size:12px;line-height:1.5;">{_escape(footer_note)}</p>' if footer_note else ""
    )

    return f"""<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5f6fa;font-family:'Segoe UI',system-ui,-apple-system,Roboto,sans-serif;">
    <table role="presentation" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid rgba(20,22,33,0.08);">
      <tr>
        <td style="background:#1428a0;padding:20px 28px;">
          <span style="color:#ffffff;font-size:16px;font-weight:700;">Form Builder</span>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:18px;color:#1a1c23;">{_escape(title)}</h1>
          {intro_html}
          {rows_html}
          {items_html}
          {cta_html}
          {footer_html}
        </td>
      </tr>
    </table>
  </body>
</html>"""


_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _format_datetime(dt: datetime) -> str:
    hours = dt.hour % 12 or 12
    ampm = "PM" if dt.hour >= 12 else "AM"
    return f"{dt.day:02d}-{_MONTH_NAMES[dt.month - 1]}-{dt.year} {hours:02d}:{dt.minute:02d} {ampm}"


def _format_date_only(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d")


# --- Cutoff reminders (subsidiary + admin digest) ---------------------------


@dataclass
class CutoffReminderItem:
    form_name: str
    reasons: list[str]


def _build_cutoff_reminder_message(subsidiary_id: str, project_code: str, cutoff_date: datetime, items: list[CutoffReminderItem]) -> EmailContent:
    link = f"{settings.FRONTEND_URL or ''}/my-forms"
    cutoff = _format_date_only(cutoff_date)
    subject = f'Reminder: forms pending for "{project_code}" (cutoff {cutoff})'
    body_lines = "\n".join(f"- {item.form_name}: {'; '.join(item.reasons)}" for item in items)
    text = (
        f'The following form(s) for subsidiary "{subsidiary_id}" under project "{project_code}" '
        f"still need attention, and this project's cutoff date is {cutoff}:\n\n{body_lines}"
        f"\n\nPlease review and address the item(s) above before the cutoff: {link}\n"
    )
    html = _render_email_html(
        title="Forms pending before cutoff",
        intro=f'The following form(s) for subsidiary "{subsidiary_id}" under project "{project_code}" still need attention — this project\'s cutoff date is {cutoff}.',
        items=[f"{item.form_name}: {'; '.join(item.reasons)}" for item in items],
        cta_label="Review your forms",
        cta_url=link,
    )
    return EmailContent(subject=subject, text=text, html=html)


def send_cutoff_reminder(db: Session, recipients: list[str], subsidiary_id: str, project_code: str, cutoff_date: datetime, items: list[CutoffReminderItem]) -> None:
    if not recipients:
        return
    result = send_email(db, recipients, _build_cutoff_reminder_message(subsidiary_id, project_code, cutoff_date, items))
    if not result.ok:
        print(f"[email_service] Failed to send cutoff reminder email: {result.error}")


@dataclass
class AdminPendingItem:
    subsidiary_id: str
    project_code: str
    form_name: str
    cutoff_date: datetime
    reasons: list[str]


def _build_admin_pending_summary_message(items: list[AdminPendingItem]) -> EmailContent:
    link = f"{settings.FRONTEND_URL or ''}/admin/form-builder"
    subject = f"Reminder: {len(items)} form{'' if len(items) == 1 else 's'} pending before cutoff"
    body_lines = "\n".join(
        f'- {item.form_name} (subsidiary "{item.subsidiary_id}", project "{item.project_code}", '
        f"cutoff {_format_date_only(item.cutoff_date)}): {'; '.join(item.reasons)}"
        for item in items
    )
    text = f"The following forms still need attention before their project's cutoff date:\n\n{body_lines}\n\nReview them in the Form Initiator: {link}\n"
    html = _render_email_html(
        title=f"{len(items)} form{'' if len(items) == 1 else 's'} pending before cutoff",
        intro="The following forms still need attention before their project's cutoff date:",
        items=[
            f'{item.form_name} — subsidiary "{item.subsidiary_id}", project "{item.project_code}", '
            f"cutoff {_format_date_only(item.cutoff_date)}: {'; '.join(item.reasons)}"
            for item in items
        ],
        cta_label="Open Form Initiator",
        cta_url=link,
    )
    return EmailContent(subject=subject, text=text, html=html)


def send_admin_pending_items_summary(db: Session, recipients: list[str], items: list[AdminPendingItem]) -> None:
    if not recipients or not items:
        return
    result = send_email(db, recipients, _build_admin_pending_summary_message(items))
    if not result.ok:
        print(f"[email_service] Failed to send admin pending-items summary email: {result.error}")


# --- Ad-hoc form submitted for review ---------------------------------------


def _build_adhoc_review_submitted_message(form_name: str, subsidiary_id: str, submitted_at: datetime) -> EmailContent:
    link = f"{settings.FRONTEND_URL or ''}/admin/form-builder/adhoc"
    subject = f"Ad-hoc form submitted for review: {form_name}"
    text = (
        f"A subsidiary user submitted an ad-hoc form for review.\n\n"
        f"Form: {form_name}\nSubsidiary: {subsidiary_id}\nSubmitted at: {_format_datetime(submitted_at)}\n\n"
        f"Review it here: {link}\n"
    )
    html = _render_email_html(
        title="Ad-hoc form submitted for review",
        rows=[("Form", form_name), ("Subsidiary", subsidiary_id), ("Submitted at", _format_datetime(submitted_at))],
        cta_label="Review in Form Initiator",
        cta_url=link,
    )
    return EmailContent(subject=subject, text=text, html=html)


def send_adhoc_review_submitted_notification(db: Session, form_name: str, subsidiary_id: str, submitted_at: datetime) -> None:
    """Never raises — a notification failure can't fail the "submit for
    review" request itself."""
    try:
        recipients = _resolve_admin_recipients(db)
        if not recipients:
            return
        result = send_email(db, recipients, _build_adhoc_review_submitted_message(form_name, subsidiary_id, submitted_at))
        if not result.ok:
            print(f"[email_service] Failed to send ad-hoc review-submitted email: {result.error}")
    except Exception as err:  # noqa: BLE001
        print(f"[email_service] Failed to send ad-hoc review-submitted email: {err}")


# --- Contribution ("Translate & Extend") submitted for review --------------


def _build_contribution_submitted_message(form_name: str, subsidiary_id: str, submitted_by_user_name: str, submitted_by_user_email: str, note: Optional[str]) -> EmailContent:
    link = f"{settings.FRONTEND_URL or ''}/admin/form-builder"
    subject = f"Translation/extension submitted for review: {form_name}"
    text = (
        f"A subsidiary user submitted a translation/extension for review.\n\n"
        f"Form: {form_name}\nSubsidiary: {subsidiary_id}\n"
        f"Submitted by: {submitted_by_user_name} ({submitted_by_user_email})\n"
        + (f"Note: {note}\n" if note else "")
        + f"\nReview it here: {link}\n"
    )
    rows = [("Form", form_name), ("Subsidiary", subsidiary_id), ("Submitted by", f"{submitted_by_user_name} ({submitted_by_user_email})")]
    if note:
        rows.append(("Note", note))
    html = _render_email_html(title="Translation/extension submitted for review", rows=rows, cta_label="Review in Form Initiator", cta_url=link)
    return EmailContent(subject=subject, text=text, html=html)


def send_contribution_submitted_notification(
    db: Session, form_name: str, subsidiary_id: str, submitted_by_user_name: str, submitted_by_user_email: str, note: Optional[str]
) -> None:
    """Never raises — same best-effort discipline as every other notification here."""
    try:
        recipients = _resolve_admin_recipients(db)
        if not recipients:
            return
        result = send_email(db, recipients, _build_contribution_submitted_message(form_name, subsidiary_id, submitted_by_user_name, submitted_by_user_email, note))
        if not result.ok:
            print(f"[email_service] Failed to send contribution-submitted email: {result.error}")
    except Exception as err:  # noqa: BLE001
        print(f"[email_service] Failed to send contribution-submitted email: {err}")


# --- Project code locked -----------------------------------------------------


def _build_project_locked_message(project_code: str, cutoff_date: Optional[datetime]) -> EmailContent:
    link = f"{settings.FRONTEND_URL or ''}/my-forms"
    subject = f'Project "{project_code}" has been locked'
    cutoff_line = f" The campaign cutoff date is {_format_date_only(cutoff_date)}." if cutoff_date else ""
    text = (
        f'Project "{project_code}" has been locked by an admin.\n\n'
        f"No further uploads, form edits, or translation submissions can be made against it.{cutoff_line}\n\n"
        f"View your forms: {link}\n"
    )
    rows = [("Project code", project_code)]
    if cutoff_date:
        rows.append(("Campaign cutoff", _format_date_only(cutoff_date)))
    html = _render_email_html(
        title=f'Project "{project_code}" has been locked',
        intro=f"An admin has locked this project. No further uploads, form edits, or translation submissions can be made against it.{cutoff_line}",
        rows=rows,
        cta_label="View your forms",
        cta_url=link,
    )
    return EmailContent(subject=subject, text=text, html=html)


def send_project_locked_notification(db: Session, recipients: list[str], project_code: str, cutoff_date: Optional[datetime]) -> None:
    """Never raises — same best-effort discipline as every other notification here."""
    if not recipients:
        return
    try:
        result = send_email(db, recipients, _build_project_locked_message(project_code, cutoff_date))
        if not result.ok:
            print(f"[email_service] Failed to send project-locked email: {result.error}")
    except Exception as err:  # noqa: BLE001
        print(f"[email_service] Failed to send project-locked email: {err}")


# --- SMTP settings test send --------------------------------------------------


def send_test_email(db: Session, to: str) -> SendResult:
    html = _render_email_html(
        title="SMTP settings test",
        intro="This is a test email from Form Builder confirming your SMTP settings are working correctly.",
        footer_note="You can safely ignore this message.",
    )
    return send_email(
        db,
        [to],
        EmailContent(
            subject="Form Builder — SMTP test email",
            text="This is a test email from Form Builder confirming your SMTP settings are working correctly.",
            html=html,
        ),
    )