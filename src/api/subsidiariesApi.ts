import { apiClient } from "./apiClient";

export interface Subsidiary {
  id: string;
  name: string;
  isActive: boolean;
  /** Up to two extra recipient addresses for notification purposes, additional
   * to whichever subsidiary-scoped Users actually receive a given
   * notification — see backend Subsidiary entity's own doc comment. */
  notificationEmail1: string | null;
  notificationEmail2: string | null;
  createdAt: string;
}

/** GET /api/v1/subsidiaries — active subsidiaries only, populating the
 * upload form's and user-creation form's "Subsidiary" dropdowns. Any
 * authenticated user, not just admins — see
 * backend/src/routes/subsidiary.router.ts. See projectCodesApi.ts's
 * `subsidiary` filter param and adminApi.ts's block management for the
 * per-(subsidiary, project code) upload restriction layered on top of this.
 * Admin-only subsidiary creation/disable/delete lives in adminApi.ts. */
export function listSubsidiaries(): Promise<Subsidiary[]> {
  return apiClient.get<Subsidiary[]>("/api/v1/subsidiaries");
}
