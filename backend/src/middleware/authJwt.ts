import { expressjwt } from "express-jwt";
import type { NextFunction, Request, Response } from "express";
import { requireEnv } from "../utils/env";

/** Requires a valid JWT (any claims). Populates `req.auth` with the
 * `AccessTokenPayload` shape (see types/express.d.ts and services/authService.ts). */
export const requireAuth = expressjwt({
  secret: () => requireEnv("JWT_SECRET"),
  algorithms: ["HS256"],
});

/** Requires a valid JWT whose `role` claim is `"admin"`. */
export const requireAdmin = [
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.auth?.role === "admin") {
      next();
      return;
    }
    res.status(403).json({ error: "admin role required" });
  },
];

/** Verifies a JWT if present, but proceeds unauthenticated if absent. */
export const optionalAuth = expressjwt({
  secret: () => requireEnv("JWT_SECRET"),
  algorithms: ["HS256"],
  credentialsRequired: false,
});
