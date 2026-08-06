import { apiClient } from "./apiClient";
import type { PagedResult, UploadListItem, UploadStatus } from "./uploadsApi";
import type { ProjectCode } from "./projectCodesApi";
import type { Subsidiary } from "./subsidiariesApi";

export type { ProjectCode } from "./projectCodesApi";
export type { Subsidiary } from "./subsidiariesApi";

export interface AdminUploadListItem extends UploadListItem {
  username: string | null;
}

// A type alias (not an interface) — object type aliases get an implicit
// string index signature when every property is string/number/undefined,
// which is what lets buildQuery()'s `Record<string, ...>` parameter accept
// this directly below. An `interface` here would not, and does not
// consistently surface as an error outside a full `tsc -b` build (see
// git history for this comment if that ever seems surprising again).
export type AdminListParams = {
  subsidiaryId?: string;
  projectCode?: string;
  userId?: string;
  status?: UploadStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "uploadDate" | "subsidiaryId" | "status" | "version" | "fileName";
  sortDir?: "ASC" | "DESC";
};

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** GET /api/v1/admin/uploads — submitted uploads across every user, with
 * search/filter/sort/pagination. Admin-only (the backend's requireAdmin
 * middleware enforces this regardless of what the frontend does). An upload
 * only appears here once its uploader has submitted it — see AdminHistoryPage
 * for the full record including in-progress and failed uploads. */
export function listUploadsForAdmin(params: AdminListParams = {}): Promise<PagedResult<AdminUploadListItem>> {
  return apiClient.get<PagedResult<AdminUploadListItem>>(`/api/v1/admin/uploads${buildQuery(params)}`);
}

/** GET /api/v1/admin/history — every generated, submitted, or failed upload
 * across every user (the "All history" page). A "generated" row here is
 * still not-yet-submitted, so it's only guaranteed to show up until its
 * owner's next login purges it if they never submit it (see
 * uploadCleanupService.ts). */
export function listUploadHistoryForAdmin(params: AdminListParams = {}): Promise<PagedResult<AdminUploadListItem>> {
  return apiClient.get<PagedResult<AdminUploadListItem>>(`/api/v1/admin/history${buildQuery(params)}`);
}

export interface UploadHistorySummary {
  total: number;
  generated: number;
  submitted: number;
  failed: number;
}

/** GET /api/v1/admin/history/summary — status breakdown for AdminHistoryPage's
 * summary tiles, respecting the same subsidiary/projectCode/search filters as
 * listUploadHistoryForAdmin (its own `status` field is ignored server-side,
 * since the point is to show all three counts regardless of which one the
 * grid is currently filtered to). */
export function getUploadHistorySummary(params: AdminListParams = {}): Promise<UploadHistorySummary> {
  return apiClient.get<UploadHistorySummary>(`/api/v1/admin/history/summary${buildQuery(params)}`);
}

export function listVersionsForSubsidiary(subsidiaryName: string): Promise<UploadListItem[]> {
  return apiClient.get<UploadListItem[]>(`/api/v1/admin/subsidiary/${encodeURIComponent(subsidiaryName)}`);
}

export function downloadUploadZip(uploadId: string): Promise<Blob> {
  return apiClient.getBlob(`/api/v1/admin/download/${uploadId}`);
}

export function downloadSubsidiaryZip(subsidiaryName: string, version?: number): Promise<Blob> {
  const query = version ? `?version=${version}` : "";
  return apiClient.getBlob(`/api/v1/admin/download/subsidiary/${encodeURIComponent(subsidiaryName)}${query}`);
}

/** GET /api/v1/admin/preview/:uploadId — a single self-contained HTML document
 * (CSS/JS inlined server-side, see previewService.ts) for the admin
 * dashboard's "Preview" button. Defaults to the Full Form variant. */
export function previewUpload(uploadId: string, variant: "ff" | "oc" = "ff"): Promise<Blob> {
  return apiClient.getBlob(`/api/v1/admin/preview/${uploadId}?variant=${variant}`);
}

export type AdminUserRole = "admin" | "standard" | "superadmin";

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  role: AdminUserRole;
  /** Scopes a standard user to one subsidiary — see backend User.subsidiaryId's
   * own doc comment. Optional; meaningless (but harmless) on an admin account. */
  subsidiaryId?: string;
}

export interface CreatedUser {
  id: string;
  username: string;
  email: string;
  role: AdminUserRole;
  subsidiaryId: string | null;
}

export function createUser(input: CreateUserInput): Promise<CreatedUser> {
  return apiClient.post<CreatedUser>("/api/v1/admin/users", input);
}

export interface AdminUserListItem {
  id: string;
  username: string;
  email: string;
  role: AdminUserRole;
  subsidiaryId: string | null;
  isActive: boolean;
  createdAt: string;
}

/** GET /api/v1/admin/users — every provisioned account, for the User
 * Management page's list. */
export function listUsers(): Promise<AdminUserListItem[]> {
  return apiClient.get<AdminUserListItem[]>("/api/v1/admin/users");
}

/** GET /api/v1/admin/project-codes — every project code, open and closed
 * alike (the admin management list). The upload form's own dropdown uses the
 * open-only projectCodesApi.listOpenProjectCodes instead. */
export function listAllProjectCodes(): Promise<ProjectCode[]> {
  return apiClient.get<ProjectCode[]>("/api/v1/admin/project-codes");
}

export function createProjectCode(code: string): Promise<ProjectCode> {
  return apiClient.post<ProjectCode>("/api/v1/admin/project-codes", { code });
}

/** Closing a project code blocks new uploads against it (enforced server-side
 * in uploadService.createUpload) — it does not affect uploads already made
 * under that code. */
export function setProjectCodeOpen(id: string, isOpen: boolean): Promise<ProjectCode> {
  return apiClient.patch<ProjectCode>(`/api/v1/admin/project-codes/${id}`, { isOpen });
}

/** GET /api/v1/admin/subsidiaries — every subsidiary (same list any
 * authenticated user can already fetch via subsidiariesApi.listSubsidiaries
 * — kept as its own admin route for symmetry with /project-codes). */
export function listAllSubsidiaries(): Promise<Subsidiary[]> {
  return apiClient.get<Subsidiary[]>("/api/v1/admin/subsidiaries");
}

export function createSubsidiary(name: string): Promise<Subsidiary> {
  return apiClient.post<Subsidiary>("/api/v1/admin/subsidiaries", { name });
}

export interface SubsidiaryProjectBlock {
  id: string;
  subsidiaryName: string;
  projectCode: string;
  createdAt: string;
}

/** GET /api/v1/admin/subsidiary-project-blocks — every (subsidiary, project
 * code) pair currently blocked from new uploads — e.g. "F2H26" closed for
 * "SGE" specifically while every other subsidiary can still upload it.
 * Independent of, and layered on top of, a project code's own global
 * open/closed state (see ProjectCodeManager / setProjectCodeOpen above). */
export function listSubsidiaryProjectBlocks(): Promise<SubsidiaryProjectBlock[]> {
  return apiClient.get<SubsidiaryProjectBlock[]>("/api/v1/admin/subsidiary-project-blocks");
}

export function createSubsidiaryProjectBlock(subsidiaryName: string, projectCode: string): Promise<SubsidiaryProjectBlock> {
  return apiClient.post<SubsidiaryProjectBlock>("/api/v1/admin/subsidiary-project-blocks", {
    subsidiaryName,
    projectCode,
  });
}

/** Unblocking (deleting the row) is the only thing that lets that subsidiary
 * upload that project code again (enforced server-side in
 * uploadService.createUpload). */
export function deleteSubsidiaryProjectBlock(id: string): Promise<void> {
  return apiClient.delete(`/api/v1/admin/subsidiary-project-blocks/${id}`);
}
