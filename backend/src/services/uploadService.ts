import { AppDataSource } from "../config/data-source";
import { Upload } from "../entities/Upload";
import { relativeFilePath } from "./fileService";
import { sendUploadNotification } from "./emailService";

export interface UploadListItem {
  fileId: string;
  fileName: string;
  uploadDate: Date;
  filePath: string;
}

export interface AdminUploadListItem extends UploadListItem {
  submissionCount: number;
}

function toListItem(upload: Upload): UploadListItem {
  return {
    fileId: upload.id,
    fileName: upload.fileName,
    uploadDate: upload.uploadDate,
    filePath: upload.filePath,
  };
}

export async function recordUpload(
  subsidiaryId: string,
  file: Express.Multer.File,
  uploadedBy: string
): Promise<UploadListItem> {
  const repo = AppDataSource.getRepository(Upload);

  const upload = repo.create({
    subsidiaryId,
    fileName: file.originalname,
    filePath: relativeFilePath(subsidiaryId, file.filename),
  });
  const saved = await repo.save(upload);

  await sendUploadNotification({
    subsidiaryId,
    fileName: saved.fileName,
    uploadDate: saved.uploadDate,
    uploadedBy,
  });

  return toListItem(saved);
}

export async function listUploadsForSubsidiary(
  subsidiaryId: string
): Promise<UploadListItem[]> {
  const repo = AppDataSource.getRepository(Upload);
  const uploads = await repo.find({
    where: { subsidiaryId },
    order: { uploadDate: "DESC" },
  });
  return uploads.map(toListItem);
}

export async function listAllUploads(
  subsidiaryId?: string
): Promise<AdminUploadListItem[]> {
  const repo = AppDataSource.getRepository(Upload);
  const uploads = await repo.find({
    where: subsidiaryId ? { subsidiaryId } : {},
    order: { uploadDate: "DESC" },
  });
  return uploads.map((upload) => ({
    ...toListItem(upload),
    submissionCount: upload.submissionCount,
  }));
}

export async function incrementSubmissionCount(
  fileId: string
): Promise<number | null> {
  const result = await AppDataSource.query(
    `UPDATE Uploads SET submissionCount = submissionCount + 1
     OUTPUT INSERTED.submissionCount AS submissionCount
     WHERE id = @0`,
    [fileId]
  );
  if (!result || result.length === 0) {
    return null;
  }
  return result[0].submissionCount as number;
}

export async function findUploadById(fileId: string): Promise<Upload | null> {
  return AppDataSource.getRepository(Upload).findOne({ where: { id: fileId } });
}
