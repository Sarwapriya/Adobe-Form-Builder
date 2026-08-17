import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { UnauthorizedError as JwtUnauthorizedError } from "express-jwt";
import {
  UnsupportedFileTypeError,
  NotFoundError,
  ConflictError,
  ProjectCodeClosedError,
  ProjectCodeLockedError,
  SubsidiaryInactiveError,
  SubsidiaryProjectBlockedError,
  ProjectCodeMismatchError,
  SubsidiaryMismatchError,
  ValidationError,
} from "../utils/errors";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    res.status(status).json({ error: err.message });
    return;
  }

  if (
    err instanceof UnsupportedFileTypeError ||
    err instanceof ProjectCodeMismatchError ||
    err instanceof SubsidiaryMismatchError ||
    err instanceof ValidationError
  ) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }

  if (
    err instanceof ConflictError ||
    err instanceof ProjectCodeClosedError ||
    err instanceof ProjectCodeLockedError ||
    err instanceof SubsidiaryInactiveError ||
    err instanceof SubsidiaryProjectBlockedError
  ) {
    res.status(409).json({ error: err.message });
    return;
  }

  if (err instanceof JwtUnauthorizedError) {
    res.status(401).json({ error: "invalid or missing token" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "internal server error" });
}
