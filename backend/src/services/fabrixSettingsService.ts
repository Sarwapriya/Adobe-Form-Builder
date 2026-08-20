import { getAdminSetting, setAdminSetting } from "./adminSettingsService";
import { decryptSecret, encryptSecret } from "../utils/secretCipher";

/**
 * DB-stored FabriXAI Agent-API connection config, admin-managed via
 * Configuration > AI Assistant Settings — mirrors smtpSettingsService.ts's
 * shape exactly (same AdminSetting-row-per-field convention, same
 * "DB settings win, env vars are the fallback" precedence, same
 * encrypted-at-rest secret via secretCipher.ts).
 */
export interface FabrixSettings {
  baseUrl: string;
  apiKey: string | null;
  agentId: string;
  enabled: boolean;
  timeoutSeconds: number;
  maxRetries: number;
}

export interface FabrixSettingsInput {
  baseUrl: string;
  agentId: string;
  /** Omitted/blank means "keep whatever key is already stored" — the admin
   * UI never has the real key to send back, only whether one exists (see
   * getFabrixSettingsForDisplay). */
  apiKey?: string | null;
  enabled?: boolean;
}

export interface FabrixSettingsForDisplay {
  baseUrl: string;
  agentId: string;
  enabled: boolean;
  hasApiKey: boolean;
}

const DEFAULT_TIMEOUT_SECONDS = 30;
const DEFAULT_MAX_RETRIES = 2;

/**
 * Reads every fabrix* AdminSetting row and assembles them into one config —
 * falls back to FABRIX_API_BASE_URL/FABRIX_API_KEY/FABRIX_AGENT_ID/
 * FABRIX_TIMEOUT_SECONDS/FABRIX_MAX_RETRIES/FABRIX_ENABLED env vars for
 * whichever piece isn't set in the DB (matches emailService.ts's
 * resolveSmtpConfig precedence — DB wins, env is the deploy-time fallback).
 * Returns null only if neither a DB baseUrl/agentId nor their env-var
 * fallbacks are present at all — there is nothing usable to call FabriXAI
 * with.
 */
export async function getFabrixSettings(): Promise<FabrixSettings | null> {
  const [dbBaseUrl, dbAgentId, apiKeyEnc, enabledRaw, timeoutRaw, retriesRaw] = await Promise.all([
    getAdminSetting("fabrixApiBaseUrl"),
    getAdminSetting("fabrixAgentId"),
    getAdminSetting("fabrixApiKeyEnc"),
    getAdminSetting("fabrixEnabled"),
    getAdminSetting("fabrixTimeoutSeconds"),
    getAdminSetting("fabrixMaxRetries"),
  ]);

  const baseUrl = dbBaseUrl ?? process.env.FABRIX_API_BASE_URL ?? "";
  const agentId = dbAgentId ?? process.env.FABRIX_AGENT_ID ?? "";
  if (!baseUrl || !agentId) return null;

  const apiKey = apiKeyEnc ? decryptSecret(apiKeyEnc) : (process.env.FABRIX_API_KEY ?? null);
  const enabled = enabledRaw !== null ? enabledRaw === "true" : process.env.FABRIX_ENABLED !== "false";
  const timeoutSeconds = Number(timeoutRaw ?? process.env.FABRIX_TIMEOUT_SECONDS ?? DEFAULT_TIMEOUT_SECONDS) || DEFAULT_TIMEOUT_SECONDS;
  const maxRetries = Number(retriesRaw ?? process.env.FABRIX_MAX_RETRIES ?? DEFAULT_MAX_RETRIES) || DEFAULT_MAX_RETRIES;

  return { baseUrl, apiKey, agentId, enabled, timeoutSeconds, maxRetries };
}

/** Admin-UI-safe view of the current settings — the real API key is never
 * sent to the browser, only whether one is set. */
export async function getFabrixSettingsForDisplay(): Promise<FabrixSettingsForDisplay> {
  const settings = await getFabrixSettings();
  if (!settings) {
    return { baseUrl: "", agentId: "", enabled: false, hasApiKey: false };
  }
  return {
    baseUrl: settings.baseUrl,
    agentId: settings.agentId,
    enabled: settings.enabled,
    hasApiKey: !!settings.apiKey,
  };
}

export async function saveFabrixSettings(input: FabrixSettingsInput): Promise<void> {
  await setAdminSetting("fabrixApiBaseUrl", input.baseUrl);
  await setAdminSetting("fabrixAgentId", input.agentId);
  await setAdminSetting("fabrixEnabled", input.enabled === undefined ? null : input.enabled ? "true" : "false");
  if (input.apiKey && input.apiKey.trim().length > 0) {
    await setAdminSetting("fabrixApiKeyEnc", encryptSecret(input.apiKey.trim()));
  }
}
