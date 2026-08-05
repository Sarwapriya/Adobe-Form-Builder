import { apiClient } from "./apiClient";

export type UploadStatus = "uploaded" | "generated" | "submitted" | "failed";

export interface UploadListItem {
  id: string;
  subsidiaryId: string;
  /** Text snapshot of the project code selected in the upload form's dropdown
   * — see projectCodesApi.ts. Null only for uploads made before this feature
   * existed. */
  projectCode: string | null;
  fileName: string;
  /** ISO date string — JSON has no native Date type, so this arrives (and
   * stays) as a string; format with `new Date(...)` where displayed. */
  uploadDate: string;
  userId: string | null;
  /** Assigned only once the upload is submitted — see submissionService.ts.
   * Null for in-progress and failed uploads, which never consume a version
   * number. */
  version: number | null;
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

// A type alias, not an interface — see AdminListParams in adminApi.ts for why
// that distinction matters for buildQuery()'s Record<string, ...> parameter.
export type ListUploadsParams = {
  page?: number;
  pageSize?: number;
  sortBy?: "uploadDate" | "subsidiaryId" | "status" | "version";
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

/** POST /api/v1/uploads — multipart upload; the backend synchronously runs
 * the Excel->Solution pipeline and returns both the created upload record and
 * its validation result (errors/warnings) in one response. `projectCode` must
 * be one currently open (see projectCodesApi.listOpenProjectCodes), *and*
 * match the workbook's own "Project Code" metadata row — the backend rejects
 * a closed/unknown code (409/404) or a workbook/dropdown mismatch (400)
 * regardless of what the client-side preview already checked.
 * `requiredOverrides` (questionId -> required) comes from the upload form's
 * mandatory-questions configure step — see UploadConfigurePanel.tsx. */
export function uploadWorkbook(
  subsidiaryId: string,
  projectCode: string,
  file: File,
  requiredOverrides?: Record<string, boolean>,
): Promise<CreateUploadResponse> {
  const formData = new FormData();
  formData.append("subsidiaryId", subsidiaryId);
  formData.append("projectCode", projectCode);
  formData.append("file", file);
  if (requiredOverrides) {
    formData.append("requiredOverrides", JSON.stringify(requiredOverrides));
  }
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
