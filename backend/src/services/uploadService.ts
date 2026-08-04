import fsp from "node:fs/promises";
import type { ValidationResult } from "@formbuilder/shared";
import { resolvePaging, type PagedResult } from "../utils/queryParsing";
import { UnsupportedFileTypeError } from "../utils/errors";
import { AppDataSource } from "../config/data-source";
import { Upload, type UploadStatus } from "../entities/Upload";
import { GeneratedFile as GeneratedFileEntity, type GeneratedFileType } from "../entities/GeneratedFile";
import { absoluteFilePath, hasExcelFileSignature, saveGeneratedFiles, saveSourceFile, versionedGeneratedDir } from "./fileService";
import { classifyFileType, generateFromWorkbook } from "./generationService";
import { sendUploadNotification } from "./emailService";
import { getAdminSetting } from "./adminSettingsService";

export interface UploadListItem {
  id: string;
  subsidiaryId: string;
  fileName: string;
  uploadDate: Date;
  userId: string | null;
  version: number;
  status: UploadStatus;
  submittedAt: Date | null;
  submissionCount: number;
}

export interface GeneratedFileSummary {
  id: string;
  fileName: string;
  filePath: string;
  fileType: GeneratedFileType;
}

export interface UploadDetail extends UploadListItem {
  generatedFiles: GeneratedFileSummary[];
}

/** Exported so submissionService.ts (and any future caller) can build the same
 * response shape after mutating an Upload row directly, instead of duplicating
 * this field list. */
export function toListItem(upload: Upload): UploadListItem {
  return {
    id: upload.id,
    subsidiaryId: upload.subsidiaryId,
    fileName: upload.fileName,
    uploadDate: upload.uploadDate,
    userId: upload.userId,
    version: upload.version,
    status: upload.status,
    submittedAt: upload.submittedAt,
    submissionCount: upload.submissionCount,
  };
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

// Coupled to the exact wording of the warning validateWorkbook() emits for
// formula-like cell content (packages/shared/src/excel/validator.ts) — if
// that message text ever changes, update this marker to match.
const FORMULA_WARNING_MARKER = "formula-like character";

/**
 * The shared validateWorkbook() treats formula-like cell content (CSV/Excel-
 * injection smell) as a non-blocking warning — appropriate for the client
 * wizard, where a human reviews the live preview before ever generating.
 * Server-side uploads have no such review step, so this promotes that one
 * specific warning to a blocking condition here, without touching
 * validateWorkbook()'s own shared behavior (which the wizard still relies on
 * staying a warning, not an error).
 */
function hasFormulaLikeWarning(validation: ValidationResult): boolean {
  return validation.warnings.some((w) => w.message.includes(FORMULA_WARNING_MARKER));
}

/**
 * Finds an upload by id, applying the one ownership rule everywhere it's
 * needed: admins may access any (non-deleted) upload, standard users only
 * their own. Returns null for both "doesn't exist" and "exists but isn't
 * yours" — every caller treats both identically (404), so this never leaks
 * which case occurred.
 */
export async function findOwnedUpload(uploadId: string, userId: string, isAdmin: boolean): Promise<Upload | null> {
  const upload = await AppDataSource.getRepository(Upload).findOne({ where: { id: uploadId, isDeleted: false } });
  if (!upload || (!isAdmin && upload.userId !== userId)) {
    return null;
  }
  return upload;
}

/**
 * Runs the Excel->Solution pipeline for an already-persisted upload and records
 * the outcome: either the generated files are saved and status becomes
 * "generated", or (blocking validation errors, or an unexpected failure) status
 * becomes "failed". Either outcome leaves the Upload row as a real, visible,
 * auditable record — never silently rolled back.
 */
async function runGeneration(upload: Upload, buffer: Buffer): Promise<ValidationResult> {
  const uploadRepo = AppDataSource.getRepository(Upload);
  try {
    const result = generateFromWorkbook(toArrayBuffer(buffer), upload.fileName);

    if (result.validation.errors.length > 0 || hasFormulaLikeWarning(result.validation)) {
      await uploadRepo.update(upload.id, { status: "failed" });
      return result.validation;
    }

    const saved = await saveGeneratedFiles(upload.subsidiaryId, upload.version, result.files);
    const generatedFileRepo = AppDataSource.getRepository(GeneratedFileEntity);
    const rows = saved.map((f) =>
      generatedFileRepo.create({
        uploadId: upload.id,
        fileName: f.fileName,
        filePath: f.relativePath,
        fileType: classifyFileType(f.fileName, result.fileNames),
      }),
    );
    await generatedFileRepo.save(rows);

    await uploadRepo.update(upload.id, {
      status: "generated",
      generatedPath: versionedGeneratedDir(upload.subsidiaryId, upload.version),
    });

    return result.validation;
  } catch (err) {
    await uploadRepo.update(upload.id, { status: "failed" });
    throw err;
  }
}

export interface CreateUploadInput {
  subsidiaryId: string;
  file: Express.Multer.File;
  userId: string;
  uploadedByUsername: string;
}

export interface CreateUploadResult {
  upload: UploadListItem;
  validation: ValidationResult;
}

/**
 * Creates a new upload: reserves the next version number for this subsidiary
 * (a locked read inside a short transaction, so two concurrent uploads to the
 * same subsidiary can never collide on the same version number) and persists
 * the Upload row immediately with status "uploaded" — then, outside that
 * transaction, since generation is CPU/IO work that shouldn't hold a database
 * lock, runs the Excel->Solution pipeline and records the outcome.
 */
export async function createUpload(input: CreateUploadInput): Promise<CreateUploadResult> {
  const { subsidiaryId, file, userId, uploadedByUsername } = input;

  // Checked here (not just in fileService's multer fileFilter, which only
  // sees the extension/MIME before the full buffer exists) so a renamed
  // non-Excel file is rejected before it ever consumes a version number.
  if (!hasExcelFileSignature(file.buffer)) {
    throw new UnsupportedFileTypeError("File content does not match a valid .xlsx/.xls signature");
  }

  const upload = await AppDataSource.transaction(async (manager) => {
    const rows: Array<{ nextVersion: number }> = await manager.query(
      `SELECT ISNULL(MAX(version), 0) + 1 AS nextVersion FROM Uploads WITH (UPDLOCK, HOLDLOCK) WHERE subsidiaryId = @0`,
      [subsidiaryId],
    );
    const nextVersion = rows[0].nextVersion;

    const sourcePath = await saveSourceFile(subsidiaryId, nextVersion, file.originalname, file.buffer);

    const uploadRepo = manager.getRepository(Upload);
    const created = uploadRepo.create({
      subsidiaryId,
      fileName: file.originalname,
      filePath: sourcePath,
      userId,
      version: nextVersion,
      status: "uploaded",
    });
    return uploadRepo.save(created);
  });

  await sendUploadNotification({
    subsidiaryId,
    fileName: upload.fileName,
    uploadDate: upload.uploadDate,
    uploadedBy: uploadedByUsername,
  });

  const validation = await runGeneration(upload, file.buffer);
  const refreshed = await AppDataSource.getRepository(Upload).findOneOrFail({ where: { id: upload.id } });

  return { upload: toListItem(refreshed), validation };
}

export interface ListOptions {
  page?: number;
  pageSize?: number;
  sortBy?: "uploadDate" | "subsidiaryId" | "status" | "version";
  sortDir?: "ASC" | "DESC";
}

function buildOrder(sortBy: NonNullable<ListOptions["sortBy"]>, sortDir: "ASC" | "DESC") {
  switch (sortBy) {
    case "subsidiaryId":
      return { subsidiaryId: sortDir } as const;
    case "status":
      return { status: sortDir } as const;
    case "version":
      return { version: sortDir } as const;
    case "uploadDate":
    default:
      return { uploadDate: sortDir } as const;
  }
}

/** The caller's own upload history — always scoped to `userId` regardless of
 * role. Admin's cross-user view lives in the separate /admin/uploads endpoint. */
export async function listUploadsForUser(userId: string, options: ListOptions = {}): Promise<PagedResult<UploadListItem>> {
  const { page, pageSize, skip } = resolvePaging(options);
  const sortBy = options.sortBy ?? "uploadDate";
  const sortDir = options.sortDir ?? "DESC";

  const [rows, total] = await AppDataSource.getRepository(Upload).findAndCount({
    where: { userId, isDeleted: false },
    order: buildOrder(sortBy, sortDir),
    skip,
    take: pageSize,
  });

  return { items: rows.map(toListItem), total, page, pageSize };
}

/** Ownership-checked detail view, including its generated files. Admins can
 * view any upload; standard users only their own — same 404-either-way rule
 * as findOwnedUpload. */
export async function getUploadDetail(uploadId: string, userId: string, isAdmin: boolean): Promise<UploadDetail | null> {
  const upload = await findOwnedUpload(uploadId, userId, isAdmin);
  if (!upload) return null;

  const files = await AppDataSource.getRepository(GeneratedFileEntity).find({
    where: { uploadId },
    order: { fileName: "ASC" },
  });

  return {
    ...toListItem(upload),
    generatedFiles: files.map((f) => ({ id: f.id, fileName: f.fileName, filePath: f.filePath, fileType: f.fileType })),
  };
}

export type SoftDeleteResult = "deleted" | "not_found" | "locked";

/** Soft-deletes an upload (hides it from listings, never removes the row) —
 * ownership-checked via findOwnedUpload, and unconditionally blocked once the
 * upload has been submitted (this rule doesn't depend on the
 * lockGeneratedFilesOnSubmit toggle — a submitted record should never
 * disappear from an admin's view, regardless of that setting). */
export async function softDeleteUpload(uploadId: string, userId: string, isAdmin: boolean): Promise<SoftDeleteResult> {
  const upload = await findOwnedUpload(uploadId, userId, isAdmin);
  if (!upload) return "not_found";
  if (upload.status === "submitted") return "locked";

  await AppDataSource.getRepository(Upload).update(uploadId, { isDeleted: true });
  return "deleted";
}

export type RegenerateOutcome = "not_found" | "locked" | "ok";

export interface RegenerateResult {
  outcome: RegenerateOutcome;
  validation?: ValidationResult;
}

/**
 * Re-runs generation for an existing upload from its already-stored source
 * workbook, replacing its GeneratedFiles rows. Covers regeneration after a
 * transient failure or a codegen change — ownership-checked via
 * findOwnedUpload. Once an upload is submitted, regeneration is blocked *if*
 * the admin-configurable lockGeneratedFilesOnSubmit setting is enabled
 * (defaults to locked/"true" — see the AddUsersAndVersioning migration —
 * fails safe if the setting row is ever missing).
 */
export async function regenerateUpload(uploadId: string, userId: string, isAdmin: boolean): Promise<RegenerateResult> {
  const upload = await findOwnedUpload(uploadId, userId, isAdmin);
  if (!upload) return { outcome: "not_found" };

  if (upload.status === "submitted") {
    const lockSetting = await getAdminSetting("lockGeneratedFilesOnSubmit");
    if (lockSetting !== "false") {
      return { outcome: "locked" };
    }
  }

  const buffer = await fsp.readFile(absoluteFilePath(upload.filePath));
  await AppDataSource.getRepository(GeneratedFileEntity).delete({ uploadId });
  const validation = await runGeneration(upload, buffer);
  return { outcome: "ok", validation };
}

export async function findUploadById(fileId: string): Promise<Upload | null> {
  return AppDataSource.getRepository(Upload).findOne({ where: { id: fileId } });
}
