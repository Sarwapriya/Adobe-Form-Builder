import fsp from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import type { Request } from "express";
import type { GeneratedFile } from "@formbuilder/shared";
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

export function absoluteFilePath(relativePath: string): string {
  return path.join(getUploadDir(), relativePath);
}

/** Directory (relative to UPLOAD_DIR) holding everything for one subsidiary+version. */
function versionedDir(subsidiaryId: string, version: number): string {
  return path.join(sanitizeSubsidiaryId(subsidiaryId), `v${version}`);
}

/** Relative path of the stored source workbook for one subsidiary+version,
 * preserving the original .xlsx/.xls extension. */
export function versionedSourcePath(subsidiaryId: string, version: number, originalFileName: string): string {
  const ext = path.extname(sanitizeFileName(originalFileName)).toLowerCase();
  return path.join(versionedDir(subsidiaryId, version), `source${ext}`);
}

/** Directory (relative to UPLOAD_DIR) holding one subsidiary+version's generated
 * solution files. */
export function versionedGeneratedDir(subsidiaryId: string, version: number): string {
  return path.join(versionedDir(subsidiaryId, version), "generated");
}

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ACCEPTED_EXTENSIONS.has(ext) || !ACCEPTED_MIME_TYPES.has(file.mimetype)) {
    cb(new UnsupportedFileTypeError());
    return;
  }
  cb(null, true);
}

// A real .xlsx is a ZIP archive (Office Open XML), always starting with the
// ZIP local-file-header signature. A real legacy .xls is an OLE2 Compound
// File Binary, with its own fixed signature.
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const OLE2_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

/**
 * Sniffs the uploaded bytes' magic number rather than trusting the extension
 * and MIME type alone — both are fully attacker-controlled request metadata
 * (fileFilter above only checks those, since the full buffer isn't available
 * yet at that point in multer's streaming). Rejects anything matching neither
 * known signature, even if its extension/MIME claimed to be Excel.
 */
export function hasExcelFileSignature(buffer: Buffer): boolean {
  return buffer.subarray(0, 4).equals(ZIP_SIGNATURE) || buffer.subarray(0, 8).equals(OLE2_SIGNATURE);
}

/**
 * Buffers the uploaded file in memory rather than writing it to disk during
 * multipart parsing — the file's final on-disk path depends on a version number
 * that's only known once uploadService.ts has run its locked version-assignment
 * transaction, which happens *after* multer has already finished parsing the
 * request. Files are capped at 10 MiB, so buffering in memory is not a concern.
 */
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

/** Writes the uploaded workbook's bytes to its versioned source path, creating
 * directories as needed. Returns the path relative to UPLOAD_DIR, as stored in
 * the Uploads.filePath column. */
export async function saveSourceFile(
  subsidiaryId: string,
  version: number,
  originalFileName: string,
  buffer: Buffer,
): Promise<string> {
  const relativePath = versionedSourcePath(subsidiaryId, version, originalFileName);
  const absolutePath = absoluteFilePath(relativePath);
  await fsp.mkdir(path.dirname(absolutePath), { recursive: true });
  await fsp.writeFile(absolutePath, buffer);
  return relativePath;
}

export interface SavedGeneratedFile {
  fileName: string;
  relativePath: string;
}

/** Writes every generated solution file to its versioned generated/ directory.
 * Returns each file's original name (for GeneratedFiles.fileName) alongside the
 * path it was saved at, relative to UPLOAD_DIR (for GeneratedFiles.filePath). */
export async function saveGeneratedFiles(
  subsidiaryId: string,
  version: number,
  files: GeneratedFile[],
): Promise<SavedGeneratedFile[]> {
  const generatedDir = versionedGeneratedDir(subsidiaryId, version);
  const absoluteDir = absoluteFilePath(generatedDir);
  await fsp.mkdir(absoluteDir, { recursive: true });

  const saved: SavedGeneratedFile[] = [];
  for (const file of files) {
    const relativePath = path.join(generatedDir, file.path);
    await fsp.writeFile(absoluteFilePath(relativePath), file.contents, "utf-8");
    saved.push({ fileName: file.path, relativePath });
  }
  return saved;
}
