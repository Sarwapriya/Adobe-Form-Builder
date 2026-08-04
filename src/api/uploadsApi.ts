import { apiClient } from "./apiClient";

export type UploadStatus = "uploaded" | "generated" | "submitted" | "failed";

export interface UploadListItem {
  id: string;
  subsidiaryId: string;
  fileName: string;
  /** ISO date string — JSON has no native Date type, so this arrives (and
   * stays) as a string; format with `new Date(...)` where displayed. */
  uploadDate: string;
  userId: string | null;
  version: number;
  status: UploadStatus;
  submittedAt: string | null;
  submissionCount: number;
}

export type GeneratedFileType = "html" | "js" | "css" | "data-js";

export interface GeneratedFileSummary {
  id: string;
  fileName: string;
  filePath: string;
  fileType: GeneratedFileType;
}

export interface UploadDetail extends UploadListItem {
  generatedFiles: GeneratedFileSummary[];
}

export interface ValidationIssue {
  severity: "error" | "warning";
  sheet: string;
  row?: number;
  column?: string;
  message: string;
}

export interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface CreateUploadResponse {
  upload: UploadListItem;
  validation: ValidationResult;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListUploadsParams {
  page?: number;
  pageSize?: number;
  sortBy?: "uploadDate" | "subsidiaryId" | "status" | "version";
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

/** POST /api/v1/uploads — multipart upload; the backend synchronously runs
 * the Excel->Solution pipeline and returns both the created upload record and
 * its validation result (errors/warnings) in one response. */
export function uploadWorkbook(subsidiaryId: string, file: File): Promise<CreateUploadResponse> {
  const formData = new FormData();
  formData.append("subsidiaryId", subsidiaryId);
  formData.append("file", file);
  return apiClient.postForm<CreateUploadResponse>("/api/v1/uploads", formData);
}

/** GET /api/v1/uploads — always the caller's own history, regardless of role. */
export function listMyUploads(params: ListUploadsParams = {}): Promise<PagedResult<UploadListItem>> {
  return apiClient.get<PagedResult<UploadListItem>>(`/api/v1/uploads${buildQuery(params)}`);
}

export function getUploadDetail(id: string): Promise<UploadDetail> {
  return apiClient.get<UploadDetail>(`/api/v1/uploads/${id}`);
}

export function deleteUpload(id: string): Promise<void> {
  return apiClient.delete<void>(`/api/v1/uploads/${id}`);
}

export function regenerateUpload(uploadId: string): Promise<{ validation: ValidationResult }> {
  return apiClient.post<{ validation: ValidationResult }>(`/api/v1/generate/${uploadId}`);
}

export function submitUpload(uploadId: string): Promise<{ upload: UploadListItem }> {
  return apiClient.post<{ upload: UploadListItem }>(`/api/v1/submit/${uploadId}`);
}
