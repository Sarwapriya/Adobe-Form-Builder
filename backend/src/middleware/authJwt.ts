import { expressjwt } from "express-jwt";
import type { NextFunction, Request, Response } from "express";
import { requireEnv } from "../utils/env";
import { isAdminRole } from "../entities/User";

/** Requires a valid JWT (any claims). Populates `req.auth` with the
 * `AccessTokenPayload` shape (see types/express.d.ts and services/authService.ts). */
export const requireAuth = expressjwt({
  secret: () => requireEnv("JWT_SECRET"),
  algorithms: ["HS256"],
});

/** Requires a valid JWT whose `role` claim is `"admin"` or `"superadmin"` —
 * see User.isAdminRole. */
export const requireAdmin = [
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.auth && isAdminRole(req.auth.role)) {
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
