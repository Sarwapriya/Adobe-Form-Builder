import { Router, type Request } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { parsePositiveInt } from "../utils/queryParsing";
import { requireAdmin } from "../middleware/authJwt";
import { validateBody } from "../middleware/validate";
import {
  buildSubsidiaryZip,
  buildUploadZip,
  getUploadHistorySummary,
  listUploadHistoryForAdmin,
  listUploadsForAdmin,
  listVersionsForSubsidiary,
  type AdminListFilters,
} from "../services/adminUploadService";
import { computeDiff } from "../services/diffService";
import { createUser } from "../services/authService";
import { buildUploadPreview, type PreviewVariant } from "../services/previewService";
import { createProjectCode, listProjectCodes, setProjectCodeOpen } from "../services/projectCodeService";
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

function parseListFilters(req: Request): AdminListFilters {
  return {
    subsidiaryId: typeof req.query.subsidiaryId === "string" ? req.query.subsidiaryId : undefined,
    projectCode: typeof req.query.projectCode === "string" ? req.query.projectCode : undefined,
    userId: typeof req.query.userId === "string" ? req.query.userId : undefined,
    status: isUploadStatus(req.query.status) ? req.query.status : undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    page: parsePositiveInt(req.query.page),
    pageSize: parsePositiveInt(req.query.pageSize),
    sortBy: isAdminSortBy(req.query.sortBy) ? req.query.sortBy : undefined,
    sortDir: req.query.sortDir === "ASC" || req.query.sortDir === "DESC" ? req.query.sortDir : undefined,
  };
}

adminRouter.get(
  "/uploads",
  asyncHandler(async (req, res) => {
    const result = await listUploadsForAdmin(parseListFilters(req));
    res.json(result);
  })
);

// Every upload that ever reached a final state (submitted or failed) across
// every user — the audit trail behind the main dashboard's submitted-only
// view. See adminUploadService.ts's HISTORY_STATUSES.
adminRouter.get(
  "/history",
  asyncHandler(async (req, res) => {
    const result = await listUploadHistoryForAdmin(parseListFilters(req));
    res.json(result);
  })
);

// Status breakdown for the "All history" page's summary tiles — respects the
// same subsidiary/projectCode/search filters as /history, but deliberately
// ignores its `status` filter so all three counts stay meaningful regardless
// of which status the admin currently has selected there.
adminRouter.get(
  "/history/summary",
  asyncHandler(async (req, res) => {
    const summary = await getUploadHistorySummary(parseListFilters(req));
    res.json(summary);
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
  "/preview/:uploadId",
  asyncHandler(async (req, res) => {
    const variant: PreviewVariant = req.query.variant === "oc" ? "oc" : "ff";
    const result = await buildUploadPreview(req.params.uploadId, variant);
    if (result.outcome === "not_found") {
      res.status(404).json({ error: "upload not found" });
      return;
    }
    if (result.outcome === "no_files") {
      res.status(409).json({ error: "this upload has no generated files yet" });
      return;
    }
    res.set("Content-Type", "text/html");
    res.send(result.html);
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

// Every project code (open and closed) — the admin management list. The
// upload form's own dropdown uses the open-only GET /api/v1/project-codes
// instead.
adminRouter.get(
  "/project-codes",
  asyncHandler(async (_req, res) => {
    const codes = await listProjectCodes();
    res.json(codes);
  })
);

const createProjectCodeSchema = z.object({
  code: z.string().trim().min(1),
});

adminRouter.post(
  "/project-codes",
  validateBody(createProjectCodeSchema),
  asyncHandler(async (req, res) => {
    const { code } = req.body as z.infer<typeof createProjectCodeSchema>;
    const created = await createProjectCode(code);
    res.status(201).json(created);
  })
);

const updateProjectCodeSchema = z.object({
  isOpen: z.boolean(),
});

// Closing a project code here is the only thing that blocks new uploads
// against it — see uploadService.createUpload's call to
// assertProjectCodeOpenForUpload. It does not affect uploads already made
// under that code.
adminRouter.patch(
  "/project-codes/:id",
  validateBody(updateProjectCodeSchema),
  asyncHandler(async (req, res) => {
    const { isOpen } = req.body as z.infer<typeof updateProjectCodeSchema>;
    const updated = await setProjectCodeOpen(req.params.id, isOpen);
    if (!updated) {
      res.status(404).json({ error: "project code not found" });
      return;
    }
    res.json(updated);
  })
);

const createUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "standard"]),
  // Scopes a standard user to one subsidiary — see User.subsidiaryId's own
  // doc comment. Optional: a standard user with none behaves as before
  // (free-text Subsidiary field), and it's meaningless on an admin account.
  subsidiaryId: z.string().trim().min(1).optional(),
});

// There is no self-service signup — admins provision every account, including
// other admins, through this endpoint.
adminRouter.post(
  "/users",
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof createUserSchema>;
    const user = await createUser(input);
    res
      .status(201)
      .json({ id: user.id, username: user.username, email: user.email, role: user.role, subsidiaryId: user.subsidiaryId });
  })
);
