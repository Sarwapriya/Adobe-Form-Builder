import sgMail from "@sendgrid/mail";
import { AppDataSource } from "../config/data-source";
import { AdminSetting } from "../entities/AdminSetting";
import { EmailLog } from "../entities/EmailLog";

let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    sgMail.setApiKey(apiKey);
  }
  initialized = true;
}

async function resolveRecipient(): Promise<string | null> {
  const envRecipient = process.env.FORMBUILDER_NOTIFY_EMAIL;
  if (envRecipient && envRecipient.trim().length > 0) {
    return envRecipient;
  }

  const setting = await AppDataSource.getRepository(AdminSetting).findOne({
    where: { key: "notificationEmail" },
  });
  return setting?.value ?? null;
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

function buildUploadMessage(to: string, details: UploadNotificationDetails) {
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
    to,
    from: process.env.FORMBUILDER_NOTIFY_EMAIL ?? to,
    subject,
    text,
  };
}

/**
 * Sends the upload notification. Never throws — a missing recipient or a
 * SendGrid failure is logged and swallowed so it can't fail the upload
 * request itself.
 */
export async function sendUploadNotification(
  details: UploadNotificationDetails
): Promise<void> {
  try {
    ensureInitialized();
    const recipient = await resolveRecipient();
    if (!recipient) {
      console.warn(
        "No notification recipient configured (FORMBUILDER_NOTIFY_EMAIL / AdminSettings.notificationEmail) — skipping email"
      );
      return;
    }
    await sgMail.send(buildUploadMessage(recipient, details));
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

function buildSubmissionMessage(to: string, details: SubmissionNotificationDetails) {
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
    to,
    from: process.env.FORMBUILDER_NOTIFY_EMAIL ?? to,
    subject: "New Web Form Submission",
    text,
  };
}

/**
 * Sends the submission notification and records the outcome in EmailLogs.
 * Unlike sendUploadNotification, submission is a first-class auditable event
 * per the product requirement ("record submission details... email the
 * Admin"), so every attempt — sent, failed, or skipped for lack of a
 * configured recipient — leaves a row. Never throws — same swallow-and-log
 * discipline as sendUploadNotification, so a notification failure can't fail
 * the submit request itself.
 */
export async function sendSubmissionNotification(details: SubmissionNotificationDetails): Promise<void> {
  const emailLogRepo = AppDataSource.getRepository(EmailLog);
  ensureInitialized();
  const recipient = await resolveRecipient();

  if (!recipient) {
    console.warn(
      "No notification recipient configured (FORMBUILDER_NOTIFY_EMAIL / AdminSettings.notificationEmail) — skipping submission email"
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

  try {
    await sgMail.send(buildSubmissionMessage(recipient, details));
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
