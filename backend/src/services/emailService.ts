import sgMail from "@sendgrid/mail";
import { AppDataSource } from "../config/data-source";
import { AdminSetting } from "../entities/AdminSetting";

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

interface UploadNotificationDetails {
  subsidiaryId: string;
  fileName: string;
  uploadDate: Date;
  uploadedBy: string;
}

function buildMessage(to: string, details: UploadNotificationDetails) {
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
    await sgMail.send(buildMessage(recipient, details));
  } catch (err) {
    console.error("Failed to send upload notification email", err);
  }
}
