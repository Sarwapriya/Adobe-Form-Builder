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
 *
 * This is also the one place a version number is ever assigned — scoped to
 * prior *submitted* uploads for the subsidiary (never to ones that were only
 * generated or that failed, so an abandoned/rejected attempt never consumes a
 * number), reserved inside a short locked transaction the same way
 * uploadService.ts's upload-time reservation used to work, so two concurrent
 * submissions for the same subsidiary can't collide on the same version.
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
  await AppDataSource.transaction(async (manager) => {
    const rows: Array<{ nextVersion: number }> = await manager.query(
      `SELECT ISNULL(MAX(version), 0) + 1 AS nextVersion FROM Uploads WITH (UPDLOCK, HOLDLOCK) WHERE subsidiaryId = @0 AND status = 'submitted'`,
      [upload.subsidiaryId],
    );
    const nextVersion = rows[0].nextVersion;
    await manager
      .getRepository(Upload)
      .update(uploadId, { status: "submitted", submittedAt, version: nextVersion });
  });
  const updated = await AppDataSource.getRepository(Upload).findOneOrFail({ where: { id: uploadId } });

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
