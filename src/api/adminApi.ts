import { apiClient } from "./apiClient";
import type { ProjectCode } from "./projectCodesApi";
import type { Subsidiary } from "./subsidiariesApi";
import type { SubsidiaryLocale } from "./subsidiaryLocalesApi";

export type { ProjectCode } from "./projectCodesApi";
export type { Subsidiary } from "./subsidiariesApi";

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
  /** Optional display name — see backend User.firstName/lastName's own doc comment. */
  firstName: string | null;
  lastName: string | null;
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

/**
 * Permanently deletes an account — only possible when it has no records
 * anywhere in the app's history (created forms, contributions, QA runs,
 * Question Master exports, AI assistant activity, ...); the backend rejects
 * with a 409 otherwise (see admin.router.py's `delete_user`), and the only
 * option for such an account is `setUserActive(id, false)` instead. Same
 * self-account and role-based restriction as `setUserActive`.
 */
export function deleteUser(id: string): Promise<void> {
  return apiClient.delete<void>(`/api/v1/admin/users/${id}`);
}

export interface UpdateUserProfileInput {
  username?: string;
  email?: string;
  role?: AdminUserRole;
  /** `null` clears it (only valid when the resulting role isn't "standard");
   * `undefined` (omit the key) leaves it as-is. */
  subsidiaryId?: string | null;
  /** `null`/blank clears it, `undefined` (omit the key) leaves it as-is. */
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * Updates a user's account details (username/email/role/subsidiary) —
 * superadmin only, any target including themselves. Distinct from
 * setUserActive (isActive only) and setUserNotificationEmail (contact
 * address only) above — enforced server-side in admin.py's PATCH
 * /users/:id/profile.
 */
export function updateUserProfile(id: string, input: UpdateUserProfileInput): Promise<AdminUserListItem> {
  return apiClient.patch<AdminUserListItem>(`/api/v1/admin/users/${id}/profile`, input);
}

/**
 * Updates a user's own up-to-two separate notification-email addresses
 * (`null` or `""` clears a slot; an omitted field leaves it as-is). Any user
 * may update their own; only a superadmin may update someone else's —
 * enforced server-side in admin.py's PATCH
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

/** DB-stored connection settings for the FabriX OpenAPI chat endpoint
 * (POST /openapi/chat/v1/messages — see backend's fabrixSettingsService.ts,
 * mirroring smtpSettingsService.ts's own shape). `hasClientHeader`/
 * `hasOpenApiToken` reflect whether each secret is currently saved; the real
 * values are never sent to the browser. Which model(s) are actually used
 * lives in the separate FabrixModel catalog below (Configuration > AI
 * Assistant > Models), not here — `enabledModelCount` just reflects it. */
export interface FabrixSettings {
  baseUrl: string;
  enabled: boolean;
  /** Optional `x-generative-ai-user-email` header value — not a secret. */
  userEmail: string;
  /** Whether the required x-fabrix-client / x-openapi-token auth headers are
   * currently set. Neither value is ever sent to the browser. */
  hasClientHeader: boolean;
  hasOpenApiToken: boolean;
  /** How many models are currently enabled in the FabrixModel catalog. Zero
   * means the assistant is unusable even if everything else here is set. */
  enabledModelCount: number;
}

export interface SaveFabrixSettingsInput {
  baseUrl: string;
  enabled: boolean;
  userEmail?: string;
  /** Omit or leave blank to keep whatever value is already saved, for each
   * of these two secrets. */
  clientHeader?: string;
  openApiToken?: string;
}

export function getFabrixSettings(): Promise<FabrixSettings> {
  return apiClient.get<FabrixSettings>("/api/v1/admin/fabrix-settings");
}

export function saveFabrixSettings(input: SaveFabrixSettingsInput): Promise<FabrixSettings> {
  return apiClient.patch<FabrixSettings>("/api/v1/admin/fabrix-settings", input);
}

export function sendFabrixTestMessage(): Promise<{ ok: boolean; error?: string }> {
  return apiClient.post<{ ok: boolean; error?: string }>("/api/v1/admin/fabrix-settings/test");
}

/** One selectable FabriX LLM — see backend's FabrixModel entity. Every
 * enabled row (sortOrder ascending) is sent together as the chat request's
 * modelIds array, so FabriX can route around/fall back past one that's
 * unavailable or token/rate-limited. */
export interface FabrixModel {
  id: string;
  name: string;
  modelId: string;
  isEnabled: boolean;
  sortOrder: number;
  createdAt: string;
}

export function listFabrixModels(): Promise<FabrixModel[]> {
  return apiClient.get<FabrixModel[]>("/api/v1/admin/fabrix-models");
}

export function createFabrixModel(name: string, modelId: string): Promise<FabrixModel> {
  return apiClient.post<FabrixModel>("/api/v1/admin/fabrix-models", { name, modelId });
}

export function updateFabrixModel(
  id: string,
  input: { name?: string; modelId?: string; isEnabled?: boolean },
): Promise<FabrixModel> {
  return apiClient.patch<FabrixModel>(`/api/v1/admin/fabrix-models/${id}`, input);
}

export function moveFabrixModel(id: string, direction: "up" | "down"): Promise<FabrixModel> {
  return apiClient.post<FabrixModel>(`/api/v1/admin/fabrix-models/${id}/move`, { direction });
}

export function deleteFabrixModel(id: string): Promise<void> {
  return apiClient.delete(`/api/v1/admin/fabrix-models/${id}`);
}

/** DB-stored connection settings for Groq's OpenAI-compatible chat
 * completions API (see backend's groq_settings_service.py) — used
 * automatically as a fallback whenever FabriX is disabled or unreachable
 * (see backend's aiProviderService.py). Much simpler surface than FabriX:
 * one API key, one model string, no separate headers. */
export interface GroqSettings {
  model: string;
  enabled: boolean;
  hasApiKey: boolean;
}

export interface SaveGroqSettingsInput {
  model: string;
  enabled: boolean;
  /** Omit or leave blank to keep whatever key is already saved. */
  apiKey?: string;
}

export function getGroqSettings(): Promise<GroqSettings> {
  return apiClient.get<GroqSettings>("/api/v1/admin/groq-settings");
}

export function saveGroqSettings(input: SaveGroqSettingsInput): Promise<GroqSettings> {
  return apiClient.patch<GroqSettings>("/api/v1/admin/groq-settings", input);
}

export function sendGroqTestMessage(): Promise<{ ok: boolean; error?: string }> {
  return apiClient.post<{ ok: boolean; error?: string }>("/api/v1/admin/groq-settings/test");
}

/** DB-stored SFTP deployment config (Configuration > Deployment) — see
 * backend's sftpSettingsService.ts. Staging and production are both always
 * present; `activeEnvironment` is whichever one Publish/Deploy actually
 * pushes generated files to. `privateKeyPath` is a local filesystem path on
 * whichever machine runs the backend, not the key's contents. */
export type SftpEnvironment = "staging" | "production";

export interface SftpTargetConfig {
  host: string;
  port: number;
  username: string;
  privateKeyPath: string;
  remotePath: string;
}

export interface SftpDeploymentSettings {
  activeEnvironment: SftpEnvironment;
  staging: SftpTargetConfig;
  production: SftpTargetConfig;
}

export function getDeploymentSettings(): Promise<SftpDeploymentSettings> {
  return apiClient.get<SftpDeploymentSettings>("/api/v1/admin/deployment-settings");
}

export function saveDeploymentTarget(environment: SftpEnvironment, input: SftpTargetConfig): Promise<SftpDeploymentSettings> {
  return apiClient.patch<SftpDeploymentSettings>(`/api/v1/admin/deployment-settings/${environment}`, input);
}

export function setActiveDeploymentEnvironment(environment: SftpEnvironment): Promise<SftpDeploymentSettings> {
  return apiClient.post<SftpDeploymentSettings>("/api/v1/admin/deployment-settings/active", { environment });
}
