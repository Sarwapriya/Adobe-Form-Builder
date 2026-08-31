import fs from "node:fs";
import SftpClient from "ssh2-sftp-client";
import { getActiveSftpTarget } from "./sftpSettingsService";

/**
 * Pushes a just-published form's generated output files to the currently
 * active SFTP deployment target (Configuration > Deployment — see
 * sftpSettingsService.ts for the staging/production config this reads).
 * Mirrors fabrixAIService.ts's shape: one entry point
 * (`deployGeneratedFiles`), never throws, normalizes every failure into
 * `{ok: false, error}`, and never logs the private key's path or contents —
 * only host/username/remote path/file count, matching the logging
 * discipline emailService.ts follows for SMTP creds.
 *
 * The configured host is normally only reachable from the office
 * network/VPN — a failure here (timeout, ECONNREFUSED, ENOTFOUND) is
 * expected and non-fatal; formBuilderService.publishForm treats it as
 * best-effort and still reports the publish itself as successful.
 */

export interface SftpDeployFile {
  /** Absolute local path of the already-generated file on disk. */
  absolutePath: string;
  /** File name to use on the remote server. */
  remoteFileName: string;
}

export type SftpDeployResult = { ok: true; filesDeployed: number } | { ok: false; error: string };

/** Uploads every given file to the active target's remote directory over
 * SFTP, connecting with its configured local private key file. Returns
 * `{ok: false}` (never throws) if no environment is fully configured, the
 * key file is missing, or the connection/transfer fails for any reason. */
export async function deployGeneratedFiles(files: SftpDeployFile[]): Promise<SftpDeployResult> {
  const target = await getActiveSftpTarget();
  if (!target) {
    return { ok: false, error: "SFTP deployment is not configured for the active environment (Configuration > Deployment)" };
  }
  if (!fs.existsSync(target.privateKeyPath)) {
    return { ok: false, error: "SFTP private key file not found at the configured local path" };
  }
  if (files.length === 0) {
    return { ok: true, filesDeployed: 0 };
  }

  const client = new SftpClient();
  const logContext = { host: target.host, username: target.username, remotePath: target.remotePath, fileCount: files.length };
  try {
    const privateKey = fs.readFileSync(target.privateKeyPath);
    await client.connect({
      host: target.host,
      port: target.port,
      username: target.username,
      privateKey,
      readyTimeout: 15000,
    });

    await client.mkdir(target.remotePath, true).catch(() => undefined);

    for (const file of files) {
      const remoteFilePath = `${target.remotePath.replace(/\/+$/, "")}/${file.remoteFileName}`;
      await client.put(file.absolutePath, remoteFilePath);
    }

    console.log("[sftpService] deploy succeeded", logContext);
    return { ok: true, filesDeployed: files.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown SFTP error";
    console.error("[sftpService] deploy failed", { ...logContext, error: message });
    return { ok: false, error: message };
  } finally {
    await client.end().catch(() => undefined);
  }
}
