import { getAdminSetting, setAdminSetting } from "./adminSettingsService";

/**
 * DB-stored connection config for the Adobe Campaign SFTP deployment target
 * used by sftpService.ts (fired on every Publish/Deploy — see
 * formBuilderService.publishForm), admin-managed via Configuration >
 * Deployment. Mirrors fabrixSettingsService.ts's AdminSetting-row-per-field
 * convention, minus the encryption — nothing stored here is a secret in
 * itself, just a host/username/local-file-path/remote-path, unlike FabriX's
 * bearer tokens.
 *
 * Two independent targets ("staging"/"production") are always both stored;
 * `activeEnvironment` picks which one sftpService.ts actually deploys to.
 * `privateKeyPath` is a path on whichever machine runs the backend, not the
 * key's contents — the key file itself never leaves that machine's disk and
 * is never stored in this table or committed to the repo.
 */
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

const DEFAULT_PORT = 22;
const DEFAULT_REMOTE_PATH = "/incoming/ACC/Operations/LocalHR/DWF/ToProcess";

function settingKeyPrefix(environment: SftpEnvironment): string {
  return environment === "staging" ? "sftpStaging" : "sftpProduction";
}

async function getTarget(environment: SftpEnvironment): Promise<SftpTargetConfig> {
  const prefix = settingKeyPrefix(environment);
  const [host, port, username, privateKeyPath, remotePath] = await Promise.all([
    getAdminSetting(`${prefix}Host`),
    getAdminSetting(`${prefix}Port`),
    getAdminSetting(`${prefix}Username`),
    getAdminSetting(`${prefix}PrivateKeyPath`),
    getAdminSetting(`${prefix}RemotePath`),
  ]);
  return {
    host: host ?? "",
    port: Number(port) || DEFAULT_PORT,
    username: username ?? "",
    privateKeyPath: privateKeyPath ?? "",
    remotePath: remotePath ?? DEFAULT_REMOTE_PATH,
  };
}

export async function getSftpDeploymentSettings(): Promise<SftpDeploymentSettings> {
  const [activeRaw, staging, production] = await Promise.all([
    getAdminSetting("sftpActiveEnvironment"),
    getTarget("staging"),
    getTarget("production"),
  ]);
  const activeEnvironment: SftpEnvironment = activeRaw === "production" ? "production" : "staging";
  return { activeEnvironment, staging, production };
}

export async function saveSftpTarget(environment: SftpEnvironment, input: SftpTargetConfig): Promise<void> {
  const prefix = settingKeyPrefix(environment);
  await Promise.all([
    setAdminSetting(`${prefix}Host`, input.host),
    setAdminSetting(`${prefix}Port`, String(input.port || DEFAULT_PORT)),
    setAdminSetting(`${prefix}Username`, input.username),
    setAdminSetting(`${prefix}PrivateKeyPath`, input.privateKeyPath),
    setAdminSetting(`${prefix}RemotePath`, input.remotePath || DEFAULT_REMOTE_PATH),
  ]);
}

export async function setActiveSftpEnvironment(environment: SftpEnvironment): Promise<void> {
  await setAdminSetting("sftpActiveEnvironment", environment);
}

/** The currently-active environment's config, or null if that environment's
 * required fields (host/username/privateKeyPath) aren't all filled in yet —
 * sftpService.deployGeneratedFiles treats null as "not configured." */
export async function getActiveSftpTarget(): Promise<SftpTargetConfig | null> {
  const settings = await getSftpDeploymentSettings();
  const target = settings.activeEnvironment === "production" ? settings.production : settings.staging;
  if (!target.host || !target.username || !target.privateKeyPath) return null;
  return target;
}
