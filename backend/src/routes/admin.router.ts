import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { parsePositiveInt } from "../utils/queryParsing";
import { requireAdmin } from "../middleware/authJwt";
import { validateBody } from "../middleware/validate";
import {
  buildSubsidiaryZip,
  buildUploadZip,
  listUploadsForAdmin,
  listVersionsForSubsidiary,
  type AdminListFilters,
} from "../services/adminUploadService";
import { computeDiff } from "../services/diffService";
import { createUser } from "../services/authService";
import type { UploadStatus } from "../entities/Upload";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

const UPLOAD_STATUS_VALUES = new Set<UploadStatus>(["uploaded", "generated", "submitted", "failed"]);
function isUploadStatus(value: unknown): value is UploadStatus {
  return typeof value === "string" && UPLOAD_STATUS_VALUES.has(value as UploadStatus);
}

const ADMIN_SORT_BY_VALUES = new Set(["uploadDate", "subsidiaryId", "status", "version", "fileName"]);
function isAdminSortBy(value: unknown): value is NonNullable<AdminListFilters["sortBy"]> {
  return typeof value === "string" && ADMIN_SORT_BY_VALUES.has(value);
}

adminRouter.get(
  "/uploads",
  asyncHandler(async (req, res) => {
    const filters: AdminListFilters = {
      subsidiaryId: typeof req.query.subsidiaryId === "string" ? req.query.subsidiaryId : undefined,
      userId: typeof req.query.userId === "string" ? req.query.userId : undefined,
      status: isUploadStatus(req.query.status) ? req.query.status : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      page: parsePositiveInt(req.query.page),
      pageSize: parsePositiveInt(req.query.pageSize),
      sortBy: isAdminSortBy(req.query.sortBy) ? req.query.sortBy : undefined,
      sortDir: req.query.sortDir === "ASC" || req.query.sortDir === "DESC" ? req.query.sortDir : undefined,
    };

    const result = await listUploadsForAdmin(filters);
    res.json(result);
  })
);

adminRouter.get(
  "/subsidiary/:name",
  asyncHandler(async (req, res) => {
    const versions = await listVersionsForSubsidiary(req.params.name);
    res.json(versions);
  })
);

adminRouter.get(
  "/download/:uploadId",
  asyncHandler(async (req, res) => {
    const result = await buildUploadZip(req.params.uploadId);
    if (result.outcome === "not_found") {
      res.status(404).json({ error: "upload not found" });
      return;
    }
    if (result.outcome === "no_files") {
      res.status(409).json({ error: "this upload has no generated files yet" });
      return;
    }
    res.set("Content-Type", "application/zip");
    res.set("Content-Disposition", `attachment; filename="${result.fileName}"`);
    res.send(Buffer.from(result.buffer!));
  })
);

adminRouter.get(
  "/download/subsidiary/:name",
  asyncHandler(async (req, res) => {
    const version = parsePositiveInt(req.query.version);
    const result = await buildSubsidiaryZip(req.params.name, version);
    if (result.outcome === "not_found") {
      res.status(404).json({ error: "no matching upload found for this subsidiary" });
      return;
    }
    if (result.outcome === "no_files") {
      res.status(409).json({ error: "this upload has no generated files yet" });
      return;
    }
    res.set("Content-Type", "application/zip");
    res.set("Content-Disposition", `attachment; filename="${result.fileName}"`);
    res.send(Buffer.from(result.buffer!));
  })
);

adminRouter.get(
  "/diff",
  asyncHandler(async (req, res) => {
    const { oldFileId, newFileId } = req.query;
    if (typeof oldFileId !== "string" || typeof newFileId !== "string") {
      res.status(400).json({ error: "oldFileId and newFileId query params are required" });
      return;
    }

    const diff = await computeDiff(oldFileId, newFileId);
    res.json(diff);
  })
);

const createUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "standard"]),
});

// There is no self-service signup — admins provision every account, including
// other admins, through this endpoint.
adminRouter.post(
  "/users",
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof createUserSchema>;
    const user = await createUser(input);
    res.status(201).json({ id: user.id, username: user.username, email: user.email, role: user.role });
  })
);
