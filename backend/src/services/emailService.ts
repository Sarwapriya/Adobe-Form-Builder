import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { AppDataSource } from "../config/data-source";
import { EmailLog } from "../entities/EmailLog";
import { getGlobalNotificationEmails } from "./adminSettingsService";

let transporter: Transporter | null = null;
let initialized = false;

/** Builds the SMTP transport once, lazily, from SMTP_HOST/PORT/SECURE/USER/
 * PASSWORD. Left null (rather than throwing) when SMTP_HOST isn't set, so a
 * missing config degrades to "skip and log" the same way a missing SendGrid
 * key used to — this service must never be the reason an upload/submit
 * request fails. */
function ensureInitialized(): void {
  if (initialized) return;
  initialized = true;
  const host = process.env.SMTP_HOST;
  if (!host) return;

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
}

function resolveFrom(to: string): string {
  return process.env.SMTP_FROM ?? process.env.SMTP_USER ?? to;
}

/** Every admin-facing notification (upload, submission) goes to the same
 * recipient set: FORMBUILDER_NOTIFY_EMAIL if set (a single hard override, same
 * as before this function supported more than one address), otherwise both of
 * the admin-configurable global addresses from AdminSettings (see
 * adminSettingsService.getGlobalNotificationEmails) that are actually set —
 * zero, one, or two of them. */
async function resolveRecipients(): Promise<string[]> {
  const envRecipient = process.env.FORMBUILDER_NOTIFY_EMAIL;
  if (envRecipient && envRecipient.trim().length > 0) {
    return [envRecipient.trim()];
  }

  const { notificationEmail1, notificationEmail2 } = await getGlobalNotificationEmails();
  return [notificationEmail1, notificationEmail2].filter((email): email is string => !!email);
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

interface UploadNotificationDetails {
  subsidiaryId: string;
  fileName: string;
  uploadDate: Date;
  uploadedBy: string;
}

function buildUploadMessage(to: string[], details: UploadNotificationDetails) {
  const adminLink = `${process.env.FRONTEND_URL ?? ""}/admin`;
  const subject = `New upload for subsidiary ${details.subsidiaryId}: ${details.fileName}`;
  const text =
    `A new file was uploaded.\n\n` +
    `Subsidiary: ${details.subsidiaryId}\n` +
    `File: ${details.fileName}\n` +
    `Uploaded by: ${details.uploadedBy}\n` +
    `Uploaded at: ${details.uploadDate.toISOString()}\n` +
    `Admin view: ${adminLink}\n`;

  return {
    to: to.join(", "),
    from: resolveFrom(to[0]),
    subject,
    text,
  };
}

/**
 * Sends the upload notification. Never throws — a missing recipient/SMTP
 * config or a send failure is logged and swallowed so it can't fail the
 * upload request itself.
 */
export async function sendUploadNotification(
  details: UploadNotificationDetails
): Promise<void> {
  try {
    ensureInitialized();
    if (!transporter) {
      console.warn("SMTP not configured (SMTP_HOST) — skipping upload notification email");
      return;
    }
    const recipients = await resolveRecipients();
    if (recipients.length === 0) {
      console.warn(
        "No notification recipient configured (FORMBUILDER_NOTIFY_EMAIL / AdminSettings notification emails) — skipping email"
      );
      return;
    }
    await transporter.sendMail(buildUploadMessage(recipients, details));
  } catch (err) {
    console.error("Failed to send upload notification email", err);
  }
}

export interface SubmissionNotificationDetails {
  uploadId: string;
  userName: string;
  userEmail: string;
  uploadDate: Date;
  subsidiaryId: string;
  fileName: string;
  submittedAt: Date;
}

function buildSubmissionMessage(to: string[], details: SubmissionNotificationDetails) {
  const adminLink = `${process.env.FRONTEND_URL ?? ""}/admin`;
  const text =
    `A new web form has been submitted.\n\n` +
    `User:\n${details.userName} (${details.userEmail})\n\n` +
    `Subsidiary:\n${details.subsidiaryId}\n\n` +
    `Excel File:\n${details.fileName}\n\n` +
    `Uploaded:\n${formatDateTime(details.uploadDate)}\n\n` +
    `Submission Time:\n${formatDateTime(details.submittedAt)}\n\n` +
    `Please review it in the Admin Dashboard: ${adminLink}\n`;

  return {
    to: to.join(", "),
    from: resolveFrom(to[0]),
    subject: "New Web Form Submission",
    text,
  };
}

function formatDateOnly(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

export interface CutoffReminderDetails {
  subsidiaryId: string;
  projectCode: string;
  cutoffDate: Date;
  /** Names of the forms under this project that this subsidiary still hasn't
   * gotten approved — see cutoffReminderService.ts's own doc comment for
   * exactly what "not yet approved" means. */
  formNames: string[];
}

function buildCutoffReminderMessage(to: string[], details: CutoffReminderDetails) {
  const link = `${process.env.FRONTEND_URL ?? ""}/my-forms`;
  const cutoff = formatDateOnly(details.cutoffDate);
  const subject = `Reminder: forms pending approval for "${details.projectCode}" (cutoff ${cutoff})`;
  const text =
    `The following form(s) for subsidiary "${details.subsidiaryId}" under project "${details.projectCode}" ` +
    `are not yet approved, and this project's cutoff date is ${cutoff}:\n\n` +
    details.formNames.map((name) => `- ${name}`).join("\n") +
    `\n\nPlease review and submit any needed translations, questions, or consents for admin approval before the ` +
    `cutoff: ${link}\n`;

  return { to: to.join(", "), from: resolveFrom(to[0]), subject, text };
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
  try {
    ensureInitialized();
    if (!transporter) {
      console.warn("SMTP not configured (SMTP_HOST) — skipping cutoff reminder email");
      return;
    }
    await transporter.sendMail(buildCutoffReminderMessage(recipients, details));
  } catch (err) {
    console.error("Failed to send cutoff reminder email", err);
  }
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
  ensureInitialized();

  if (!transporter) {
    console.warn("SMTP not configured (SMTP_HOST) — skipping submission notification email");
    await emailLogRepo.save(
      emailLogRepo.create({
        uploadId: details.uploadId,
        recipient: "(no recipient configured)",
        status: "failed",
        errorMessage: "SMTP not configured (SMTP_HOST)",
      }),
    );
    return;
  }

  const recipients = await resolveRecipients();

  if (recipients.length === 0) {
    console.warn(
      "No notification recipient configured (FORMBUILDER_NOTIFY_EMAIL / AdminSettings notification emails) — skipping submission email"
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
  try {
    await transporter.sendMail(buildSubmissionMessage(recipients, details));
    await emailLogRepo.save(
      emailLogRepo.create({ uploadId: details.uploadId, recipient, status: "sent", errorMessage: null }),
    );
  } catch (err) {
    console.error("Failed to send submission notification email", err);
    await emailLogRepo.save(
      emailLogRepo.create({
        uploadId: details.uploadId,
        recipient,
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
      }),
    );
  }
}
