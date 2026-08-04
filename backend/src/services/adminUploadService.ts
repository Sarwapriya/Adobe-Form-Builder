import { AppDataSource } from "../config/data-source";
import { Upload, type UploadStatus } from "../entities/Upload";
import { User } from "../entities/User";
import { GeneratedFile as GeneratedFileEntity } from "../entities/GeneratedFile";
import { resolvePaging, type PagedResult } from "../utils/queryParsing";
import { sanitizeSubsidiaryId } from "../utils/sanitizeSubsidiaryId";
import { absoluteFilePath } from "./fileService";
import { buildZip, type ZipEntry } from "./zipService";
import { toListItem, type UploadListItem } from "./uploadService";

export interface AdminUploadListItem extends UploadListItem {
  username: string | null;
}

export interface AdminListFilters {
  subsidiaryId?: string;
  userId?: string;
  status?: UploadStatus;
  /** Free-text search across subsidiary id, file name, and uploader username. */
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "uploadDate" | "subsidiaryId" | "status" | "version" | "fileName";
  sortDir?: "ASC" | "DESC";
}

const SORTABLE_COLUMNS: Record<NonNullable<AdminListFilters["sortBy"]>, string> = {
  uploadDate: "upload.uploadDate",
  subsidiaryId: "upload.subsidiaryId",
  status: "upload.status",
  version: "upload.version",
  fileName: "upload.fileName",
};

/**
 * Admin-only listing: every upload across every user, with search/filter/sort/
 * pagination. Deliberately its own service rather than an extension of
 * uploadService.ts — the query shape here (a join to Users for the display
 * name, OR-across-columns text search, admin-only filters) is materially
 * different from uploadService.ts's user-scoped listUploadsForUser, and
 * growing one function to cover both would blur two distinct responsibilities.
 */
export async function listUploadsForAdmin(filters: AdminListFilters): Promise<PagedResult<AdminUploadListItem>> {
  const { page, pageSize, skip } = resolvePaging(filters);
  const sortColumn = SORTABLE_COLUMNS[filters.sortBy ?? "uploadDate"];
  const sortDir = filters.sortDir ?? "DESC";

  const baseQuery = AppDataSource.getRepository(Upload)
    .createQueryBuilder("upload")
    .leftJoin(User, "user", "user.id = upload.userId")
    .where("upload.isDeleted = 0");

  if (filters.subsidiaryId) {
    baseQuery.andWhere("upload.subsidiaryId = :subsidiaryId", { subsidiaryId: filters.subsidiaryId });
  }
  if (filters.userId) {
    baseQuery.andWhere("upload.userId = :userId", { userId: filters.userId });
  }
  if (filters.status) {
    baseQuery.andWhere("upload.status = :status", { status: filters.status });
  }
  if (filters.search) {
    baseQuery.andWhere(
      "(upload.subsidiaryId LIKE :search OR upload.fileName LIKE :search OR user.username LIKE :search)",
      { search: `%${filters.search}%` },
    );
  }

  const total = await baseQuery.getCount();

  const { entities, raw } = await baseQuery
    .clone()
    .addSelect("user.username", "username")
    .orderBy(sortColumn, sortDir)
    .skip(skip)
    .take(pageSize)
    .getRawAndEntities();

  const items: AdminUploadListItem[] = entities.map((upload, index) => ({
    ...toListItem(upload),
    username: (raw[index]?.username as string | undefined) ?? null,
  }));

  return { items, total, page, pageSize };
}

/** All versions of one subsidiary, newest first — the "Version History" view. */
export async function listVersionsForSubsidiary(subsidiaryId: string): Promise<UploadListItem[]> {
  const uploads = await AppDataSource.getRepository(Upload).find({
    where: { subsidiaryId, isDeleted: false },
    order: { version: "DESC" },
  });
  return uploads.map(toListItem);
}

export type ZipOutcome = "not_found" | "no_files" | "ok";

export interface ZipBuildResult {
  outcome: ZipOutcome;
  buffer?: Uint8Array;
  fileName?: string;
}

/** Zips one upload's generated files (its whole generated/ directory contents,
 * as recorded in GeneratedFiles) into a single downloadable buffer. */
export async function buildUploadZip(uploadId: string): Promise<ZipBuildResult> {
  const upload = await AppDataSource.getRepository(Upload).findOne({ where: { id: uploadId, isDeleted: false } });
  if (!upload) {
    return { outcome: "not_found" };
  }

  const files = await AppDataSource.getRepository(GeneratedFileEntity).find({ where: { uploadId } });
  if (files.length === 0) {
    return { outcome: "no_files" };
  }

  const entries: ZipEntry[] = files.map((f) => ({
    zipPath: f.fileName,
    absoluteFilePath: absoluteFilePath(f.filePath),
  }));
  const buffer = await buildZip(entries);
  const fileName = `${sanitizeSubsidiaryId(upload.subsidiaryId)}-v${upload.version}.zip`;

  return { outcome: "ok", buffer, fileName };
}

/** Zips a subsidiary's latest version by default, or a specific `version` if
 * given — resolves the target upload row, then delegates to buildUploadZip. */
export async function buildSubsidiaryZip(subsidiaryId: string, version?: number): Promise<ZipBuildResult> {
  const uploadRepo = AppDataSource.getRepository(Upload);
  const upload = version
    ? await uploadRepo.findOne({ where: { subsidiaryId, version, isDeleted: false } })
    : await uploadRepo.findOne({ where: { subsidiaryId, isDeleted: false }, order: { version: "DESC" } });

  if (!upload) {
    return { outcome: "not_found" };
  }
  return buildUploadZip(upload.id);
}
