import { apiClient } from "./apiClient";
import type { PagedResult, UploadListItem, UploadStatus } from "./uploadsApi";

export interface AdminUploadListItem extends UploadListItem {
  username: string | null;
}

export interface AdminListParams {
  subsidiaryId?: string;
  userId?: string;
  status?: UploadStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "uploadDate" | "subsidiaryId" | "status" | "version" | "fileName";
  sortDir?: "ASC" | "DESC";
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** GET /api/v1/admin/uploads — every upload across every user, with
 * search/filter/sort/pagination. Admin-only (the backend's requireAdmin
 * middleware enforces this regardless of what the frontend does). */
export function listUploadsForAdmin(params: AdminListParams = {}): Promise<PagedResult<AdminUploadListItem>> {
  return apiClient.get<PagedResult<AdminUploadListItem>>(`/api/v1/admin/uploads${buildQuery(params)}`);
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

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  role: "admin" | "standard";
}

export interface CreatedUser {
  id: string;
  username: string;
  email: string;
  role: "admin" | "standard";
}

export function createUser(input: CreateUserInput): Promise<CreatedUser> {
  return apiClient.post<CreatedUser>("/api/v1/admin/users", input);
}
