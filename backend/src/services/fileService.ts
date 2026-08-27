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

/**
 * Directory (relative to UPLOAD_DIR) holding everything for one upload — keyed
 * by the upload's own id, not its version number. Version numbers are only
 * ever assigned at submission time (see submissionService.ts), scoped to
 * *submitted* uploads for the subsidiary, so an in-progress or failed upload
 * has no version to key storage off of in the first place; using the id
 * instead means storage never has to be reorganized once/if a version number
 * shows up later. Exported so uploadCleanupService.ts can remove it wholesale
 * (source + generated files) when purging an upload that was never submitted.
 */
export function uploadStorageDir(subsidiaryId: string, uploadId: string): string {
  return path.join(sanitizeSubsidiaryId(subsidiaryId), uploadId);
}

/** Relative path of the stored source workbook for one upload, preserving the
 * original .xlsx/.xls extension. */
export function uploadSourcePath(subsidiaryId: string, uploadId: string, originalFileName: string): string {
  const ext = path.extname(sanitizeFileName(originalFileName)).toLowerCase();
  return path.join(uploadStorageDir(subsidiaryId, uploadId), `source${ext}`);
}

/** Directory (relative to UPLOAD_DIR) holding one upload's generated solution
 * files. */
export function uploadGeneratedDir(subsidiaryId: string, uploadId: string): string {
  return path.join(uploadStorageDir(subsidiaryId, uploadId), "generated");
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
 * multipart parsing — the signature check (hasExcelFileSignature) needs the
 * whole buffer before any Upload row (and therefore any id-derived storage
 * path) exists yet. Files are capped at 10 MiB, so buffering in memory is not
 * a concern.
 */
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

/** Writes the uploaded workbook's bytes to its per-upload source path, creating
 * directories as needed. Returns the path relative to UPLOAD_DIR, as stored in
 * the Uploads.filePath column. */
export async function saveSourceFile(
  subsidiaryId: string,
  uploadId: string,
  originalFileName: string,
  buffer: Buffer,
): Promise<string> {
  const relativePath = uploadSourcePath(subsidiaryId, uploadId, originalFileName);
  const absolutePath = absoluteFilePath(relativePath);
  await fsp.mkdir(path.dirname(absolutePath), { recursive: true });
  await fsp.writeFile(absolutePath, buffer);
  return relativePath;
}

export interface SavedGeneratedFile {
  fileName: string;
  relativePath: string;
}

/** Writes every generated solution file to one upload's generated/ directory.
 * Returns each file's original name (for GeneratedFiles.fileName) alongside the
 * path it was saved at, relative to UPLOAD_DIR (for GeneratedFiles.filePath). */
export async function saveGeneratedFiles(
  subsidiaryId: string,
  uploadId: string,
  files: GeneratedFile[],
): Promise<SavedGeneratedFile[]> {
  const generatedDir = uploadGeneratedDir(subsidiaryId, uploadId);
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

/** Directory (relative to UPLOAD_DIR) holding one FormVersion's generated solution
 * files — the builder-authored counterpart to uploadGeneratedDir, keyed by the
 * FormVersion's own id (not the parent Form's) since a publish clones a fresh draft
 * version and each published version keeps its own independent output on disk. */
export function formVersionGeneratedDir(subsidiaryId: string, formVersionId: string): string {
  return path.join(sanitizeSubsidiaryId(subsidiaryId), "forms", formVersionId, "generated");
}

/** Directory (relative to UPLOAD_DIR) holding a Configuration form's own QA reports
 * — keyed by the parent Form's own id (not a FormVersion's), since a QA run against a
 * pending contribution or an ad-hoc draft never produces a FormVersion/GeneratedFiles
 * row to key off of in the first place — see qaRunService.createContributionQaRun/
 * createAdHocReviewQaRun. */
export function formQaStorageDir(subsidiaryId: string, formId: string): string {
  return path.join(sanitizeSubsidiaryId(subsidiaryId), "forms", formId, "qa");
}

/** Writes every generated solution file to one FormVersion's generated/ directory —
 * the builder-authored counterpart to saveGeneratedFiles above. Kept as its own
 * function (not a shared helper parameterized by directory) since the two callers'
 * naming/ownership concepts (upload vs. form version) are distinct enough that a
 * shared signature would obscure which one a given call site means. */
export async function saveFormVersionGeneratedFiles(
  subsidiaryId: string,
  formVersionId: string,
  files: GeneratedFile[],
): Promise<SavedGeneratedFile[]> {
  const generatedDir = formVersionGeneratedDir(subsidiaryId, formVersionId);
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

/** Directory (relative to UPLOAD_DIR) holding one Question Master version's generated
 * .xlsx — keyed by the QuestionMasterVersion row's own id, not its version number, same
 * "never has to be reorganized" reasoning as uploadStorageDir above: the version number
 * is only known once the locked transaction that assigns it commits, but the id can be
 * minted upfront (see questionMasterService.generateQuestionMaster). Nested under the
 * (sanitized) project code purely for human-browsable organization on disk. Reuses
 * sanitizeSubsidiaryId as a generic path-segment sanitizer — a project code is just as
 * free-text/attacker-influenceable as a subsidiaryId route param, and the same safe
 * character set applies. */
export function questionMasterDir(projectCode: string, id: string): string {
  return path.join("question-master", sanitizeSubsidiaryId(projectCode), id);
}

/** Writes one Question Master version's .xlsx bytes to disk. Returns the path relative
 * to UPLOAD_DIR, as stored in QuestionMasterVersions.filePath. */
export async function saveQuestionMasterFile(projectCode: string, id: string, bytes: Uint8Array): Promise<string> {
  const relativePath = path.join(questionMasterDir(projectCode, id), "question-master.xlsx");
  const absolutePath = absoluteFilePath(relativePath);
  await fsp.mkdir(path.dirname(absolutePath), { recursive: true });
  await fsp.writeFile(absolutePath, bytes);
  return relativePath;
}
