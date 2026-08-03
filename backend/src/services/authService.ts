import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * The schema only defines Uploads/AdminSettings, no user table, so this
 * validates against a single hardcoded admin credential (env vars) and
 * always issues one token shape `{ sub: "admin", admin: true }`. That same
 * token is reused by non-admin endpoints, which only require *a* valid JWT.
 */
export function validateCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USER;
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;
  if (!expectedUser || !expectedHash) {
    throw new Error("ADMIN_USER / ADMIN_PASSWORD_HASH are not configured");
  }
  if (username !== expectedUser) return false;
  return bcrypt.compareSync(password, expectedHash);
}

export function issueToken(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign({ sub: "admin", admin: true }, secret, { expiresIn: "8h" });
}
