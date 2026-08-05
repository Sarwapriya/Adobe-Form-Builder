import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/authJwt";
import { authRateLimiter } from "../middleware/rateLimit";
import { issueCsrfCookie, requireCsrfToken } from "../middleware/csrf";
import { validateBody } from "../middleware/validate";
import {
  issueAccessToken,
  issueRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  validateCredentials,
  REFRESH_TOKEN_TTL_MS,
} from "../services/authService";
import { cleanupUnsubmittedUploads } from "../services/uploadCleanupService";

export const authRouter = Router();

const REFRESH_COOKIE_NAME = "refreshToken";
// Scoped so the browser only ever sends this cookie back to the auth endpoints
// that actually need it, not every request to the API.
const REFRESH_COOKIE_PATH = "/api/v1/auth";

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    // Only requires HTTPS in production — local HTTP development would never
    // receive the cookie back if this were unconditionally true.
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post(
  "/login",
  authRateLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body as z.infer<typeof loginSchema>;

    const user = await validateCredentials(username, password);
    if (!user) {
      res.status(401).json({ error: "invalid credentials" });
      return;
    }

    // Purge this user's never-submitted uploads from a previous session before
    // they see their upload history again — see uploadCleanupService.ts.
    await cleanupUnsubmittedUploads(user.id);

    const accessToken = issueAccessToken(user);
    const refreshToken = await issueRefreshToken(user, req.ip);
    setRefreshCookie(res, refreshToken);
    issueCsrfCookie(res);

    res.json({
      accessToken,
      user: { id: user.id, username: user.username, role: user.role, subsidiaryId: user.subsidiaryId },
    });
  }),
);

authRouter.post(
  "/refresh",
  authRateLimiter,
  requireCsrfToken,
  asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (typeof rawToken !== "string") {
      res.status(401).json({ error: "no refresh token presented" });
      return;
    }

    const rotated = await rotateRefreshToken(rawToken, req.ip);
    if (!rotated) {
      clearRefreshCookie(res);
      res.status(401).json({ error: "invalid or expired refresh token" });
      return;
    }

    setRefreshCookie(res, rotated.refreshToken);
    issueCsrfCookie(res);
    res.json({ accessToken: rotated.accessToken });
  }),
);

authRouter.post(
  "/logout",
  requireAuth,
  requireCsrfToken,
  asyncHandler(async (req: Request, res: Response) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (typeof rawToken === "string") {
      await revokeRefreshToken(rawToken);
    }
    clearRefreshCookie(res);
    res.status(204).send();
  }),
);
