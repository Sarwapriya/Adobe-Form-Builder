import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { AppDataSource } from "../config/data-source";
import { EmailLog } from "../entities/EmailLog";
import { listAdminNotificationEmails } from "./authService";
import { getSmtpSettings } from "./smtpSettingsService";

interface ResolvedSmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from?: string;
}

/**
 * Resolves SMTP connection config for a single send — DB-stored settings
 * (see smtpSettingsService.ts, admin-configurable via the Configuration
 * page) win if present, otherwise falls back to the original SMTP_*/FROM env
 * vars so an existing env-var-only deployment keeps working unchanged.
 * Re-resolved fresh on every call (no module-level caching) so a settings
 * change via the admin UI takes effect on the very next email with no
 * invalidation logic to get wrong — sending here is not a hot path (at most
 * a handful of emails per user action), so the extra DB round-trip per send
 * is not worth trading away for a stale-cache risk.
 */
async function resolveSmtpConfig(): Promise<ResolvedSmtpConfig | null> {
  const dbSettings = await getSmtpSettings();
  if (dbSettings) {
    return {
      host: dbSettings.host,
      port: dbSettings.port,
      secure: dbSettings.secure,
      user: dbSettings.user ?? undefined,
      password: dbSettings.password ?? undefined,
      from: dbSettings.from ?? undefined,
    };
  }

  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return {
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  };
}

async function getTransporter(): Promise<{ transporter: Transporter; from?: string } | null> {
  const config = await resolveSmtpConfig();
  if (!config) return null;
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
  });
  return { transporter, from: config.from ?? config.user };
}

/** Every admin-facing notification (upload, submission, form-review-submitted,
 * cutoff digest) goes to the same recipient set: FORMBUILDER_NOTIFY_EMAIL if
 * set (a single hard override), otherwise every notification-email address
 * set on an active admin/superadmin account (see authService.listAdminNotificationEmails)
 * — each admin manages their own address(es) via User Management rather than
 * a separate, site-wide setting. */
async function resolveAdminRecipients(): Promise<string[]> {
  const envRecipient = process.env.FORMBUILDER_NOTIFY_EMAIL;
  if (envRecipient && envRecipient.trim().length > 0) {
    return [envRecipient.trim()];
  }
  return listAdminNotificationEmails();
}

interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

type SendResult = { ok: true } | { ok: false; error: string };

/** The one place every email actually goes out through — resolves the
 * transporter/from address fresh (see getTransporter), sends, and normalizes
 * both "not configured" and a genuine send failure into the same
 * `{ ok: false, error }` shape so every caller handles them identically. */
async function sendEmail(to: string[], content: EmailContent): Promise<SendResult> {
  const resolved = await getTransporter();
  if (!resolved) {
    return { ok: false, error: "SMTP not configured" };
  }
  const from = resolved.from || to[0];
  try {
    await resolved.transporter.sendMail({ to: to.join(", "), from, subject: content.subject, text: content.text, html: content.html });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Shared HTML shell for every outgoing email — a Samsung-blue header bar over
 * a white content card, table-based layout for broad email-client
 * compatibility. `rows` renders as a two-column key/value table, `items` as a
 * bullet list, `ctaLabel`/`ctaUrl` as a pill-shaped button link. Every
 * `buildX` function below feeds this the same way so every email kind reads
 * as one consistent product rather than ad-hoc plain text.
 */
function renderEmailHtml(opts: {
  title: string;
  intro?: string;
  rows?: { label: string; value: string }[];
  items?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const rowsHtml = opts.rows?.length
    ? `<table role="presentation" style="width:100%;border-collapse:collapse;margin:16px 0;">${opts.rows
        .map(
          (r) =>
            `<tr><td style="padding:8px 0;color:#5f6473;font-size:13px;width:170px;vertical-align:top;">${escapeHtml(r.label)}</td><td style="padding:8px 0;color:#1a1c23;font-size:14px;">${escapeHtml(r.value)}</td></tr>`,
        )
        .join("")}</table>`
    : "";
  const itemsHtml = opts.items?.length
    ? `<ul style="margin:16px 0;padding-left:20px;color:#1a1c23;font-size:14px;">${opts.items
        .map((i) => `<li style="margin-bottom:6px;">${escapeHtml(i)}</li>`)
        .join("")}</ul>`
    : "";
  const ctaHtml =
    opts.ctaLabel && opts.ctaUrl
      ? `<div style="margin:24px 0 8px;"><a href="${opts.ctaUrl}" style="display:inline-block;background:#1428a0;color:#ffffff;text-decoration:none;padding:10px 22px;border-radius:999px;font-size:14px;font-weight:600;">${escapeHtml(opts.ctaLabel)}</a></div>`
      : "";

  return `<!doctype html>
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
          <h1 style="margin:0 0 12px;font-size:18px;color:#1a1c23;">${escapeHtml(opts.title)}</h1>
          ${opts.intro ? `<p style="margin:0 0 8px;color:#1a1c23;font-size:14px;line-height:1.5;">${escapeHtml(opts.intro)}</p>` : ""}
          ${rowsHtml}
          ${itemsHtml}
          ${ctaHtml}
          ${opts.footerNote ? `<p style="margin:20px 0 0;color:#5f6473;font-size:12px;line-height:1.5;">${escapeHtml(opts.footerNote)}</p>` : ""}
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Formats a Date as "10-Jan-2026 10:30 AM", matching the product spec's
 * example submission-notification email body. */
function formatDateTime(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day}-${month}-${year} ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
}

function formatDateOnly(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

// --- Upload notification -----------------------------------------------

interface UploadNotificationDetails {
  subsidiaryId: string;
  fileName: string;
  uploadDate: Date;
  uploadedBy: string;
}

function buildUploadMessage(details: UploadNotificationDetails): EmailContent {
  const adminLink = `${process.env.FRONTEND_URL ?? ""}/admin`;
  const subject = `New upload for subsidiary ${details.subsidiaryId}: ${details.fileName}`;
  const text =
    `A new file was uploaded.\n\n` +
    `Subsidiary: ${details.subsidiaryId}\n` +
    `File: ${details.fileName}\n` +
    `Uploaded by: ${details.uploadedBy}\n` +
    `Uploaded at: ${details.uploadDate.toISOString()}\n` +
    `Admin view: ${adminLink}\n`;
  const html = renderEmailHtml({
    title: "New file uploaded",
    rows: [
      { label: "Subsidiary", value: details.subsidiaryId },
      { label: "File", value: details.fileName },
      { label: "Uploaded by", value: details.uploadedBy },
      { label: "Uploaded at", value: formatDateTime(details.uploadDate) },
    ],
    ctaLabel: "Open Admin Dashboard",
    ctaUrl: adminLink,
  });
  return { subject, text, html };
}

/**
 * Sends the upload notification. Never throws — a missing recipient/SMTP
 * config or a send failure is logged and swallowed so it can't fail the
 * upload request itself.
 */
export async function sendUploadNotification(details: UploadNotificationDetails): Promise<void> {
  try {
    const recipients = await resolveAdminRecipients();
    if (recipients.length === 0) {
      console.warn(
        "No notification recipient configured (FORMBUILDER_NOTIFY_EMAIL / any admin's notification email in User Management) — skipping email"
      );
      return;
    }
    const result = await sendEmail(recipients, buildUploadMessage(details));
    if (!result.ok) console.error("Failed to send upload notification email:", result.error);
  } catch (err) {
    console.error("Failed to send upload notification email", err);
  }
}

// --- Submission notification (EmailLog-audited) -------------------------

export interface SubmissionNotificationDetails {
  uploadId: string;
  userName: string;
  userEmail: string;
  uploadDate: Date;
  subsidiaryId: string;
  fileName: string;
  submittedAt: Date;
}

function buildSubmissionMessage(details: SubmissionNotificationDetails): EmailContent {
  const adminLink = `${process.env.FRONTEND_URL ?? ""}/admin`;
  const text =
    `A new web form has been submitted.\n\n` +
    `User:\n${details.userName} (${details.userEmail})\n\n` +
    `Subsidiary:\n${details.subsidiaryId}\n\n` +
    `Excel File:\n${details.fileName}\n\n` +
    `Uploaded:\n${formatDateTime(details.uploadDate)}\n\n` +
    `Submission Time:\n${formatDateTime(details.submittedAt)}\n\n` +
    `Please review it in the Admin Dashboard: ${adminLink}\n`;
  const html = renderEmailHtml({
    title: "New web form submission",
    rows: [
      { label: "User", value: `${details.userName} (${details.userEmail})` },
      { label: "Subsidiary", value: details.subsidiaryId },
      { label: "Excel file", value: details.fileName },
      { label: "Uploaded", value: formatDateTime(details.uploadDate) },
      { label: "Submission time", value: formatDateTime(details.submittedAt) },
    ],
    ctaLabel: "Review in Admin Dashboard",
    ctaUrl: adminLink,
  });
  return { subject: "New Web Form Submission", text, html };
}

/**
 * Sends the submission notification and records the outcome in EmailLogs.
 * Unlike sendUploadNotification, submission is a first-class auditable event
 * per the product requirement ("record submission details... email the
 * Admin"), so every attempt — sent, failed, or skipped for lack of a
 * configured recipient/SMTP setup — leaves a row. Never throws — same
 * swallow-and-log discipline as sendUploadNotification, so a notification
 * failure can't fail the submit request itself.
 */
export async function sendSubmissionNotification(details: SubmissionNotificationDetails): Promise<void> {
  const emailLogRepo = AppDataSource.getRepository(EmailLog);
  const recipients = await resolveAdminRecipients();

  if (recipients.length === 0) {
    console.warn(
      "No notification recipient configured (FORMBUILDER_NOTIFY_EMAIL / any admin's notification email in User Management) — skipping submission email"
    );
    await emailLogRepo.save(
      emailLogRepo.create({
        uploadId: details.uploadId,
        recipient: "(no recipient configured)",
        status: "failed",
        errorMessage: "No notification recipient configured",
      }),
    );
    return;
  }

  const recipient = recipients.join(", ");
  const result = await sendEmail(recipients, buildSubmissionMessage(details));
  if (result.ok) {
    await emailLogRepo.save(
      emailLogRepo.create({ uploadId: details.uploadId, recipient, status: "sent", errorMessage: null }),
    );
  } else {
    console.error("Failed to send submission notification email", result.error);
    await emailLogRepo.save(
      emailLogRepo.create({ uploadId: details.uploadId, recipient, status: "failed", errorMessage: result.error }),
    );
  }
}

// --- Cutoff reminders (subsidiary + admin digest) ------------------------

export interface CutoffReminderDetails {
  subsidiaryId: string;
  projectCode: string;
  cutoffDate: Date;
  /** Each form under this project that this subsidiary still has something
   * pending on, plus why — "Translation not yet approved" and/or "Terms &
   * Conditions not configured" (see cutoffReminderService.ts's own doc
   * comments for exactly what each reason means). A form only appears here
   * once, with every reason that applies to it, not once per reason. */
  items: { formName: string; reasons: string[] }[];
}

function buildCutoffReminderMessage(details: CutoffReminderDetails): EmailContent {
  const link = `${process.env.FRONTEND_URL ?? ""}/my-forms`;
  const cutoff = formatDateOnly(details.cutoffDate);
  const subject = `Reminder: forms pending for "${details.projectCode}" (cutoff ${cutoff})`;
  const text =
    `The following form(s) for subsidiary "${details.subsidiaryId}" under project "${details.projectCode}" ` +
    `still need attention, and this project's cutoff date is ${cutoff}:\n\n` +
    details.items.map((item) => `- ${item.formName}: ${item.reasons.join("; ")}`).join("\n") +
    `\n\nPlease review and address the item(s) above before the cutoff: ${link}\n`;
  const html = renderEmailHtml({
    title: "Forms pending before cutoff",
    intro: `The following form(s) for subsidiary "${details.subsidiaryId}" under project "${details.projectCode}" still need attention — this project's cutoff date is ${cutoff}.`,
    items: details.items.map((item) => `${item.formName}: ${item.reasons.join("; ")}`),
    ctaLabel: "Review your forms",
    ctaUrl: link,
  });
  return { subject, text, html };
}

/**
 * Sends one cutoff-reminder email to every given recipient at once (a
 * subsidiary's own users plus its two extra notification addresses — see
 * cutoffReminderService.ts, which calls this once per (project code,
 * subsidiary) pair per day). Never throws and isn't logged to EmailLogs
 * (that table is Upload-scoped — see EmailLog.uploadId) — same best-effort,
 * console-only discipline as sendUploadNotification, appropriate for a
 * recurring reminder rather than a one-off auditable event.
 */
export async function sendCutoffReminder(recipients: string[], details: CutoffReminderDetails): Promise<void> {
  if (recipients.length === 0) return;
  const result = await sendEmail(recipients, buildCutoffReminderMessage(details));
  if (!result.ok) console.error("Failed to send cutoff reminder email:", result.error);
}

/** One pending item across the whole daily cutoff-reminder run, for the admin
 * summary email below — same shape whether the form's gap is "not yet
 * approved," "Terms & Conditions not configured," or both. */
export interface AdminPendingItem {
  subsidiaryId: string;
  projectCode: string;
  formName: string;
  cutoffDate: Date;
  reasons: string[];
}

function buildAdminPendingSummaryMessage(items: AdminPendingItem[]): EmailContent {
  const link = `${process.env.FRONTEND_URL ?? ""}/admin/form-builder`;
  const subject = `Reminder: ${items.length} form${items.length === 1 ? "" : "s"} pending before cutoff`;
  const text =
    `The following forms still need attention before their project's cutoff date:\n\n` +
    items
      .map(
        (item) =>
          `- ${item.formName} (subsidiary "${item.subsidiaryId}", project "${item.projectCode}", cutoff ${formatDateOnly(item.cutoffDate)}): ${item.reasons.join("; ")}`,
      )
      .join("\n") +
    `\n\nReview them in the Form Initiator: ${link}\n`;
  const html = renderEmailHtml({
    title: `${items.length} form${items.length === 1 ? "" : "s"} pending before cutoff`,
    intro: "The following forms still need attention before their project's cutoff date:",
    items: items.map(
      (item) =>
        `${item.formName} — subsidiary "${item.subsidiaryId}", project "${item.projectCode}", cutoff ${formatDateOnly(item.cutoffDate)}: ${item.reasons.join("; ")}`,
    ),
    ctaLabel: "Open Form Initiator",
    ctaUrl: link,
  });
  return { subject, text, html };
}

/**
 * Sends ONE consolidated summary email to every admin recipient, covering
 * every pending item across every subsidiary/project code from a single
 * cutoff-reminder run — deliberately not one email per form or per
 * subsidiary, so admins get one digest instead of a flood. Same
 * never-throws/best-effort/console-only discipline as sendCutoffReminder; a
 * no-op if there are no recipients or nothing pending.
 */
export async function sendAdminPendingItemsSummary(recipients: string[], items: AdminPendingItem[]): Promise<void> {
  if (recipients.length === 0 || items.length === 0) return;
  const result = await sendEmail(recipients, buildAdminPendingSummaryMessage(items));
  if (!result.ok) console.error("Failed to send admin pending-items summary email:", result.error);
}

// --- Form-configuration submitted for review (scenario 2) ---------------

export interface AdHocReviewSubmittedDetails {
  formName: string;
  subsidiaryId: string;
  submittedAt: Date;
}

function buildAdHocReviewSubmittedMessage(details: AdHocReviewSubmittedDetails): EmailContent {
  const link = `${process.env.FRONTEND_URL ?? ""}/admin/form-builder/adhoc`;
  const subject = `Ad-hoc form submitted for review: ${details.formName}`;
  const text =
    `A subsidiary user submitted an ad-hoc form for review.\n\n` +
    `Form: ${details.formName}\n` +
    `Subsidiary: ${details.subsidiaryId}\n` +
    `Submitted at: ${formatDateTime(details.submittedAt)}\n\n` +
    `Review it here: ${link}\n`;
  const html = renderEmailHtml({
    title: "Ad-hoc form submitted for review",
    rows: [
      { label: "Form", value: details.formName },
      { label: "Subsidiary", value: details.subsidiaryId },
      { label: "Submitted at", value: formatDateTime(details.submittedAt) },
    ],
    ctaLabel: "Review in Form Initiator",
    ctaUrl: link,
  });
  return { subject, text, html };
}

/** Sent the moment a subsidiary user clicks "Submit for Review" on an ad-hoc
 * form (see formBuilderService.submitAdHocFormForReview). Never throws — same
 * best-effort discipline as every other notification here. */
export async function sendAdHocReviewSubmittedNotification(details: AdHocReviewSubmittedDetails): Promise<void> {
  try {
    const recipients = await resolveAdminRecipients();
    if (recipients.length === 0) return;
    const result = await sendEmail(recipients, buildAdHocReviewSubmittedMessage(details));
    if (!result.ok) console.error("Failed to send ad-hoc review-submitted email:", result.error);
  } catch (err) {
    console.error("Failed to send ad-hoc review-submitted email", err);
  }
}

export interface ContributionSubmittedDetails {
  formName: string;
  subsidiaryId: string;
  submittedByUserName: string;
  submittedByUserEmail: string;
  note: string | null;
}

function buildContributionSubmittedMessage(details: ContributionSubmittedDetails): EmailContent {
  const link = `${process.env.FRONTEND_URL ?? ""}/admin/form-builder`;
  const subject = `Translation/extension submitted for review: ${details.formName}`;
  const text =
    `A subsidiary user submitted a translation/extension for review.\n\n` +
    `Form: ${details.formName}\n` +
    `Subsidiary: ${details.subsidiaryId}\n` +
    `Submitted by: ${details.submittedByUserName} (${details.submittedByUserEmail})\n` +
    (details.note ? `Note: ${details.note}\n` : "") +
    `\nReview it here: ${link}\n`;
  const rows = [
    { label: "Form", value: details.formName },
    { label: "Subsidiary", value: details.subsidiaryId },
    { label: "Submitted by", value: `${details.submittedByUserName} (${details.submittedByUserEmail})` },
  ];
  if (details.note) rows.push({ label: "Note", value: details.note });
  const html = renderEmailHtml({
    title: "Translation/extension submitted for review",
    rows,
    ctaLabel: "Review in Form Initiator",
    ctaUrl: link,
  });
  return { subject, text, html };
}

/** Sent when a subsidiary user submits a "Translate & Extend" contribution
 * against a published HR form (see formContributionService.submitContribution).
 * Never throws — same best-effort discipline as every other notification here. */
export async function sendContributionSubmittedNotification(details: ContributionSubmittedDetails): Promise<void> {
  try {
    const recipients = await resolveAdminRecipients();
    if (recipients.length === 0) return;
    const result = await sendEmail(recipients, buildContributionSubmittedMessage(details));
    if (!result.ok) console.error("Failed to send contribution-submitted email:", result.error);
  } catch (err) {
    console.error("Failed to send contribution-submitted email", err);
  }
}

// --- Project code locked (scenario 5) ------------------------------------

export interface ProjectLockedDetails {
  projectCode: string;
  cutoffDate: Date | null;
}

function buildProjectLockedMessage(details: ProjectLockedDetails): EmailContent {
  const link = `${process.env.FRONTEND_URL ?? ""}/my-forms`;
  const subject = `Project "${details.projectCode}" has been locked`;
  const cutoffLine = details.cutoffDate ? ` The campaign cutoff date is ${formatDateOnly(details.cutoffDate)}.` : "";
  const text =
    `Project "${details.projectCode}" has been locked by an admin.\n\n` +
    `No further uploads, form edits, or translation submissions can be made against it.${cutoffLine}\n\n` +
    `View your forms: ${link}\n`;
  const rows = [{ label: "Project code", value: details.projectCode }];
  if (details.cutoffDate) rows.push({ label: "Campaign cutoff", value: formatDateOnly(details.cutoffDate) });
  const html = renderEmailHtml({
    title: `Project "${details.projectCode}" has been locked`,
    intro: `An admin has locked this project. No further uploads, form edits, or translation submissions can be made against it.${cutoffLine}`,
    rows,
    ctaLabel: "View your forms",
    ctaUrl: link,
  });
  return { subject, text, html };
}

/** Sent to a subsidiary's own users (plus its two extra notification
 * addresses) the moment an admin locks a project code that subsidiary has at
 * least one form or upload under (see projectCodeService.setProjectCodeLocked).
 * Never throws — same best-effort discipline as every other notification here. */
export async function sendProjectLockedNotification(recipients: string[], details: ProjectLockedDetails): Promise<void> {
  if (recipients.length === 0) return;
  try {
    const result = await sendEmail(recipients, buildProjectLockedMessage(details));
    if (!result.ok) console.error("Failed to send project-locked email:", result.error);
  } catch (err) {
    console.error("Failed to send project-locked email", err);
  }
}

// --- SMTP settings test send ----------------------------------------------

/** Sends a one-off confirmation email to verify newly-saved SMTP settings
 * actually work (see the Configuration page's "Send test email" button) —
 * the only sender here that reports its outcome back to the caller instead
 * of swallowing it, since the whole point is to surface a failure. */
export async function sendTestEmail(to: string): Promise<SendResult> {
  const html = renderEmailHtml({
    title: "SMTP settings test",
    intro: "This is a test email from Form Builder confirming your SMTP settings are working correctly.",
    footerNote: "You can safely ignore this message.",
  });
  return sendEmail([to], {
    subject: "Form Builder — SMTP test email",
    text: "This is a test email from Form Builder confirming your SMTP settings are working correctly.",
    html,
  });
}
