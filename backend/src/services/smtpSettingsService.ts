import { getAdminSetting, setAdminSetting } from "./adminSettingsService";
import { decryptSecret, encryptSecret } from "../utils/secretCipher";

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string | null;
  password: string | null;
  from: string | null;
}

export interface SmtpSettingsInput {
  host: string;
  port: number;
  secure: boolean;
  user: string | null;
  /** Omitted/blank means "keep whatever password is already stored" — the
   * admin UI never has the real password to send back, only whether one
   * exists (see getSmtpSettingsForDisplay). */
  password?: string | null;
  from: string | null;
}

export interface SmtpSettingsForDisplay {
  host: string;
  port: number;
  secure: boolean;
  user: string | null;
  from: string | null;
  hasPassword: boolean;
}

/** Reads every smtp* AdminSetting row and assembles them into one config —
 * returns null if nothing has been configured in the DB yet (smtpHost unset),
 * so callers can fall back to the env-var-only config that predates this
 * feature (see emailService.ts's resolveSmtpConfig). */
export async function getSmtpSettings(): Promise<SmtpSettings | null> {
  const host = await getAdminSetting("smtpHost");
  if (!host) return null;

  const [portRaw, secureRaw, user, passwordEnc, from] = await Promise.all([
    getAdminSetting("smtpPort"),
    getAdminSetting("smtpSecure"),
    getAdminSetting("smtpUser"),
    getAdminSetting("smtpPasswordEnc"),
    getAdminSetting("smtpFrom"),
  ]);

  return {
    host,
    port: portRaw ? Number(portRaw) || 587 : 587,
    secure: secureRaw === "true",
    user,
    password: passwordEnc ? decryptSecret(passwordEnc) : null,
    from,
  };
}

/** Admin-UI-safe view of the current settings — the real password is never
 * sent to the browser, only whether one is set. */
export async function getSmtpSettingsForDisplay(): Promise<SmtpSettingsForDisplay> {
  const settings = await getSmtpSettings();
  if (!settings) {
    return { host: "", port: 587, secure: false, user: null, from: null, hasPassword: false };
  }
  return {
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    user: settings.user,
    from: settings.from,
    hasPassword: !!settings.password,
  };
}

export async function saveSmtpSettings(input: SmtpSettingsInput): Promise<void> {
  await setAdminSetting("smtpHost", input.host);
  await setAdminSetting("smtpPort", String(input.port));
  await setAdminSetting("smtpSecure", input.secure ? "true" : "false");
  await setAdminSetting("smtpUser", input.user);
  await setAdminSetting("smtpFrom", input.from);
  if (input.password && input.password.trim().length > 0) {
    await setAdminSetting("smtpPasswordEnc", encryptSecret(input.password.trim()));
  }
}
