import { apiClient } from "./apiClient";

/** GET /api/v1/subsidiary-recaptcha-configs?subsidiary=NAME — `{siteKey}`
 * (siteKey is `null` if the subsidiary has none configured yet). Any
 * authenticated user, not just admins — read by the form builder's
 * reCAPTCHA toggle (BuilderCanvas.tsx) to warn when it's turned on for a
 * subsidiary with no site key configured yet, so a generated form never
 * silently ships a broken widget. Admin management (add/edit/remove rows)
 * lives in adminApi.ts. */
export function getSubsidiaryRecaptchaConfig(subsidiaryName: string): Promise<{ siteKey: string | null }> {
  return apiClient.get<{ siteKey: string | null }>(`/api/v1/subsidiary-recaptcha-configs?subsidiary=${encodeURIComponent(subsidiaryName)}`);
}
