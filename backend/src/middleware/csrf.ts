import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const CSRF_COOKIE_NAME = "csrfToken";

/**
 * Issues a fresh CSRF token as a *readable* (non-httpOnly) cookie — the
 * frontend reads this cookie's value directly (`document.cookie`) and echoes
 * it back in the `X-CSRF-Token` header on every request (see
 * src/api/apiClient.ts). `requireCsrfToken` below then checks the two match.
 *
 * This is the standard "double-submit cookie" pattern: a cross-site page can
 * trick a browser into *sending* the refresh-token cookie automatically, but
 * it cannot *read* this cookie's value (browsers enforce same-origin on
 * `document.cookie`) to put it in the header — so it can't produce a request
 * that passes this check. Deliberately Path=/ (unlike the refresh-token
 * cookie's Path=/api/v1/auth) — it must be readable via `document.cookie`
 * from the frontend's own pages (/, /login, /admin, ...), which live at
 * completely different paths than the backend's routes.
 */
export function issueCsrfCookie(res: Response): void {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
}

/** Verifies the `X-CSRF-Token` header matches the `csrfToken` cookie — the
 * "double submit" check itself. Requires `issueCsrfCookie` to have run
 * earlier in the session (on login, and again on every refresh). */
export function requireCsrfToken(req: Request, res: Response, next: NextFunction): void {
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers["x-csrf-token"];
  if (typeof cookieToken !== "string" || typeof headerToken !== "string" || cookieToken !== headerToken) {
    res.status(403).json({ error: "invalid or missing CSRF token" });
    return;
  }
  next();
}
