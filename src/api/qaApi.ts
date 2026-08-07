import { apiClient } from "./apiClient";

export type QaRunVariant = "ff" | "oc";
export type QaRunStatus = "pending" | "running" | "passed" | "failed" | "error";
export type QaTestCaseStatus = "passed" | "failed";

export interface QaRun {
  id: string;
  uploadId: string;
  variant: QaRunVariant;
  status: QaRunStatus;
  triggeredByUserId: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  errorMessage: string | null;
  reportPath: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface QaTestCaseResult {
  id: string;
  qaRunId: string;
  category: string;
  name: string;
  status: QaTestCaseStatus;
  fieldId: string | null;
  message: string | null;
  createdAt: string;
}

export interface QaRunDetail {
  run: QaRun;
  results: QaTestCaseResult[];
}

/** POST /api/v1/admin/qa-runs — kicks off a real Playwright QA run against
 * one upload's generated variant (see backend qaRunService.createQaRun).
 * Returns immediately with a "pending" run; the browser automation happens
 * in the background — poll getQaRun/getQaRunDetail until status leaves
 * "pending"/"running". */
export function createQaRun(uploadId: string, variant: QaRunVariant): Promise<QaRun> {
  return apiClient.post<QaRun>("/api/v1/admin/qa-runs", { uploadId, variant });
}

/** GET /api/v1/admin/qa-runs?uploadId= — every QA run ever triggered for
 * one upload, newest first. */
export function listQaRuns(uploadId: string): Promise<QaRun[]> {
  return apiClient.get<QaRun[]>(`/api/v1/admin/qa-runs?uploadId=${encodeURIComponent(uploadId)}`);
}

/** GET /api/v1/admin/qa-runs/:id — one run's status/counts plus every
 * individual test case result (name/status/fieldId/message) — "which fields
 * should be fixed" reads straight off `results`. */
export function getQaRunDetail(id: string): Promise<QaRunDetail> {
  return apiClient.get<QaRunDetail>(`/api/v1/admin/qa-runs/${id}`);
}

/** GET /api/v1/admin/qa-runs/:id/download — the same run as a standalone
 * downloadable HTML report. */
export function downloadQaReport(id: string): Promise<Blob> {
  return apiClient.getBlob(`/api/v1/admin/qa-runs/${id}/download`);
}
