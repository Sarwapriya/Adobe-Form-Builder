import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { IsNull } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { User, type UserRole } from "../entities/User";
import { RefreshToken } from "../entities/RefreshToken";
import { requireEnv } from "../utils/env";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
/** Exported so auth.router.ts can set the refresh cookie's `maxAge` to the same
 * value the token itself is issued for — one source of truth for the TTL. */
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BCRYPT_SALT_ROUNDS = 10;

/** The claims carried by the access token, and what `req.auth` is typed as
 * once `requireAuth` verifies it (see middleware/authJwt.ts). */
export interface AccessTokenPayload {
  sub: string;
  username: string;
  role: UserRole;
}

/**
 * Looks up a user by username and verifies the given plaintext password against
 * their stored bcrypt hash. Returns null on any failure (unknown username,
 * inactive account, wrong password) — deliberately without distinguishing which,
 * so a login failure never reveals whether a given username exists.
 */
export async function validateCredentials(username: string, password: string): Promise<User | null> {
  const user = await AppDataSource.getRepository(User).findOne({ where: { username, isActive: true } });
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

/** Short-lived (15 min), stateless — verified by signature/expiry only, never
 * checked against the database. Carries the claims `requireAuth`/`requireAdmin`
 * read from `req.auth`. */
export function issueAccessToken(user: User): string {
  const payload: AccessTokenPayload = { sub: user.id, username: user.username, role: user.role };
  return jwt.sign(payload, requireEnv("JWT_SECRET"), { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

/**
 * Issues a new refresh token for a user: a random 48-byte value, returned to the
 * caller so it can be set as an httpOnly cookie, but persisted here only as its
 * SHA-256 hash — the raw value is never stored, so a database read alone can't
 * be used to impersonate a session.
 */
export async function issueRefreshToken(user: User, ip?: string): Promise<string> {
  const rawToken = crypto.randomBytes(48).toString("hex");
  const repo = AppDataSource.getRepository(RefreshToken);
  const refreshToken = repo.create({
    userId: user.id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    revokedAt: null,
    createdByIp: ip ?? null,
  });
  await repo.save(refreshToken);
  return rawToken;
}

/**
 * Validates a presented refresh token and, if valid, rotates it: the old token
 * is revoked (single-use) and a brand-new access/refresh pair is issued. Returns
 * null if the token is missing, unknown, already revoked, expired, or its owning
 * user has since been deactivated.
 */
export async function rotateRefreshToken(
  rawToken: string,
  ip?: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const repo = AppDataSource.getRepository(RefreshToken);
  const record = await repo.findOne({ where: { tokenHash: hashToken(rawToken), revokedAt: IsNull() } });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    return null;
  }

  record.revokedAt = new Date();
  await repo.save(record);

  const user = await AppDataSource.getRepository(User).findOne({ where: { id: record.userId, isActive: true } });
  if (!user) return null;

  return {
    accessToken: issueAccessToken(user),
    refreshToken: await issueRefreshToken(user, ip),
  };
}

/** Revokes a refresh token (logout). A no-op if the token is unknown or already
 * revoked — logout should never fail visibly to the caller either way. */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await AppDataSource.getRepository(RefreshToken).update({ tokenHash: hashToken(rawToken) }, { revokedAt: new Date() });
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

/**
 * Creates a new user account. There is no self-service signup in this system —
 * accounts are provisioned by an admin via POST /api/v1/admin/users — so this is
 * the only place a User row is ever inserted outside the one-time seed script.
 * The plaintext password is hashed here and never persisted or logged.
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
  const repo = AppDataSource.getRepository(User);
  const user = repo.create({
    username: input.username,
    email: input.email,
    passwordHash,
    role: input.role,
    isActive: true,
  });
  return repo.save(user);
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
