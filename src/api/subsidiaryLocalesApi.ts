import { apiClient } from "./apiClient";

export interface SubsidiaryLocale {
  id: string;
  subsidiaryName: string;
  code: string;
  langSubtag: string;
  isRtl: boolean;
  label: string;
  isFallback: boolean;
  sortOrder: number;
  createdAt: string;
}

/** GET /api/v1/subsidiary-locales?subsidiary=NAME — one subsidiary's own allowed
 * locale list, fallback first. Any authenticated user, not just admins — read by
 * admin's own Form Initiator (a convenience picker alongside free text, see
 * LocaleManagerPanel.tsx) and a subsidiary user's own ad-hoc form builder
 * (restricted to this list, see SubsidiaryLocalePicker.tsx). Admin management
 * (add/remove) lives in adminApi.ts. */
export function listSubsidiaryLocales(subsidiaryName: string): Promise<SubsidiaryLocale[]> {
  return apiClient.get<SubsidiaryLocale[]>(`/api/v1/subsidiary-locales?subsidiary=${encodeURIComponent(subsidiaryName)}`);
}
