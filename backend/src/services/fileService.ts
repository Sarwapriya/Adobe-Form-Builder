import fs from "fs";
import path from "path";
import multer from "multer";
import type { Request } from "express";
import { sanitizeFileName } from "../utils/sanitizeFileName";
import { sanitizeSubsidiaryId } from "../utils/sanitizeSubsidiaryId";
import { UnsupportedFileTypeError } from "../utils/errors";

const ACCEPTED_EXTENSIONS = new Set([".xlsx", ".xls"]);
const ACCEPTED_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MiB

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? "./uploads";
}

export function subsidiaryUploadDir(subsidiaryId: string): string {
  return path.join(getUploadDir(), sanitizeSubsidiaryId(subsidiaryId));
}

const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    try {
      const dir = subsidiaryUploadDir(req.params.subsidiaryId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err as Error, "");
    }
  },
  filename: (_req, file, cb) => {
    const name = `${Date.now()}_${sanitizeFileName(file.originalname)}`;
    cb(null, name);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ACCEPTED_EXTENSIONS.has(ext) || !ACCEPTED_MIME_TYPES.has(file.mimetype)) {
    cb(new UnsupportedFileTypeError());
    return;
  }
  cb(null, true);
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

/** Path of a stored upload, relative to UPLOAD_DIR, as saved in the DB. */
export function relativeFilePath(subsidiaryId: string, storedFileName: string): string {
  return path.join(sanitizeSubsidiaryId(subsidiaryId), storedFileName);
}

export function absoluteFilePath(relativePath: string): string {
  return path.join(getUploadDir(), relativePath);
}
