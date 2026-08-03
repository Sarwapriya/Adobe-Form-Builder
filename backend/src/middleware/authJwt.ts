import { expressjwt } from "express-jwt";
import type { NextFunction, Request, Response } from "express";

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

/** Requires a valid JWT (any claims). Populates req.auth. */
export const requireAuth = expressjwt({
  secret: jwtSecret,
  algorithms: ["HS256"],
});

/** Requires a valid JWT that also carries `admin: true`. */
export const requireAdmin = [
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.auth?.admin === true) {
      next();
      return;
    }
    res.status(403).json({ error: "admin claim required" });
  },
];

/** Verifies a JWT if present, but proceeds unauthenticated if absent. */
export const optionalAuth = expressjwt({
  secret: jwtSecret,
  algorithms: ["HS256"],
  credentialsRequired: false,
});
