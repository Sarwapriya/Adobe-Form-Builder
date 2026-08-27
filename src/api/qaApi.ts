import { apiClient } from "./apiClient";

export type QaRunVariant = "ff" | "oc";
export type QaRunStatus = "pending" | "running" | "passed" | "failed" | "error";
export type QaTestCaseStatus = "passed" | "failed";

/** Identifies what a QA run targets — an upload's submitted output (existing
 * flow), a pending Translate & Extend contribution merged onto its form's
 * draft, or an ad-hoc form's own draft while it awaits admin review. Exactly
 * one shape maps to exactly one of createQaRun's/listQaRuns' request shapes. */
export type QaRunSubject =
  | { kind: "upload"; uploadId: string }
  | { kind: "contribution"; contributionId: string; formId: string }
  | { kind: "adhoc"; formId: string };

export interface QaRun {
  id: string;
  uploadId: string | null;
  formId: string | null;
  contributionId: string | null;
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
 * `subject`'s generated variant (see backend qaRunService.createQaRun/
 * createContributionQaRun/createAdHocReviewQaRun). Returns immediately with a
 * "pending" run; the browser automation happens in the background — poll
 * getQaRun/getQaRunDetail until status leaves "pending"/"running". */
export function createQaRun(subject: QaRunSubject, variant: QaRunVariant): Promise<QaRun> {
  const body =
    subject.kind === "upload"
      ? { uploadId: subject.uploadId, variant }
      : subject.kind === "contribution"
        ? { contributionId: subject.contributionId, variant }
        : { formId: subject.formId, variant };
  return apiClient.post<QaRun>("/api/v1/admin/qa-runs", body);
}

/** GET /api/v1/admin/qa-runs?uploadId=|formId= — every QA run ever triggered
 * for one upload, or one Configuration form (covers both contribution-based
 * and ad-hoc pending-review runs for that form), newest first. */
export function listQaRuns(subject: QaRunSubject): Promise<QaRun[]> {
  const param = subject.kind === "upload" ? `uploadId=${encodeURIComponent(subject.uploadId)}` : `formId=${encodeURIComponent(subject.formId)}`;
  return apiClient.get<QaRun[]>(`/api/v1/admin/qa-runs?${param}`);
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
