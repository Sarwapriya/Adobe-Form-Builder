import { getAdminSetting, setAdminSetting } from "./adminSettingsService";
import { decryptSecret, encryptSecret } from "../utils/secretCipher";

/**
 * DB-stored connection config for the Anthropic Claude Messages API,
 * admin-managed via Configuration > AI Assistant. Mirrors
 * fabrixSettingsService.ts's shape (same AdminSetting-row-per-field
 * convention, same "DB settings win, env vars are the fallback"
 * precedence) — but the actual contract is much simpler than FabriX's: one
 * API key (Authorization is handled by the official SDK) and one `model`
 * string per request, no separate headers, no model array/fallback list.
 */
export interface ClaudeSettings {
  apiKey: string;
  model: string;
  enabled: boolean;
}

export interface ClaudeSettingsInput {
  model: string;
  /** Omitted/blank means "keep whatever is already stored" — the admin UI
   * never has the real key to send back, only whether one exists (see
   * getClaudeSettingsForDisplay). */
  apiKey?: string | null;
  enabled?: boolean;
}

export interface ClaudeSettingsForDisplay {
  model: string;
  enabled: boolean;
  hasApiKey: boolean;
}

const DEFAULT_MODEL = "claude-opus-5";

/** Falls back to ANTHROPIC_API_KEY/CLAUDE_MODEL/CLAUDE_ENABLED env vars for
 * whichever piece isn't set in the DB. Returns null only if there's no
 * usable API key at all — nothing to call Claude with. */
export async function getClaudeSettings(): Promise<ClaudeSettings | null> {
  const [apiKeyEnc, dbModel, enabledRaw] = await Promise.all([
    getAdminSetting("claudeApiKeyEnc"),
    getAdminSetting("claudeModel"),
    getAdminSetting("claudeEnabled"),
  ]);

  const apiKey = (apiKeyEnc ? decryptSecret(apiKeyEnc) : (process.env.ANTHROPIC_API_KEY ?? "")).trim();
  if (!apiKey) return null;

  const model = dbModel ?? process.env.CLAUDE_MODEL ?? DEFAULT_MODEL;
  const enabled = enabledRaw !== null ? enabledRaw === "true" : process.env.CLAUDE_ENABLED !== "false";

  return { apiKey, model, enabled };
}

/** Admin-UI-safe view — the API key is never sent to the browser, only
 * whether one is set. */
export async function getClaudeSettingsForDisplay(): Promise<ClaudeSettingsForDisplay> {
  const settings = await getClaudeSettings();
  if (!settings) {
    return { model: (await getAdminSetting("claudeModel")) ?? process.env.CLAUDE_MODEL ?? DEFAULT_MODEL, enabled: false, hasApiKey: false };
  }
  return { model: settings.model, enabled: settings.enabled, hasApiKey: true };
}

export async function saveClaudeSettings(input: ClaudeSettingsInput): Promise<void> {
  await setAdminSetting("claudeModel", input.model);
  await setAdminSetting("claudeEnabled", input.enabled === undefined ? null : input.enabled ? "true" : "false");
  if (input.apiKey && input.apiKey.trim().length > 0) {
    await setAdminSetting("claudeApiKeyEnc", encryptSecret(input.apiKey.trim()));
  }
}
