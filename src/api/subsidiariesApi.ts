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
 * backend-py/app/routers/subsidiaries.py. See projectCodesApi.ts's
 * `subsidiary` filter param and adminApi.ts's block management for the
 * per-(subsidiary, project code) upload restriction layered on top of this.
 * Admin-only subsidiary creation/disable/delete lives in adminApi.ts. */
export function listSubsidiaries(): Promise<Subsidiary[]> {
  return apiClient.get<Subsidiary[]>("/api/v1/subsidiaries");
}

/** GET /api/v1/subsidiaries/mine — the caller's own subsidiary (resolved
 * from their JWT's subsidiaryId claim). Only meaningful for a
 * subsidiary-scoped standard user; see MySubsidiaryPage. */
export function getMySubsidiary(): Promise<Subsidiary> {
  return apiClient.get<Subsidiary>("/api/v1/subsidiaries/mine");
}

/** PATCH /api/v1/subsidiaries/mine/notification-email — lets a
 * subsidiary-scoped standard user manage their *own* subsidiary's two extra
 * notification-email addresses, without needing admin access. Admins keep
 * full read/write over every subsidiary via adminApi.ts's
 * setSubsidiaryNotificationEmails regardless. */
export function setMySubsidiaryNotificationEmail(
  notificationEmail1: string | null,
  notificationEmail2: string | null,
): Promise<Subsidiary> {
  return apiClient.patch<Subsidiary>("/api/v1/subsidiaries/mine/notification-email", {
    notificationEmail1,
    notificationEmail2,
  });
}
