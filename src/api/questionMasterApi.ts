import { apiClient } from "./apiClient";

export interface QuestionMasterReadinessItem {
  formId: string;
  formName: string;
  subsidiaryId: string;
  /** True once this form has been published at least once. Purely status-based — a
   * form can be `published` here while a newer translation still sits unmerged in
   * `pendingContribution` below, so this alone doesn't mean the export reflects the
   * latest content. */
  published: boolean;
  /** True when this form's latest subsidiary-submitted translation/addition is still
   * awaiting admin review — it hasn't been merged into a new published version yet, so
   * the export doesn't include it until it's approved (or rejected). */
  pendingContribution: boolean;
  /** The actual readiness gate this page's Generate button/warnings should key off —
   * published, with no unmerged pending contribution in the way. */
  readyForExport: boolean;
  /** Locale codes actually present in this form's published definition (empty if
   * never published) — a locale missing here means either its translation was never
   * approved, or an admin never added that locale to the form at all (a subsidiary
   * can only translate into a locale that already exists on the form, never add a
   * new one themselves). */
  locales: string[];
}

export interface QuestionMasterVersion {
  id: string;
  projectCode: string;
  version: number;
  division: string;
  subsidiaryCount: number;
  totalRows: number;
  generatedByUserId: string;
  generatedAt: string;
}

/** GET /api/v1/admin/question-master/readiness?projectCode= — every active
 * subsidiary's Form under a project code, plus whether each has been published yet. */
export function getQuestionMasterReadiness(projectCode: string): Promise<QuestionMasterReadinessItem[]> {
  return apiClient.get<QuestionMasterReadinessItem[]>(
    `/api/v1/admin/question-master/readiness?projectCode=${encodeURIComponent(projectCode)}`,
  );
}

/** POST /api/v1/admin/question-master/generate — compiles every published form under
 * the project code into a new, versioned Question Master .xlsx (see backend
 * questionMasterService.generateQuestionMaster). `division` has no persisted home
 * elsewhere in the app — it's recorded on this one generated version only. */
export function generateQuestionMaster(projectCode: string, division: string): Promise<QuestionMasterVersion> {
  return apiClient.post<QuestionMasterVersion>("/api/v1/admin/question-master/generate", { projectCode, division });
}

/** GET /api/v1/admin/question-master/versions?projectCode= — every version generated
 * for a project code, newest first. */
export function listQuestionMasterVersions(projectCode: string): Promise<QuestionMasterVersion[]> {
  return apiClient.get<QuestionMasterVersion[]>(
    `/api/v1/admin/question-master/versions?projectCode=${encodeURIComponent(projectCode)}`,
  );
}

/** GET /api/v1/admin/question-master/versions/:id/download — the generated .xlsx for
 * one version. */
export function downloadQuestionMasterVersion(id: string): Promise<Blob> {
  return apiClient.getBlob(`/api/v1/admin/question-master/versions/${id}/download`);
}
