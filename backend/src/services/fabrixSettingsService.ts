import { getAdminSetting, setAdminSetting } from "./adminSettingsService";
import { decryptSecret, encryptSecret } from "../utils/secretCipher";

/**
 * DB-stored FabriXAI Agent-API connection config, admin-managed via
 * Configuration > AI Assistant Settings — mirrors smtpSettingsService.ts's
 * shape exactly (same AdminSetting-row-per-field convention, same
 * "DB settings win, env vars are the fallback" precedence).
 *
 * `apiKey`, `clientHeader`, and `openApiToken` are all treated as secrets
 * (encrypted at rest via secretCipher.ts, write-only from the browser) —
 * this particular FabriXAI deployment's client-header/openapi-token values
 * are themselves credential-bearing (a signed JWT carrying a client id/secret,
 * and an OAuth2 bearer access token respectively), not just routing headers.
 */
export interface FabrixSettings {
  baseUrl: string;
  apiKey: string | null;
  agentId: string;
  enabled: boolean;
  timeoutSeconds: number;
  maxRetries: number;
  /** Extra header some FabriXAI deployments (e.g. a gateway in front of the
   * real agent API) require alongside/instead of Authorization — see
   * fabrixAIService.ts's callFabrixAgent. Empty string means "not set." */
  clientHeader: string;
  openApiToken: string;
}

export interface FabrixSettingsInput {
  baseUrl: string;
  agentId: string;
  /** Omitted/blank for any of these three means "keep whatever is already
   * stored" — the admin UI never has the real secret to send back, only
   * whether one exists (see getFabrixSettingsForDisplay). */
  apiKey?: string | null;
  clientHeader?: string | null;
  openApiToken?: string | null;
  enabled?: boolean;
}

export interface FabrixSettingsForDisplay {
  baseUrl: string;
  agentId: string;
  enabled: boolean;
  hasApiKey: boolean;
  hasClientHeader: boolean;
  hasOpenApiToken: boolean;
}

const DEFAULT_TIMEOUT_SECONDS = 30;
const DEFAULT_MAX_RETRIES = 2;

/**
 * Reads every fabrix* AdminSetting row and assembles them into one config —
 * falls back to FABRIX_API_BASE_URL/FABRIX_API_KEY/FABRIX_AGENT_ID/
 * FABRIX_TIMEOUT_SECONDS/FABRIX_MAX_RETRIES/FABRIX_ENABLED/
 * FABRIX_CLIENT_HEADER/FABRIX_OPENAPI_TOKEN env vars for whichever piece
 * isn't set in the DB (matches emailService.ts's resolveSmtpConfig
 * precedence — DB wins, env is the deploy-time fallback). Returns null only
 * if neither a DB baseUrl/agentId nor their env-var fallbacks are present at
 * all — there is nothing usable to call FabriXAI with.
 */
export async function getFabrixSettings(): Promise<FabrixSettings | null> {
  const [dbBaseUrl, dbAgentId, apiKeyEnc, enabledRaw, timeoutRaw, retriesRaw, clientHeaderEnc, openApiTokenEnc] = await Promise.all([
    getAdminSetting("fabrixApiBaseUrl"),
    getAdminSetting("fabrixAgentId"),
    getAdminSetting("fabrixApiKeyEnc"),
    getAdminSetting("fabrixEnabled"),
    getAdminSetting("fabrixTimeoutSeconds"),
    getAdminSetting("fabrixMaxRetries"),
    getAdminSetting("fabrixClientHeaderEnc"),
    getAdminSetting("fabrixOpenApiTokenEnc"),
  ]);

  const baseUrl = dbBaseUrl ?? process.env.FABRIX_API_BASE_URL ?? "";
  const agentId = dbAgentId ?? process.env.FABRIX_AGENT_ID ?? "";
  if (!baseUrl || !agentId) return null;

  const apiKey = apiKeyEnc ? decryptSecret(apiKeyEnc) : (process.env.FABRIX_API_KEY ?? null);
  const clientHeader = clientHeaderEnc ? decryptSecret(clientHeaderEnc) : (process.env.FABRIX_CLIENT_HEADER ?? "");
  const openApiToken = openApiTokenEnc ? decryptSecret(openApiTokenEnc) : (process.env.FABRIX_OPENAPI_TOKEN ?? "");
  const enabled = enabledRaw !== null ? enabledRaw === "true" : process.env.FABRIX_ENABLED !== "false";
  const timeoutSeconds = Number(timeoutRaw ?? process.env.FABRIX_TIMEOUT_SECONDS ?? DEFAULT_TIMEOUT_SECONDS) || DEFAULT_TIMEOUT_SECONDS;
  const maxRetries = Number(retriesRaw ?? process.env.FABRIX_MAX_RETRIES ?? DEFAULT_MAX_RETRIES) || DEFAULT_MAX_RETRIES;

  return { baseUrl, apiKey, agentId, enabled, timeoutSeconds, maxRetries, clientHeader, openApiToken };
}

/** Admin-UI-safe view of the current settings — every secret (API key,
 * client header, openapi token) is never sent to the browser, only whether
 * one is set. */
export async function getFabrixSettingsForDisplay(): Promise<FabrixSettingsForDisplay> {
  const settings = await getFabrixSettings();
  if (!settings) {
    return { baseUrl: "", agentId: "", enabled: false, hasApiKey: false, hasClientHeader: false, hasOpenApiToken: false };
  }
  return {
    baseUrl: settings.baseUrl,
    agentId: settings.agentId,
    enabled: settings.enabled,
    hasApiKey: !!settings.apiKey,
    hasClientHeader: !!settings.clientHeader,
    hasOpenApiToken: !!settings.openApiToken,
  };
}

export async function saveFabrixSettings(input: FabrixSettingsInput): Promise<void> {
  await setAdminSetting("fabrixApiBaseUrl", input.baseUrl);
  await setAdminSetting("fabrixAgentId", input.agentId);
  await setAdminSetting("fabrixEnabled", input.enabled === undefined ? null : input.enabled ? "true" : "false");
  if (input.apiKey && input.apiKey.trim().length > 0) {
    await setAdminSetting("fabrixApiKeyEnc", encryptSecret(input.apiKey.trim()));
  }
  if (input.clientHeader && input.clientHeader.trim().length > 0) {
    await setAdminSetting("fabrixClientHeaderEnc", encryptSecret(input.clientHeader.trim()));
  }
  if (input.openApiToken && input.openApiToken.trim().length > 0) {
    await setAdminSetting("fabrixOpenApiTokenEnc", encryptSecret(input.openApiToken.trim()));
  }
}
