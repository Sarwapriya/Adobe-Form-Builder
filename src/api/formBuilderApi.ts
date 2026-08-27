import type { BuilderConfig, FormDefinition, Issue, ValidationResult } from "@formbuilder/shared";
import { apiClient, ApiError } from "./apiClient";
import type { ContributionSummary } from "./subsidiaryFormsApi";

export type FormStatus = "draft" | "published" | "unpublished";
export type FormVersionStatus = "draft" | "published" | "archived";
export type FormOrigin = "admin" | "adhoc";

/** The calling standard user's own latest-contribution progress for a form — drives
 * the 4-stage status bar on "My Forms" (Submitted → Reviewed by admin → Approved →
 * Published). See ContributionStatusBar.tsx for how the fields map to bar state. */
export interface ContributionProgress {
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
  publishedAt: string | null;
}

export interface FormListItem {
  id: string;
  name: string;
  subsidiaryId: string;
  projectCode: string | null;
  status: FormStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  publishedVersionNumber: number | null;
  /** "admin" (HR Form Initiator) or "adhoc" (a subsidiary user's own My Forms
   * submission) — the `origin` param on listForms() is what splits
   * HrFormInitiatorListPage from AdHocFormInitiatorListPage (the Form Initiator
   * submenu's two pages); also read by formBuilderStore/FormBuilderEditorPage to
   * hide VariantConfigPanel for ad-hoc forms. */
  origin: FormOrigin;
  /** True while an adhoc submission awaits admin review — drives the "Pending
   * review" badge and AdHocReviewPanel. Always false for "admin"-origin forms. */
  pendingReview: boolean;
  submittedForReviewAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  /** Only populated by the subsidiary-user "My Forms" listing (`/api/v1/forms`) —
   * null if they've never submitted one. Always undefined from the admin listing. */
  myContributionProgress?: ContributionProgress | null;
  /** Whether this form's own project code is currently locked — same
   * subsidiary-listing-only, undefined-from-admin convention as
   * myContributionProgress above (admins stay exempt from the lock). */
  projectCodeLocked?: boolean;
}

export interface FormVersionContent {
  id: string;
  definition: FormDefinition;
  config: BuilderConfig;
}

export interface FormDetail extends FormListItem {
  draft: FormVersionContent | null;
  published: (FormVersionContent & { versionNumber: number }) | null;
}

export interface FormVersionSummary {
  id: string;
  versionNumber: number | null;
  status: FormVersionStatus;
  createdAt: string;
  publishedAt: string | null;
  unpublishedAt: string | null;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// A type alias (not an interface) — object type aliases get an implicit
// string index signature when every property is string/number/undefined,
// which is what lets buildQuery()'s `Record<string, ...>` parameter accept
// this directly below. An `interface` here would not (see adminApi.ts's own
// AdminListParams for the same convention).
export type ListFormsParams = {
  status?: FormStatus;
  subsidiaryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  pendingReview?: boolean;
  origin?: FormOrigin;
};

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function listForms(params: ListFormsParams = {}): Promise<PagedResult<FormListItem>> {
  return apiClient.get<PagedResult<FormListItem>>(`/api/v1/admin/forms${buildQuery(params)}`);
}

export interface CreateFormInput {
  name: string;
  subsidiaryId: string;
  projectCode?: string;
  /** "Copy from an existing form" — the id of a form whose current content
   * (draft or published, whichever is more current) is cloned as this new
   * form's starting definition/config. Any existing form is a valid source. */
  copyFromFormId?: string;
}

export function createForm(input: CreateFormInput): Promise<FormListItem> {
  return apiClient.post<FormListItem>("/api/v1/admin/forms", input);
}

export interface QuestionSeed {
  id: string;
  order: number;
  headingByLocale: Record<string, string>;
  subheadingByLocale?: Record<string, string>;
  controlType: "radio" | "checkbox" | "text" | "shortText" | "dropdown";
  required: boolean;
  answers?: Array<{ id: string; order: number; textByLocale: Record<string, string> }>;
}

export function createFormWithQuestions(
  name: string,
  subsidiaryId: string,
  questions: QuestionSeed[],
  projectCode?: string,
): Promise<FormListItem> {
  return apiClient.post<FormListItem>("/api/v1/admin/forms/with-questions", { name, subsidiaryId, questions, projectCode });
}

export function getFormDetail(formId: string): Promise<FormDetail> {
  return apiClient.get<FormDetail>(`/api/v1/admin/forms/${formId}`);
}

export function updateDraft(formId: string, definition: FormDefinition, config: BuilderConfig): Promise<void> {
  return apiClient.patch<void>(`/api/v1/admin/forms/${formId}/draft`, { definition, config });
}

export interface PublishResponse {
  validation: ValidationResult;
}

export class FormInvalidError extends Error {
  readonly validation: ValidationResult;
  constructor(validation: ValidationResult) {
    super("Form is not valid");
    this.name = "FormInvalidError";
    this.validation = validation;
  }
}

/** Throws FormInvalidError (carrying the blocking Issue[]) on a 422 — every other
 * failure surfaces as the usual ApiError from apiClient. */
export async function publishForm(formId: string): Promise<PublishResponse> {
  try {
    return await apiClient.post<PublishResponse>(`/api/v1/admin/forms/${formId}/publish`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 422) {
      const validation = (err.body as { validation?: ValidationResult } | undefined)?.validation;
      if (validation) throw new FormInvalidError(validation);
    }
    throw err;
  }
}

export function unpublishForm(formId: string): Promise<void> {
  return apiClient.post<void>(`/api/v1/admin/forms/${formId}/unpublish`);
}

export function deleteForm(formId: string): Promise<void> {
  return apiClient.delete<void>(`/api/v1/admin/forms/${formId}`);
}

export function listFormVersions(formId: string): Promise<FormVersionSummary[]> {
  return apiClient.get<FormVersionSummary[]>(`/api/v1/admin/forms/${formId}/versions`);
}

export function previewForm(formId: string, variant: "ff" | "oc" = "ff"): Promise<Blob> {
  return apiClient.getBlob(`/api/v1/admin/forms/${formId}/preview?variant=${variant}`);
}

export function downloadFormZip(formId: string): Promise<Blob> {
  return apiClient.getBlob(`/api/v1/admin/forms/${formId}/download`);
}

// Subsidiary-user contribution review — see subsidiaryFormsApi.ts's own
// ContributionSummary for the submitting side; re-exported here so both sides share
// one shape rather than two independently-drifting copies.
export type { ContributionSummary, ContributionStatus } from "./subsidiaryFormsApi";

export function listFormContributions(formId: string): Promise<ContributionSummary[]> {
  return apiClient.get(`/api/v1/admin/forms/${formId}/contributions`);
}

export function approveContribution(formId: string, contributionId: string, reviewNote?: string): Promise<void> {
  return apiClient.post<void>(`/api/v1/admin/forms/${formId}/contributions/${contributionId}/approve`, { reviewNote });
}

export function rejectContribution(formId: string, contributionId: string, reviewNote?: string): Promise<void> {
  return apiClient.post<void>(`/api/v1/admin/forms/${formId}/contributions/${contributionId}/reject`, { reviewNote });
}

/** Admin review queue actions for a subsidiary user's own "ad-hoc" submission
 * (see AdHocReviewPanel.tsx) — distinct from the contribution approve/reject
 * above. Approve is the one point a project code gets attached (never asked of
 * the subsidiary), and reuses the same 422/FormInvalidError shape publishForm
 * already throws, since it calls the same publish path server-side. */
export async function approveAdHocForm(formId: string, projectCode: string): Promise<void> {
  try {
    await apiClient.post<void>(`/api/v1/admin/forms/${formId}/adhoc/approve`, { projectCode });
  } catch (err) {
    if (err instanceof ApiError && err.status === 422) {
      const validation = (err.body as { validation?: ValidationResult } | undefined)?.validation;
      if (validation) throw new FormInvalidError(validation);
    }
    throw err;
  }
}

export function rejectAdHocForm(formId: string, reviewNote?: string): Promise<void> {
  return apiClient.post<void>(`/api/v1/admin/forms/${formId}/adhoc/reject`, { reviewNote });
}

export type { Issue, ValidationResult };
