import { apiClient } from "./apiClient";
import type { PagedResult, UploadListItem, UploadStatus } from "./uploadsApi";
import type { ProjectCode } from "./projectCodesApi";
import type { Subsidiary } from "./subsidiariesApi";
import type { SubsidiaryLocale } from "./subsidiaryLocalesApi";

export type { ProjectCode } from "./projectCodesApi";
export type { Subsidiary } from "./subsidiariesApi";

export interface AdminUploadListItem extends UploadListItem {
  username: string | null;
}

// A type alias (not an interface) — object type aliases get an implicit
// string index signature when every property is string/number/undefined,
// which is what lets buildQuery()'s `Record<string, ...>` parameter accept
// this directly below. An `interface` here would not, and does not
// consistently surface as an error outside a full `tsc -b` build (see
// git history for this comment if that ever seems surprising again).
export type AdminListParams = {
  subsidiaryId?: string;
  projectCode?: string;
  userId?: string;
  status?: UploadStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "uploadDate" | "subsidiaryId" | "status" | "version" | "fileName";
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

/** GET /api/v1/admin/uploads — submitted uploads across every user, with
 * search/filter/sort/pagination. Admin-only (the backend's requireAdmin
 * middleware enforces this regardless of what the frontend does). An upload
 * only appears here once its uploader has submitted it — see AdminHistoryPage
 * for the full record including in-progress and failed uploads. */
export function listUploadsForAdmin(params: AdminListParams = {}): Promise<PagedResult<AdminUploadListItem>> {
  return apiClient.get<PagedResult<AdminUploadListItem>>(`/api/v1/admin/uploads${buildQuery(params)}`);
}

/** GET /api/v1/admin/history — every generated, submitted, or failed upload
 * across every user (the "All history" page). A "generated" row here is
 * still not-yet-submitted, so it's only guaranteed to show up until its
 * owner's next login purges it if they never submit it (see
 * uploadCleanupService.ts). */
export function listUploadHistoryForAdmin(params: AdminListParams = {}): Promise<PagedResult<AdminUploadListItem>> {
  return apiClient.get<PagedResult<AdminUploadListItem>>(`/api/v1/admin/history${buildQuery(params)}`);
}

export interface UploadHistorySummary {
  total: number;
  generated: number;
  submitted: number;
  failed: number;
}

/** GET /api/v1/admin/history/summary — status breakdown for AdminHistoryPage's
 * summary tiles, respecting the same subsidiary/projectCode/search filters as
 * listUploadHistoryForAdmin (its own `status` field is ignored server-side,
 * since the point is to show all three counts regardless of which one the
 * grid is currently filtered to). */
export function getUploadHistorySummary(params: AdminListParams = {}): Promise<UploadHistorySummary> {
  return apiClient.get<UploadHistorySummary>(`/api/v1/admin/history/summary${buildQuery(params)}`);
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

/** GET /api/v1/admin/preview/:uploadId — a single self-contained HTML document
 * (CSS/JS inlined server-side, see previewService.ts) for the admin
 * dashboard's "Preview" button. Defaults to the Full Form variant. */
export function previewUpload(uploadId: string, variant: "ff" | "oc" = "ff"): Promise<Blob> {
  return apiClient.getBlob(`/api/v1/admin/preview/${uploadId}?variant=${variant}`);
}

export type AdminUserRole = "admin" | "standard" | "superadmin";

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  role: AdminUserRole;
  /** Scopes a standard user to one subsidiary — see backend User.subsidiaryId's
   * own doc comment. Optional; meaningless (but harmless) on an admin account. */
  subsidiaryId?: string;
}

export interface CreatedUser {
  id: string;
  username: string;
  email: string;
  role: AdminUserRole;
  subsidiaryId: string | null;
}

export function createUser(input: CreateUserInput): Promise<CreatedUser> {
  return apiClient.post<CreatedUser>("/api/v1/admin/users", input);
}

export interface AdminUserListItem {
  id: string;
  username: string;
  email: string;
  role: AdminUserRole;
  subsidiaryId: string | null;
  isActive: boolean;
  /** Up to two separate addresses for notification purposes, distinct from
   * `email` (the login identity) — see backend User entity's own doc comment. */
  notificationEmail: string | null;
  notificationEmail2: string | null;
  createdAt: string;
}

/** GET /api/v1/admin/users — every provisioned account, for the User
 * Management page's list. */
export function listUsers(): Promise<AdminUserListItem[]> {
  return apiClient.get<AdminUserListItem[]>("/api/v1/admin/users");
}

/**
 * Enables or disables an account (blocks new logins immediately — enforced
 * server-side in authService.setUserActive). Same role-based restriction as
 * account creation: a plain admin may only act on standard accounts, only a
 * superadmin may act on an admin/superadmin account — and nobody may disable
 * their own account. Does not touch anything that account has already
 * uploaded/submitted.
 */
export function setUserActive(id: string, isActive: boolean): Promise<CreatedUser & { isActive: boolean }> {
  return apiClient.patch<CreatedUser & { isActive: boolean }>(`/api/v1/admin/users/${id}`, { isActive });
}

export interface UpdateUserProfileInput {
  username?: string;
  email?: string;
  role?: AdminUserRole;
  /** `null` clears it (only valid when the resulting role isn't "standard");
   * `undefined` (omit the key) leaves it as-is. */
  subsidiaryId?: string | null;
}

/**
 * Updates a user's account details (username/email/role/subsidiary) —
 * superadmin only, any target including themselves. Distinct from
 * setUserActive (isActive only) and setUserNotificationEmail (contact
 * address only) above — enforced server-side in admin.router.ts's PATCH
 * /users/:id/profile.
 */
export function updateUserProfile(id: string, input: UpdateUserProfileInput): Promise<AdminUserListItem> {
  return apiClient.patch<AdminUserListItem>(`/api/v1/admin/users/${id}/profile`, input);
}

/**
 * Updates a user's own up-to-two separate notification-email addresses
 * (`null` or `""` clears a slot; an omitted field leaves it as-is). Any user
 * may update their own; only a superadmin may update someone else's —
 * enforced server-side in admin.router.ts's PATCH
 * /users/:id/notification-email.
 */
export function setUserNotificationEmail(
  id: string,
  notificationEmail: string | null | undefined,
  notificationEmail2: string | null | undefined
): Promise<AdminUserListItem> {
  return apiClient.patch<AdminUserListItem>(`/api/v1/admin/users/${id}/notification-email`, {
    notificationEmail,
    notificationEmail2,
  });
}

/** GET /api/v1/admin/project-codes — every project code, open and closed
 * alike (the admin management list). The upload form's own dropdown uses the
 * open-only projectCodesApi.listOpenProjectCodes instead. */
export function listAllProjectCodes(): Promise<ProjectCode[]> {
  return apiClient.get<ProjectCode[]>("/api/v1/admin/project-codes");
}

/** `startDate`/`endDate`/`cutoffDate` are "YYYY-MM-DD" strings (an
 * <input type="date">'s own value format) or omitted. `startDate`/`endDate`
 * are purely descriptive; `cutoffDate` isn't enforced here either but is
 * meaningful — see backend ProjectCode entity's own doc comment. */
export function createProjectCode(code: string, startDate?: string, endDate?: string, cutoffDate?: string): Promise<ProjectCode> {
  return apiClient.post<ProjectCode>("/api/v1/admin/project-codes", { code, startDate, endDate, cutoffDate });
}

/** Closing a project code blocks new uploads against it (enforced server-side
 * in uploadService.createUpload) — it does not affect uploads already made
 * under that code. */
export function setProjectCodeOpen(id: string, isOpen: boolean): Promise<ProjectCode> {
  return apiClient.patch<ProjectCode>(`/api/v1/admin/project-codes/${id}`, { isOpen });
}

/** Locking a project code blocks subsidiary (non-admin) uploads and Form Builder
 * contributions against it, and becomes the precondition for generating a Question
 * Master (see `ProjectCode.isLocked`'s own doc comment) — a separate, more permanent
 * freeze from `setProjectCodeOpen` above. Admins stay exempt. */
export function setProjectCodeLocked(id: string, isLocked: boolean): Promise<ProjectCode> {
  return apiClient.patch<ProjectCode>(`/api/v1/admin/project-codes/${id}`, { isLocked });
}

/** Renames a project code's own text value (server rejects an exact
 * case-insensitive duplicate with a 409). Does not retroactively change
 * anything already uploaded under the old value — see backend
 * projectCodeService.setProjectCodeValue's own doc comment. */
export function setProjectCodeValue(id: string, code: string): Promise<ProjectCode> {
  return apiClient.patch<ProjectCode>(`/api/v1/admin/project-codes/${id}`, { code });
}

/** Updates the campaign dates (and/or the cutoff date) — `null` clears a
 * bound, `undefined` (simply omit the key) leaves it as-is. Independent of
 * setProjectCodeOpen above; the two are never sent in the same request from
 * this UI. */
export function setProjectCodeDateRange(
  id: string,
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  cutoffDate?: string | null,
): Promise<ProjectCode> {
  return apiClient.patch<ProjectCode>(`/api/v1/admin/project-codes/${id}`, { startDate, endDate, cutoffDate });
}

/** GET /api/v1/admin/subsidiaries — every subsidiary, active and inactive
 * alike (the admin management list — needs to see disabled ones too, to
 * re-enable them). The upload/user-creation forms' own dropdowns use the
 * active-only subsidiariesApi.listSubsidiaries instead. */
export function listAllSubsidiaries(): Promise<Subsidiary[]> {
  return apiClient.get<Subsidiary[]>("/api/v1/admin/subsidiaries");
}

export function createSubsidiary(name: string): Promise<Subsidiary> {
  return apiClient.post<Subsidiary>("/api/v1/admin/subsidiaries", { name });
}

/** Disabling a subsidiary blocks *every* project code for it in one step
 * (enforced server-side in uploadService.createUpload), independent of any
 * single (subsidiary, project code) block — the reversible option; see
 * deleteSubsidiary below for the permanent one. Does not affect uploads
 * already made under it. */
export function setSubsidiaryActive(id: string, isActive: boolean): Promise<Subsidiary> {
  return apiClient.patch<Subsidiary>(`/api/v1/admin/subsidiaries/${id}`, { isActive });
}

/** Updates a subsidiary's up-to-two extra notification recipient addresses —
 * `null` (or `""`, normalized server-side) clears a slot, `undefined` (simply
 * omit the key) leaves it as-is. Independent of setSubsidiaryActive above. */
export function setSubsidiaryNotificationEmails(
  id: string,
  notificationEmail1: string | null | undefined,
  notificationEmail2: string | null | undefined,
): Promise<Subsidiary> {
  return apiClient.patch<Subsidiary>(`/api/v1/admin/subsidiaries/${id}`, { notificationEmail1, notificationEmail2 });
}

/** Permanently removes a subsidiary (and any subsidiary-project blocks
 * naming it). Uploads/users already scoped to it keep their own
 * (denormalized) subsidiary value regardless — see backend
 * subsidiaryService.deleteSubsidiary. */
export function deleteSubsidiary(id: string): Promise<void> {
  return apiClient.delete(`/api/v1/admin/subsidiaries/${id}`);
}

export interface SubsidiaryProjectBlock {
  id: string;
  subsidiaryName: string;
  projectCode: string;
  createdAt: string;
}

/** GET /api/v1/admin/subsidiary-project-blocks — every (subsidiary, project
 * code) pair currently blocked from new uploads — e.g. "F2H26" closed for
 * "SGE" specifically while every other subsidiary can still upload it.
 * Independent of, and layered on top of, a project code's own global
 * open/closed state (see ProjectCodeManager / setProjectCodeOpen above). */
export function listSubsidiaryProjectBlocks(): Promise<SubsidiaryProjectBlock[]> {
  return apiClient.get<SubsidiaryProjectBlock[]>("/api/v1/admin/subsidiary-project-blocks");
}

export function createSubsidiaryProjectBlock(subsidiaryName: string, projectCode: string): Promise<SubsidiaryProjectBlock> {
  return apiClient.post<SubsidiaryProjectBlock>("/api/v1/admin/subsidiary-project-blocks", {
    subsidiaryName,
    projectCode,
  });
}

/** Unblocking (deleting the row) is the only thing that lets that subsidiary
 * upload that project code again (enforced server-side in
 * uploadService.createUpload). */
export function deleteSubsidiaryProjectBlock(id: string): Promise<void> {
  return apiClient.delete(`/api/v1/admin/subsidiary-project-blocks/${id}`);
}

/** GET /api/v1/admin/subsidiary-locales — every subsidiary's master locale list,
 * for the Configuration page's SubsidiaryLocaleManager. Read-only "which locales
 * can this subsidiary's users pick" access for any authenticated user lives at
 * /api/v1/subsidiary-locales instead (see subsidiaryLocalesApi.ts). */
export function listAllSubsidiaryLocales(): Promise<SubsidiaryLocale[]> {
  return apiClient.get<SubsidiaryLocale[]>("/api/v1/admin/subsidiary-locales");
}

export interface CreateSubsidiaryLocaleInput {
  subsidiaryName: string;
  code: string;
  langSubtag: string;
  isRtl: boolean;
  label: string;
  isFallback: boolean;
}

export function addSubsidiaryLocale(input: CreateSubsidiaryLocaleInput): Promise<SubsidiaryLocale> {
  return apiClient.post<SubsidiaryLocale>("/api/v1/admin/subsidiary-locales", input);
}

export function deleteSubsidiaryLocale(id: string): Promise<void> {
  return apiClient.delete(`/api/v1/admin/subsidiary-locales/${id}`);
}

/** DB-stored SMTP connection settings for outgoing notification email (see
 * backend's smtpSettingsService.ts) — `hasPassword` reflects whether one is
 * currently saved; the real password is never sent to the browser. */
export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string | null;
  from: string | null;
  hasPassword: boolean;
}

export interface SaveSmtpSettingsInput {
  host: string;
  port: number;
  secure: boolean;
  user: string | null;
  /** Omit or leave blank to keep whatever password is already saved. */
  password?: string;
  from: string | null;
}

export function getSmtpSettings(): Promise<SmtpSettings> {
  return apiClient.get<SmtpSettings>("/api/v1/admin/smtp-settings");
}

export function saveSmtpSettings(input: SaveSmtpSettingsInput): Promise<SmtpSettings> {
  return apiClient.patch<SmtpSettings>("/api/v1/admin/smtp-settings", input);
}

export function sendSmtpTestEmail(): Promise<{ ok: true; sentTo: string }> {
  return apiClient.post<{ ok: true; sentTo: string }>("/api/v1/admin/smtp-settings/test");
}
