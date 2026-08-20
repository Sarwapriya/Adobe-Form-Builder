import crypto from "crypto";
import { requireEnv } from "./env";

/** Derives a 32-byte AES key from JWT_SECRET (already required for the app to
 * run at all) rather than introducing a second required secret just for
 * encrypting admin-configured values like the SMTP password at rest. */
function deriveKey(): Buffer {
  return crypto.createHash("sha256").update(requireEnv("JWT_SECRET")).digest();
}

/** Encrypts a short secret (e.g. an SMTP password) for storage in a plain
 * key/value settings table. Output is "<iv-b64>.<tag-b64>.<ciphertext-b64>" —
 * comfortably under AdminSetting.value's 255-char column for any realistic
 * password. */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((b) => b.toString("base64")).join(".");
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", deriveKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}
