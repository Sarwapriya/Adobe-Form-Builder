import { AppDataSource } from "../config/data-source";
import { Upload } from "../entities/Upload";
import { User } from "../entities/User";
import { findOwnedUpload, toListItem, type UploadListItem } from "./uploadService";
import { sendSubmissionNotification } from "./emailService";

export type SubmitOutcome = "not_found" | "not_ready" | "ok";

export interface SubmitResult {
  outcome: SubmitOutcome;
  upload?: UploadListItem;
}

/**
 * Transitions an upload to "submitted": ownership-checked (the same rule as
 * the rest of uploadService.ts, via findOwnedUpload), only allowed once
 * generation has actually succeeded (status must be "generated" — you can't
 * submit something that failed validation or was never generated), and fires
 * the admin notification email (which records its own outcome in EmailLogs)
 * once the status change is persisted.
 */
export async function submitUpload(uploadId: string, userId: string, isAdmin: boolean): Promise<SubmitResult> {
  const upload = await findOwnedUpload(uploadId, userId, isAdmin);
  if (!upload) {
    return { outcome: "not_found" };
  }
  if (upload.status !== "generated") {
    return { outcome: "not_ready" };
  }

  const submittedAt = new Date();
  const uploadRepo = AppDataSource.getRepository(Upload);
  await uploadRepo.update(uploadId, { status: "submitted", submittedAt });
  const updated = await uploadRepo.findOneOrFail({ where: { id: uploadId } });

  // upload.userId is only ever null for legacy rows created before Users
  // existed — an admin submitting one of those on someone's behalf still
  // works, just with a placeholder name/email in the notification email.
  const submitter = upload.userId
    ? await AppDataSource.getRepository(User).findOne({ where: { id: upload.userId } })
    : null;

  await sendSubmissionNotification({
    uploadId: updated.id,
    userName: submitter?.username ?? "(unknown user)",
    userEmail: submitter?.email ?? "(unknown)",
    uploadDate: updated.uploadDate,
    subsidiaryId: updated.subsidiaryId,
    fileName: updated.fileName,
    submittedAt,
  });

  return { outcome: "ok", upload: toListItem(updated) };
}
