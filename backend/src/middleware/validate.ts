import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

/**
 * Express middleware factory: parses `req.body` against a Zod schema, and
 * either replaces `req.body` with the parsed (and thus type-safe) result and
 * calls `next()`, or responds 400 with a structured validation error —
 * replacing the ad-hoc `typeof x !== "string"` checks that used to live
 * directly in route handlers with one consistent, declarative pattern.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: "validation failed", details: result.error.flatten() });
      return;
    }
    req.body = result.data;
    next();
  };
}
