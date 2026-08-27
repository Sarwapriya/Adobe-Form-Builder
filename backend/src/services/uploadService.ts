import fsp from "node:fs/promises";
import crypto from "node:crypto";
import type { FormVariant, ValidationResult } from "@formbuilder/shared";
import { resolvePaging, type PagedResult } from "../utils/queryParsing";
import { ProjectCodeMismatchError, SubsidiaryMismatchError, UnsupportedFileTypeError } from "../utils/errors";
import { AppDataSource } from "../config/data-source";
import { Upload, type UploadStatus } from "../entities/Upload";
import { GeneratedFile as GeneratedFileEntity, type GeneratedFileType } from "../entities/GeneratedFile";
import { absoluteFilePath, hasExcelFileSignature, saveGeneratedFiles, saveSourceFile, uploadGeneratedDir } from "./fileService";
import { classifyFileType, generateFromWorkbook, type GenerationResult } from "./generationService";
import { sendUploadNotification } from "./emailService";
import { getAdminSetting } from "./adminSettingsService";
import { assertProjectCodeOpen, assertProjectCodeUnlockedForUpload } from "./projectCodeService";
import { assertSubsidiaryActive } from "./subsidiaryService";
import { assertNotBlocked } from "./subsidiaryProjectBlockService";

export interface UploadListItem {
  id: string;
  subsidiaryId: string;
  /** Text snapshot of the ProjectCodes.code selected at upload time — see
   * projectCodeService.ts. Null only for rows created before this feature
   * existed. */
  projectCode: string | null;
  fileName: string;
  uploadDate: Date;
  userId: string | null;
  version: number | null;
  status: UploadStatus;
  submittedAt: Date | null;
  submissionCount: number;
  /** Which generated-output variant(s) the uploader chose — see
   * Upload.variants's own doc comment. Always a real array here (never
   * null) — a row with no stored preference defaults to both. */
  variants: FormVariant[];
}

const DEFAULT_VARIANTS: FormVariant[] = ["ff", "oc"];

/** Parses Upload.variants' JSON-encoded FormVariant[] back out, falling back
 * to both variants for a null/malformed value (covers every row created
 * before this feature existed, and is a safe default regardless). */
function parseStoredVariants(raw: string | null): FormVariant[] {
  if (!raw) return DEFAULT_VARIANTS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((v) => v === "ff" || v === "oc") && parsed.length > 0) {
      return parsed as FormVariant[];
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_VARIANTS;
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
    projectCode: upload.projectCode,
    fileName: upload.fileName,
    uploadDate: upload.uploadDate,
    userId: upload.userId,
    version: upload.version,
    status: upload.status,
    submittedAt: upload.submittedAt,
    submissionCount: upload.submissionCount,
    variants: parseStoredVariants(upload.variants),
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
 * Cross-checks the project code selected in the upload form against the
 * workbook's own "Project Code" metadata row (parser.ts extracts it the same
 * way it extracts Subsidiary/Language_Country). Case/whitespace-insensitive,
 * since these workbooks drift in spelling the same way subsidiary names do.
 * Thrown before anything is persisted — a wrong dropdown pick or a workbook
 * missing the row entirely rejects the whole upload outright, rather than
 * leaving a "failed" record behind for what's usually just a mistake.
 */
function assertProjectCodeMatchesWorkbook(selected: string, fromWorkbook: string): void {
  const normalize = (s: string) => s.trim().toLowerCase();
  if (normalize(fromWorkbook) === normalize(selected)) return;

  throw new ProjectCodeMismatchError(
    fromWorkbook.trim()
      ? `The workbook's Project Code ("${fromWorkbook}") does not match the selected project code ("${selected}")`
      : `The workbook has no "Project Code" row matching the selected project code ("${selected}")`,
  );
}

/**
 * Cross-checks the Subsidiary field submitted with the upload against the
 * workbook's own "Subsidiary" metadata row — the same check for every
 * uploader, admin or subsidiary-scoped alike (a subsidiary-scoped user's
 * field value comes from their own account, per upload.router.ts, but the
 * workbook itself could still be the wrong one for that subsidiary).
 */
function assertSubsidiaryMatchesWorkbook(selected: string, fromWorkbook: string): void {
  const normalize = (s: string) => s.trim().toLowerCase();
  if (normalize(fromWorkbook) === normalize(selected)) return;

  throw new SubsidiaryMismatchError(
    fromWorkbook.trim()
      ? `The workbook's Subsidiary ("${fromWorkbook}") does not match the selected subsidiary ("${selected}")`
      : `The workbook has no "Subsidiary" row matching the selected subsidiary ("${selected}")`,
  );
}

/**
 * Persists an already-computed generation outcome for an upload: either the
 * generated files are saved and status becomes "generated", or (blocking
 * validation errors, or an unexpected failure) status becomes "failed".
 * Either outcome leaves the Upload row as a real, visible, auditable record —
 * never silently rolled back. Takes a pre-computed GenerationResult rather
 * than re-parsing from a buffer, so createUpload can cross-check the
 * workbook's project code (generateFromWorkbook's projectCodeFromWorkbook)
 * before this ever runs, without parsing the workbook twice.
 */
async function persistGenerationOutcome(upload: Upload, generation: GenerationResult): Promise<ValidationResult> {
  const uploadRepo = AppDataSource.getRepository(Upload);
  try {
    if (generation.validation.errors.length > 0 || hasFormulaLikeWarning(generation.validation)) {
      await uploadRepo.update(upload.id, { status: "failed" });
      return generation.validation;
    }

    const saved = await saveGeneratedFiles(upload.subsidiaryId, upload.id, generation.files);
    const generatedFileRepo = AppDataSource.getRepository(GeneratedFileEntity);
    const rows = saved.map((f) =>
      generatedFileRepo.create({
        uploadId: upload.id,
        fileName: f.fileName,
        filePath: f.relativePath,
        fileType: classifyFileType(f.fileName, generation.fileNames),
      }),
    );
    await generatedFileRepo.save(rows);

    await uploadRepo.update(upload.id, {
      status: "generated",
      generatedPath: uploadGeneratedDir(upload.subsidiaryId, upload.id),
    });

    return generation.validation;
  } catch (err) {
    await uploadRepo.update(upload.id, { status: "failed" });
    throw err;
  }
}

export interface CreateUploadInput {
  subsidiaryId: string;
  projectCode: string;
  file: Express.Multer.File;
  userId: string;
  uploadedByUsername: string;
  /** questionId -> required, from the upload form's mandatory-questions
   * configure step (a client-side preview parse — see generateFromWorkbook's
   * own doc comment). Omitted/empty means every question stays required,
   * which is the Excel-parsed default. */
  requiredOverrides?: Record<string, boolean>;
  /** Which generated-output variant(s) to produce — from the upload form's
   * own variant picker. Omitted means both (see generateFromWorkbook's own
   * default), same as before this feature existed. */
  variants?: FormVariant[];
  /** Whether the caller is an admin/superadmin — see upload.router.ts's
   * isAdminRole(req.auth!.role) computation. Admins stay exempt from
   * assertProjectCodeUnlockedForUpload below (see ProjectCode.isLocked's own doc
   * comment); every other gate here applies to admins the same as anyone else. */
  isAdmin: boolean;
}

export interface CreateUploadResult {
  upload: UploadListItem;
  validation: ValidationResult;
}

/**
 * Creates a new upload: persists the Upload row immediately with status
 * "uploaded" and no version — version numbers are only ever assigned at
 * submission time (see submissionService.ts), scoped to *submitted* uploads
 * for the subsidiary, so an upload that never gets submitted (including a
 * failed one) never consumes one. Storage is keyed by this upload's own id
 * (generated client-side so the source file can be written to its final path
 * before the row exists), not a version number, so there's no locked
 * transaction to reserve here the way there used to be.
 *
 * The workbook is parsed once, up front, before any of that persistence —
 * both to apply `requiredOverrides` and so its own "Project Code"/"Subsidiary"
 * rows can be cross-checked against the caller's `projectCode`/`subsidiaryId`
 * before anything is saved (assertProjectCodeMatchesWorkbook /
 * assertSubsidiaryMatchesWorkbook reject the whole request outright on a
 * mismatch, same as an unsupported file type would). `subsidiaryId` itself is
 * never trusted blindly for a subsidiary-scoped user — see
 * upload.router.ts, which overrides it with that user's own assignment
 * before this function ever sees it.
 */
export async function createUpload(input: CreateUploadInput): Promise<CreateUploadResult> {
  const { subsidiaryId, projectCode, file, userId, uploadedByUsername, requiredOverrides, variants, isAdmin } = input;

  // Checked before anything else — no point validating the file signature or
  // parsing it if the project code is closed globally, the subsidiary is
  // disabled outright, or this specific pair is blocked (see
  // subsidiaryService.ts / subsidiaryProjectBlockService.ts). Independent
  // gates — any one blocks the upload, regardless of the others.
  await assertProjectCodeOpen(projectCode);
  await assertSubsidiaryActive(subsidiaryId);
  await assertNotBlocked(subsidiaryId, projectCode);
  // Locking is a separate, more permanent freeze admins stay exempt from — see
  // ProjectCode.isLocked's own doc comment.
  if (!isAdmin) {
    await assertProjectCodeUnlockedForUpload(projectCode);
  }

  // Checked here (not just in fileService's multer fileFilter, which only
  // sees the extension/MIME before the full buffer exists) so a renamed
  // non-Excel file is rejected before anything is written to disk.
  if (!hasExcelFileSignature(file.buffer)) {
    throw new UnsupportedFileTypeError("File content does not match a valid .xlsx/.xls signature");
  }

  const generation = generateFromWorkbook(toArrayBuffer(file.buffer), file.originalname, requiredOverrides, variants);
  assertProjectCodeMatchesWorkbook(projectCode, generation.projectCodeFromWorkbook);
  assertSubsidiaryMatchesWorkbook(subsidiaryId, generation.subsidiaryFromWorkbook);

  const uploadId = crypto.randomUUID();
  const sourcePath = await saveSourceFile(subsidiaryId, uploadId, file.originalname, file.buffer);

  const uploadRepo = AppDataSource.getRepository(Upload);
  const created = uploadRepo.create({
    id: uploadId,
    subsidiaryId,
    projectCode,
    fileName: file.originalname,
    filePath: sourcePath,
    userId,
    version: null,
    status: "uploaded",
    questionOverrides: requiredOverrides ? JSON.stringify(requiredOverrides) : null,
    variants: variants ? JSON.stringify(variants) : null,
  });
  const upload = await uploadRepo.save(created);

  await sendUploadNotification({
    subsidiaryId,
    fileName: upload.fileName,
    uploadDate: upload.uploadDate,
    uploadedBy: uploadedByUsername,
  });

  const validation = await persistGenerationOutcome(upload, generation);
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
 * ownership-checked via findOwnedUpload. A standard user is blocked once the
 * upload has been submitted (this rule doesn't depend on the
 * lockGeneratedFilesOnSubmit toggle — a submitted record should never
 * disappear from a standard user's own history just because they deleted it).
 * Admins/superadmins are exempt from that lock entirely — the All History
 * page needs to be able to remove any row, submitted or not. */
export async function softDeleteUpload(uploadId: string, userId: string, isAdmin: boolean): Promise<SoftDeleteResult> {
  const upload = await findOwnedUpload(uploadId, userId, isAdmin);
  if (!upload) return "not_found";
  if (upload.status === "submitted" && !isAdmin) return "locked";

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
 *
 * Re-applies the same requiredOverrides *and* variants the uploader
 * configured at upload time (stored on the row as questionOverrides/
 * variants) — otherwise every question would silently reset back to
 * required, and both variants would silently regenerate even if the
 * uploader only ever wanted one, on a regenerate. The project code
 * cross-check isn't repeated here: subsidiaryId/projectCode don't change on
 * regeneration, so it was already validated once at upload time.
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
  const requiredOverrides = upload.questionOverrides
    ? (JSON.parse(upload.questionOverrides) as Record<string, boolean>)
    : undefined;
  const generation = generateFromWorkbook(
    toArrayBuffer(buffer),
    upload.fileName,
    requiredOverrides,
    parseStoredVariants(upload.variants),
  );
  await AppDataSource.getRepository(GeneratedFileEntity).delete({ uploadId });
  const validation = await persistGenerationOutcome(upload, generation);
  return { outcome: "ok", validation };
}

export async function findUploadById(fileId: string): Promise<Upload | null> {
  return AppDataSource.getRepository(Upload).findOne({ where: { id: fileId } });
}
