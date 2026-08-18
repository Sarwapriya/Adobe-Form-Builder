import type { BuilderConfig, ContributionContent, FormDefinition, ValidationResult } from "@formbuilder/shared";
import { apiClient, ApiError } from "./apiClient";
import type { FormDetail, FormListItem } from "./formBuilderApi";

/**
 * Standard-user-facing counterpart to formBuilderApi.ts — `/api/v1/forms`
 * (subsidiary-scoped, read-mostly) rather than `/api/v1/admin/forms`. Reuses
 * FormListItem/FormDetail's shapes since the response bodies are identical; only
 * which forms are reachable differs (see backend's formAccessService.ts).
 */

export function listMyForms(): Promise<FormListItem[]> {
  return apiClient.get<FormListItem[]>("/api/v1/forms");
}

export function getMyFormDetail(formId: string): Promise<FormDetail> {
  return apiClient.get<FormDetail>(`/api/v1/forms/${formId}`);
}

/**
 * A subsidiary user's own self-service "ad-hoc" forms — a brand-new form they
 * build themselves (My Forms → New Ad-hoc Form), distinct from the read-only
 * listMyForms/getMyFormDetail above (which only ever cover an existing
 * *published* admin-authored form). The subsidiary is never sent in the request
 * body — the server always forces it to the caller's own account.
 */
export function createAdHocForm(name: string): Promise<FormListItem> {
  return apiClient.post<FormListItem>("/api/v1/forms/adhoc", { name });
}

export function listMyAdHocForms(): Promise<FormListItem[]> {
  return apiClient.get<FormListItem[]>("/api/v1/forms/adhoc");
}

export function getMyAdHocFormDetail(formId: string): Promise<FormDetail> {
  return apiClient.get<FormDetail>(`/api/v1/forms/adhoc/${formId}`);
}

export function updateMyAdHocFormDraft(formId: string, definition: FormDefinition, config: BuilderConfig): Promise<void> {
  return apiClient.patch<void>(`/api/v1/forms/adhoc/${formId}/draft`, { definition, config });
}

export function submitAdHocFormForReview(formId: string): Promise<void> {
  return apiClient.post<void>(`/api/v1/forms/adhoc/${formId}/submit-for-review`);
}

/** Allowed while still draft or pending review; the server rejects this with a
 * 409 once an admin has published the form (see deleteAdHocForm in
 * formBuilderService.ts). */
export function deleteAdHocForm(formId: string): Promise<void> {
  return apiClient.delete<void>(`/api/v1/forms/adhoc/${formId}`);
}

export type ContributionStatus = "pending" | "approved" | "rejected";

export const CONTRIBUTION_STATUS_LABEL: Record<ContributionStatus, string> = {
  pending: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
};

export interface ContributionSummary {
  id: string;
  formId: string;
  submittedByUserId: string;
  status: ContributionStatus;
  content: ContributionContent;
  note: string | null;
  reviewNote: string | null;
  reviewedByUserId: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  /** Set once a publish actually carries this (already-approved) contribution's
   * content live — see backend FormContribution.ts. Null for pending/rejected, and
   * for an approved contribution still sitting in an unpublished draft. */
  publishedAt: string | null;
}

export class ContributionInvalidError extends Error {
  readonly validation: ValidationResult;
  constructor(validation: ValidationResult) {
    super("Contribution is not valid");
    this.name = "ContributionInvalidError";
    this.validation = validation;
  }
}

/** Throws ContributionInvalidError (carrying the blocking Issue[]) on a 422 — every
 * other failure surfaces as the usual ApiError from apiClient. */
export async function submitContribution(formId: string, content: ContributionContent, note?: string): Promise<ContributionSummary> {
  try {
    return await apiClient.post<ContributionSummary>(`/api/v1/forms/${formId}/contributions`, { content, note });
  } catch (err) {
    if (err instanceof ApiError && err.status === 422) {
      const validation = (err.body as { validation?: ValidationResult } | undefined)?.validation;
      if (validation) throw new ContributionInvalidError(validation);
    }
    throw err;
  }
}

export function listMyContributions(formId: string): Promise<ContributionSummary[]> {
  return apiClient.get<ContributionSummary[]>(`/api/v1/forms/${formId}/contributions`);
}

export interface ContributionSummaryWithForm extends ContributionSummary {
  formName: string;
}

/** Every contribution this user has ever submitted, across every form — backs the
 * "My Submissions" history page. `listMyContributions` above only covers one form
 * at a time (used on that form's own Translate & Extend page). */
export function listMyAllContributions(): Promise<ContributionSummaryWithForm[]> {
  return apiClient.get<ContributionSummaryWithForm[]>("/api/v1/forms/contributions/mine");
}
