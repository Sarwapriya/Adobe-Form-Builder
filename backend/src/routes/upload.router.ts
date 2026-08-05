import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { parsePositiveInt } from "../utils/queryParsing";
import { requireAuth } from "../middleware/authJwt";
import { validateBody } from "../middleware/validate";
import { uploadMiddleware } from "../services/fileService";
import {
  createUpload,
  getUploadDetail,
  listUploadsForUser,
  softDeleteUpload,
  type ListOptions,
} from "../services/uploadService";

export const uploadRouter = Router();

uploadRouter.use(requireAuth);

const uploadBodySchema = z.object({
  subsidiaryId: z.string().trim().min(1),
  projectCode: z.string().trim().min(1),
  // Multipart fields are always strings — a JSON-encoded Record<questionId,
  // boolean> from the upload form's mandatory-questions configure step.
  requiredOverrides: z.string().optional(),
});

/** Best-effort parse of the requiredOverrides multipart field: malformed or
 * absent input is treated as "no overrides" rather than a request error,
 * since every question already defaults to required (QuestionDefinition's
 * own default) with no overrides at all. */
function parseRequiredOverrides(raw: string | undefined): Record<string, boolean> | undefined {
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    const result: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "boolean") result[key] = value;
    }
    return result;
  } catch {
    return undefined;
  }
}

uploadRouter.post(
  "/",
  uploadMiddleware.single("file"),
  validateBody(uploadBodySchema),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "file is required" });
      return;
    }

    const { subsidiaryId, projectCode, requiredOverrides } = req.body as z.infer<typeof uploadBodySchema>;

    // A subsidiary-scoped standard user's uploads always use their own
    // assigned subsidiary — the client's Subsidiary field is locked to the
    // same value for them (see UploadHistoryPage.tsx), but the server never
    // trusts that alone: this overrides whatever the request body says,
    // rather than merely validating it, so a tampered request still can't
    // upload under a different subsidiary. Admins (and standard users with no
    // assigned subsidiary) use whatever the request body says.
    const effectiveSubsidiaryId =
      req.auth!.role !== "admin" && req.auth!.subsidiaryId ? req.auth!.subsidiaryId : subsidiaryId;

    const { upload, validation } = await createUpload({
      subsidiaryId: effectiveSubsidiaryId,
      projectCode,
      file: req.file,
      userId: req.auth!.sub,
      uploadedByUsername: req.auth!.username,
      requiredOverrides: parseRequiredOverrides(requiredOverrides),
    });

    res.status(201).json({ upload, validation });
  }),
);

uploadRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const options: ListOptions = {
      page: parsePositiveInt(req.query.page),
      pageSize: parsePositiveInt(req.query.pageSize),
      sortBy: isSortBy(req.query.sortBy) ? req.query.sortBy : undefined,
      sortDir: req.query.sortDir === "ASC" || req.query.sortDir === "DESC" ? req.query.sortDir : undefined,
    };

    const result = await listUploadsForUser(req.auth!.sub, options);
    res.json(result);
  }),
);

uploadRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const isAdmin = req.auth!.role === "admin";
    const detail = await getUploadDetail(req.params.id, req.auth!.sub, isAdmin);
    if (!detail) {
      res.status(404).json({ error: "upload not found" });
      return;
    }
    res.json(detail);
  }),
);

uploadRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const isAdmin = req.auth!.role === "admin";
    const result = await softDeleteUpload(req.params.id, req.auth!.sub, isAdmin);

    if (result === "not_found") {
      res.status(404).json({ error: "upload not found" });
      return;
    }
    if (result === "locked") {
      res.status(409).json({ error: "upload has already been submitted and cannot be deleted" });
      return;
    }
    res.status(204).send();
  }),
);

const SORT_BY_VALUES = new Set(["uploadDate", "subsidiaryId", "status", "version"]);
function isSortBy(value: unknown): value is NonNullable<ListOptions["sortBy"]> {
  return typeof value === "string" && SORT_BY_VALUES.has(value);
}
