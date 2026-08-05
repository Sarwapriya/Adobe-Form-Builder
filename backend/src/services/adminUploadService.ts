import { AppDataSource } from "../config/data-source";
import { Upload, type UploadStatus } from "../entities/Upload";
import { User } from "../entities/User";
import { GeneratedFile as GeneratedFileEntity } from "../entities/GeneratedFile";
import { resolvePaging, type PagedResult } from "../utils/queryParsing";
import { sanitizeSubsidiaryId } from "../utils/sanitizeSubsidiaryId";
import { absoluteFilePath } from "./fileService";
import { buildZip, type ZipEntry } from "./zipService";
import { toListItem, type UploadListItem } from "./uploadService";
import type { SelectQueryBuilder } from "typeorm";

export interface AdminUploadListItem extends UploadListItem {
  username: string | null;
}

export interface AdminListFilters {
  subsidiaryId?: string;
  projectCode?: string;
  userId?: string;
  status?: UploadStatus;
  /** Free-text search across subsidiary id, project code, file name, and
   * uploader username. */
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

// The main admin dashboard only ever shows uploads the uploader has actually
// submitted — an "uploaded"/"generated" row is still a work-in-progress the
// uploader might abandon (see uploadCleanupService.ts, which purges those on
// their next login), so it has no business appearing in a cross-user view yet.
const SUBMITTED_STATUSES: readonly UploadStatus[] = ["submitted"];
// The "All history" page additionally surfaces "generated" (successfully
// generated but not yet submitted — still has real files an admin can preview/
// download) and "failed" uploads. Still excludes the fleeting "uploaded"
// state (generation runs synchronously right after upload, so a row only sits
// at "uploaded" for the instant between those two steps).
const HISTORY_STATUSES: readonly UploadStatus[] = ["generated", "submitted", "failed"];

/**
 * The filter set shared by every admin upload query below (the paginated
 * lists and the summary aggregate alike): subsidiary/projectCode/user exact
 * matches, free-text search, and the always-applied status allowlist. Kept as
 * one function so the summary tiles on AdminHistoryPage can never drift from
 * what the grid right below them actually shows.
 */
function applyListFilters(
  query: SelectQueryBuilder<Upload>,
  filters: AdminListFilters,
  allowedStatuses: readonly UploadStatus[],
): SelectQueryBuilder<Upload> {
  query.andWhere("upload.status IN (:...allowedStatuses)", { allowedStatuses: [...allowedStatuses] });

  if (filters.subsidiaryId) {
    query.andWhere("upload.subsidiaryId = :subsidiaryId", { subsidiaryId: filters.subsidiaryId });
  }
  if (filters.projectCode) {
    query.andWhere("upload.projectCode = :projectCode", { projectCode: filters.projectCode });
  }
  if (filters.userId) {
    query.andWhere("upload.userId = :userId", { userId: filters.userId });
  }
  if (filters.status && allowedStatuses.includes(filters.status)) {
    query.andWhere("upload.status = :status", { status: filters.status });
  }
  if (filters.search) {
    query.andWhere(
      "(upload.subsidiaryId LIKE :search OR upload.projectCode LIKE :search OR upload.fileName LIKE :search OR user.username LIKE :search)",
      { search: `%${filters.search}%` },
    );
  }
  return query;
}

/**
 * Shared query behind both listUploadsForAdmin and listUploadHistoryForAdmin:
 * every upload across every user, with search/filter/sort/pagination, always
 * restricted to `allowedStatuses`. Deliberately its own service rather than an
 * extension of uploadService.ts — the query shape here (a join to Users for
 * the display name, OR-across-columns text search, admin-only filters) is
 * materially different from uploadService.ts's user-scoped listUploadsForUser,
 * and growing one function to cover both would blur two distinct
 * responsibilities.
 */
async function listUploadsWithStatuses(
  filters: AdminListFilters,
  allowedStatuses: readonly UploadStatus[],
): Promise<PagedResult<AdminUploadListItem>> {
  const { page, pageSize, skip } = resolvePaging(filters);
  const sortColumn = SORTABLE_COLUMNS[filters.sortBy ?? "uploadDate"];
  const sortDir = filters.sortDir ?? "DESC";

  const baseQuery = applyListFilters(
    AppDataSource.getRepository(Upload)
      .createQueryBuilder("upload")
      .leftJoin(User, "user", "user.id = upload.userId")
      .where("upload.isDeleted = 0"),
    filters,
    allowedStatuses,
  );

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

/** Admin dashboard listing: submitted uploads only. */
export function listUploadsForAdmin(filters: AdminListFilters): Promise<PagedResult<AdminUploadListItem>> {
  return listUploadsWithStatuses(filters, SUBMITTED_STATUSES);
}

/** "All history" page listing: generated, submitted, and failed uploads
 * across every user — the full record of what was ever finished (one way or
 * the other) or is still in flight. */
export function listUploadHistoryForAdmin(filters: AdminListFilters): Promise<PagedResult<AdminUploadListItem>> {
  return listUploadsWithStatuses(filters, HISTORY_STATUSES);
}

export interface UploadHistorySummary {
  /** generated + submitted + failed, i.e. every upload counted below. */
  total: number;
  generated: number;
  submitted: number;
  failed: number;
}

/**
 * Status breakdown for AdminHistoryPage's summary tiles — respects
 * subsidiary/projectCode/search the same way listUploadHistoryForAdmin does,
 * but deliberately ignores `filters.status`: the point of the tiles is to
 * show all three counts at once, regardless of which single status the grid
 * below might currently be filtered to.
 */
export async function getUploadHistorySummary(filters: AdminListFilters): Promise<UploadHistorySummary> {
  const query = applyListFilters(
    AppDataSource.getRepository(Upload)
      .createQueryBuilder("upload")
      .leftJoin(User, "user", "user.id = upload.userId")
      .where("upload.isDeleted = 0"),
    { ...filters, status: undefined },
    HISTORY_STATUSES,
  );

  const rows: Array<{ status: UploadStatus; count: string }> = await query
    .select("upload.status", "status")
    .addSelect("COUNT(*)", "count")
    .groupBy("upload.status")
    .getRawMany();

  const counts = new Map(rows.map((row) => [row.status, Number(row.count)]));
  const generated = counts.get("generated") ?? 0;
  const submitted = counts.get("submitted") ?? 0;
  const failed = counts.get("failed") ?? 0;
  return { total: generated + submitted + failed, generated, submitted, failed };
}

/** Every submitted version of one subsidiary, newest first — the "Version
 * History" view. Restricted to "submitted" since only submitted uploads ever
 * have a version number at all. */
export async function listVersionsForSubsidiary(subsidiaryId: string): Promise<UploadListItem[]> {
  const uploads = await AppDataSource.getRepository(Upload).find({
    where: { subsidiaryId, isDeleted: false, status: "submitted" },
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
  // A "generated" (not-yet-submitted) upload has no version number yet — see
  // AdminHistoryPage, which allows downloading those too — so fall back to a
  // "draft" label rather than embedding a literal "null" in the file name.
  const versionLabel = upload.version != null ? `v${upload.version}` : "draft";
  const fileName = `${sanitizeSubsidiaryId(upload.subsidiaryId)}-${versionLabel}.zip`;

  return { outcome: "ok", buffer, fileName };
}

/** Zips a subsidiary's latest *submitted* version by default, or a specific
 * `version` if given — resolves the target upload row, then delegates to
 * buildUploadZip. Always restricted to "submitted": a version number only
 * ever exists on a submitted upload, and "latest by version" wouldn't mean
 * anything sensible against a not-yet-submitted (NULL version) one. */
export async function buildSubsidiaryZip(subsidiaryId: string, version?: number): Promise<ZipBuildResult> {
  const uploadRepo = AppDataSource.getRepository(Upload);
  const upload = version
    ? await uploadRepo.findOne({ where: { subsidiaryId, version, isDeleted: false, status: "submitted" } })
    : await uploadRepo.findOne({
        where: { subsidiaryId, isDeleted: false, status: "submitted" },
        order: { version: "DESC" },
      });

  if (!upload) {
    return { outcome: "not_found" };
  }
  return buildUploadZip(upload.id);
}
