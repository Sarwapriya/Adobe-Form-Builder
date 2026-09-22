import { apiClient } from "./apiClient";

/** GET /api/v1/subsidiary-privacy-links?subsidiary=NAME — `{localeCode: url}`
 * for one subsidiary, e.g. `{ "en_AE": "https://www.samsung.com/ae/info/privacy/" }`.
 * Any authenticated user, not just admins — read by the form builder's Privacy
 * Policy consent field to auto-fill its Link URL instead of a user typing/
 * guessing the right regional URL (see ProfileFieldEditorPanel.tsx). Admin
 * management (add/edit/remove rows) lives in adminApi.ts. */
export function getSubsidiaryPrivacyLinks(subsidiaryName: string): Promise<Record<string, string>> {
  return apiClient.get<Record<string, string>>(`/api/v1/subsidiary-privacy-links?subsidiary=${encodeURIComponent(subsidiaryName)}`);
}
