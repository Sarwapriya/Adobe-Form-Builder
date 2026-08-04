import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { AppDataSource } from "../config/data-source";
import { AdminSetting } from "../entities/AdminSetting";
import { EmailLog } from "../entities/EmailLog";

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
    from: resolveFrom(to),
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
    const recipient = await resolveRecipient();
    if (!recipient) {
      console.warn(
        "No notification recipient configured (FORMBUILDER_NOTIFY_EMAIL / AdminSettings.notificationEmail) — skipping email"
      );
      return;
    }
    await transporter.sendMail(buildUploadMessage(recipient, details));
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
    from: resolveFrom(to),
    subject: "New Web Form Submission",
    text,
  };
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
    await transporter.sendMail(buildSubmissionMessage(recipient, details));
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
