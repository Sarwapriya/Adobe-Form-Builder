import { getAdminSetting, setAdminSetting } from "./adminSettingsService";
import { decryptSecret, encryptSecret } from "../utils/secretCipher";
import { listEnabledModelIds } from "./fabrixModelsService";

/**
 * DB-stored connection config for the FabriX OpenAPI chat endpoint
 * (`POST {baseUrl}/openapi/chat/v1/messages` — see fabrixAIService.ts's
 * callFabrixAgent), admin-managed via Configuration > AI Assistant.
 * Mirrors smtpSettingsService.ts's shape (same AdminSetting-row-per-field
 * convention, same "DB settings win, env vars are the fallback" precedence).
 *
 * Every field here maps directly onto something the real, documented API
 * actually needs — there is no `apiKey`/`agentId` here (an earlier
 * best-guess design had both; neither exists in the real contract, which
 * authenticates purely via the two headers below):
 *   - baseUrl + modelIds build the URL/body (`modelIds: [...]`). modelIds
 *     itself is NOT stored here — it comes from the separate, admin-managed
 *     FabrixModels table (Configuration > AI Assistant > Models — see
 *     fabrixModelsService.ts's listEnabledModelIds), so adding/removing/
 *     reordering models doesn't touch this connection-settings form at all.
 *   - clientHeader/openApiToken are the required `x-fabrix-client` /
 *     x-openapi-token` auth headers — both credential-bearing (a signed JWT
 *     carrying a client id/secret, and an OAuth2 bearer access token
 *     respectively), so both are encrypted at rest via secretCipher.ts and
 *     write-only from the browser.
 *   - userEmail is the optional `x-generative-ai-user-email` header (portal
 *     user tracking) — not a secret, shown back to the admin UI as-is.
 */
export interface FabrixSettings {
  baseUrl: string;
  /** Every currently-enabled model's id, in priority order, deduped — sent
   * as-is as the request body's `modelIds` array. Sourced from the
   * FabrixModels table, not an AdminSetting row (see fabrixModelsService.ts). */
  modelIds: string[];
  enabled: boolean;
  timeoutSeconds: number;
  maxRetries: number;
  /** Required `x-fabrix-client` header value. Empty string means "not set." */
  clientHeader: string;
  /** Required `x-openapi-token` header value. Empty string means "not set." */
  openApiToken: string;
  /** Optional `x-generative-ai-user-email` header value. */
  userEmail: string;
}

export interface FabrixSettingsInput {
  baseUrl: string;
  /** Omitted/blank for either of these two means "keep whatever is already
   * stored" — the admin UI never has the real secret to send back, only
   * whether one exists (see getFabrixSettingsForDisplay). */
  clientHeader?: string | null;
  openApiToken?: string | null;
  userEmail?: string | null;
  enabled?: boolean;
}

export interface FabrixSettingsForDisplay {
  baseUrl: string;
  enabled: boolean;
  userEmail: string;
  hasClientHeader: boolean;
  hasOpenApiToken: boolean;
  /** How many models are currently enabled in the FabrixModels catalog —
   * shown so the admin notices immediately if that list is empty (the other
   * reason getFabrixSettings can return null besides a missing baseUrl). */
  enabledModelCount: number;
}

const DEFAULT_TIMEOUT_SECONDS = 30;
const DEFAULT_MAX_RETRIES = 2;

/**
 * Reads every fabrix* AdminSetting row plus the FabrixModels table and
 * assembles them into one config — falls back to FABRIX_API_BASE_URL/
 * FABRIX_TIMEOUT_SECONDS/FABRIX_MAX_RETRIES/FABRIX_ENABLED/
 * FABRIX_CLIENT_HEADER/FABRIX_OPENAPI_TOKEN/FABRIX_USER_EMAIL env vars for
 * whichever piece isn't set in the DB (matches emailService.ts's
 * resolveSmtpConfig precedence — DB wins, env is the deploy-time fallback).
 * Returns null if baseUrl is missing, or if there isn't at least one enabled
 * model — both are required to build a valid request. If the FabrixModels
 * table has zero enabled rows, FABRIX_MODEL_ID (a single id) is used as a
 * last-resort fallback so a fresh install still works before any admin has
 * visited Configuration > AI Assistant > Models.
 */
export async function getFabrixSettings(): Promise<FabrixSettings | null> {
  const [dbBaseUrl, enabledRaw, timeoutRaw, retriesRaw, clientHeaderEnc, openApiTokenEnc, dbUserEmail, tableModelIds] = await Promise.all([
    getAdminSetting("fabrixApiBaseUrl"),
    getAdminSetting("fabrixEnabled"),
    getAdminSetting("fabrixTimeoutSeconds"),
    getAdminSetting("fabrixMaxRetries"),
    getAdminSetting("fabrixClientHeaderEnc"),
    getAdminSetting("fabrixOpenApiTokenEnc"),
    getAdminSetting("fabrixUserEmail"),
    listEnabledModelIds(),
  ]);

  const baseUrl = dbBaseUrl ?? process.env.FABRIX_API_BASE_URL ?? "";
  const envModelId = (process.env.FABRIX_MODEL_ID ?? "").trim();
  const modelIds = tableModelIds.length > 0 ? tableModelIds : envModelId ? [envModelId] : [];
  if (!baseUrl || modelIds.length === 0) return null;

  const clientHeader = (clientHeaderEnc ? decryptSecret(clientHeaderEnc) : (process.env.FABRIX_CLIENT_HEADER ?? "")).trim();
  const openApiToken = (openApiTokenEnc ? decryptSecret(openApiTokenEnc) : (process.env.FABRIX_OPENAPI_TOKEN ?? "")).trim();
  const userEmail = (dbUserEmail ?? process.env.FABRIX_USER_EMAIL ?? "").trim();
  const enabled = enabledRaw !== null ? enabledRaw === "true" : process.env.FABRIX_ENABLED !== "false";
  const timeoutSeconds = Number(timeoutRaw ?? process.env.FABRIX_TIMEOUT_SECONDS ?? DEFAULT_TIMEOUT_SECONDS) || DEFAULT_TIMEOUT_SECONDS;
  const maxRetries = Number(retriesRaw ?? process.env.FABRIX_MAX_RETRIES ?? DEFAULT_MAX_RETRIES) || DEFAULT_MAX_RETRIES;

  return { baseUrl, modelIds, enabled, timeoutSeconds, maxRetries, clientHeader, openApiToken, userEmail };
}

/** Admin-UI-safe view of the current settings — the two secrets (client
 * header, openapi token) are never sent to the browser, only whether one is
 * set; everything else (including userEmail, not a secret) is shown as-is. */
export async function getFabrixSettingsForDisplay(): Promise<FabrixSettingsForDisplay> {
  const settings = await getFabrixSettings();
  if (!settings) {
    const enabledModelCount = (await listEnabledModelIds()).length;
    return { baseUrl: "", enabled: false, userEmail: "", hasClientHeader: false, hasOpenApiToken: false, enabledModelCount };
  }
  return {
    baseUrl: settings.baseUrl,
    enabled: settings.enabled,
    userEmail: settings.userEmail,
    hasClientHeader: !!settings.clientHeader,
    hasOpenApiToken: !!settings.openApiToken,
    enabledModelCount: settings.modelIds.length,
  };
}

export async function saveFabrixSettings(input: FabrixSettingsInput): Promise<void> {
  await setAdminSetting("fabrixApiBaseUrl", input.baseUrl);
  await setAdminSetting("fabrixUserEmail", input.userEmail ?? "");
  await setAdminSetting("fabrixEnabled", input.enabled === undefined ? null : input.enabled ? "true" : "false");
  if (input.clientHeader && input.clientHeader.trim().length > 0) {
    await setAdminSetting("fabrixClientHeaderEnc", encryptSecret(input.clientHeader.trim()));
  }
  if (input.openApiToken && input.openApiToken.trim().length > 0) {
    await setAdminSetting("fabrixOpenApiTokenEnc", encryptSecret(input.openApiToken.trim()));
  }
}
