import fsp from "node:fs/promises";
import { AppDataSource } from "../config/data-source";
import { Upload } from "../entities/Upload";
import { GeneratedFile as GeneratedFileEntity } from "../entities/GeneratedFile";
import { absoluteFilePath, uploadStorageDir } from "./fileService";

/**
 * Permanently purges a user's unsubmitted uploads (status "uploaded" or
 * "generated" — i.e. never submitted, and not "failed" either) the next time
 * they log in. Unlike softDeleteUpload, this is a hard delete of the DB rows
 * *and* the on-disk source/generated files: a workbook the user uploaded but
 * never followed through on submitting isn't worth tracking. "failed" and
 * "submitted" uploads are untouched here — both stay visible indefinitely
 * (see adminUploadService.ts's history listing for "failed", and its default
 * listing for "submitted").
 */
export async function cleanupUnsubmittedUploads(userId: string): Promise<void> {
  const uploadRepo = AppDataSource.getRepository(Upload);
  const stale = await uploadRepo.find({
    where: [
      { userId, isDeleted: false, status: "uploaded" },
      { userId, isDeleted: false, status: "generated" },
    ],
  });
  if (stale.length === 0) return;

  const generatedFileRepo = AppDataSource.getRepository(GeneratedFileEntity);
  for (const upload of stale) {
    await generatedFileRepo.delete({ uploadId: upload.id });
    await uploadRepo.delete(upload.id);
    try {
      await fsp.rm(absoluteFilePath(uploadStorageDir(upload.subsidiaryId, upload.id)), {
        recursive: true,
        force: true,
      });
    } catch (err) {
      // The DB rows are already gone (the part that matters for "no need to
      // track"); a stray directory left behind by a filesystem error isn't
      // worth failing the login request over.
      console.error(`cleanupUnsubmittedUploads: failed to remove files for upload ${upload.id}`, err);
    }
  }
}
