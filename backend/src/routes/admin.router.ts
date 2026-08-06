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
import { createUser, findUserById, listUsers, setUserActive } from "../services/authService";
import { buildUploadPreview, type PreviewVariant } from "../services/previewService";
import { createProjectCode, listProjectCodes, setProjectCodeOpen } from "../services/projectCodeService";
import { createSubsidiary, deleteSubsidiary, listSubsidiaries, setSubsidiaryActive } from "../services/subsidiaryService";
import {
  createSubsidiaryProjectBlock,
  deleteSubsidiaryProjectBlock,
  listSubsidiaryProjectBlocks,
} from "../services/subsidiaryProjectBlockService";
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

// Every subsidiary, active and inactive alike — the admin management list.
// The upload/user-creation forms' own dropdowns use the active-only
// GET /api/v1/subsidiaries instead.
adminRouter.get(
  "/subsidiaries",
  asyncHandler(async (_req, res) => {
    const subsidiaries = await listSubsidiaries();
    res.json(subsidiaries);
  })
);

const createSubsidiarySchema = z.object({
  name: z.string().trim().min(1),
});

adminRouter.post(
  "/subsidiaries",
  validateBody(createSubsidiarySchema),
  asyncHandler(async (req, res) => {
    const { name } = req.body as z.infer<typeof createSubsidiarySchema>;
    const created = await createSubsidiary(name);
    res.status(201).json(created);
  })
);

const updateSubsidiarySchema = z.object({
  isActive: z.boolean(),
});

// Disabling a subsidiary here is the reversible way to block *every* project
// for it in one step — see uploadService.createUpload's call to
// assertSubsidiaryActiveForUpload. Independent of, and layered above,
// /subsidiary-project-blocks below (a single project-scoped restriction). It
// does not affect uploads already made under that subsidiary.
adminRouter.patch(
  "/subsidiaries/:id",
  validateBody(updateSubsidiarySchema),
  asyncHandler(async (req, res) => {
    const { isActive } = req.body as z.infer<typeof updateSubsidiarySchema>;
    const updated = await setSubsidiaryActive(req.params.id, isActive);
    if (!updated) {
      res.status(404).json({ error: "subsidiary not found" });
      return;
    }
    res.json(updated);
  })
);

// Permanently removes a subsidiary (and any restrictions naming it) — the
// irreversible alternative to disabling it above. Uploads/users already
// scoped to it keep their own (denormalized) subsidiary value regardless —
// see subsidiaryService.deleteSubsidiary.
adminRouter.delete(
  "/subsidiaries/:id",
  asyncHandler(async (req, res) => {
    const deleted = await deleteSubsidiary(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "subsidiary not found" });
      return;
    }
    res.status(204).send();
  })
);

// Every (subsidiary, project code) pair currently blocked from new uploads —
// e.g. "F2H26" closed for "SGE" specifically, while every other subsidiary
// can still upload it. Independent of, and layered on top of, a project
// code's own global open/closed state.
adminRouter.get(
  "/subsidiary-project-blocks",
  asyncHandler(async (_req, res) => {
    const blocks = await listSubsidiaryProjectBlocks();
    res.json(blocks);
  })
);

const createSubsidiaryProjectBlockSchema = z.object({
  subsidiaryName: z.string().trim().min(1),
  projectCode: z.string().trim().min(1),
});

adminRouter.post(
  "/subsidiary-project-blocks",
  validateBody(createSubsidiaryProjectBlockSchema),
  asyncHandler(async (req, res) => {
    const { subsidiaryName, projectCode } = req.body as z.infer<typeof createSubsidiaryProjectBlockSchema>;
    const created = await createSubsidiaryProjectBlock(subsidiaryName, projectCode);
    res.status(201).json(created);
  })
);

// Unblocking (deleting the row) is the only thing that lets a subsidiary
// upload that project code again — see uploadService.createUpload's call to
// subsidiaryProjectBlockService.assertNotBlocked.
adminRouter.delete(
  "/subsidiary-project-blocks/:id",
  asyncHandler(async (req, res) => {
    const deleted = await deleteSubsidiaryProjectBlock(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "block not found" });
      return;
    }
    res.status(204).send();
  })
);

// Every provisioned account (never includes passwordHash — see
// authService.listUsers) for the User Management page's list.
adminRouter.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await listUsers();
    res.json(users);
  })
);

const createUserSchema = z
  .object({
    username: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["admin", "standard", "superadmin"]),
    // Scopes a standard user to one subsidiary — see User.subsidiaryId's own
    // doc comment. Required for "standard" (below) — meaningless (an admin
    // is never restricted to one subsidiary) and so left optional for
    // "admin"/"superadmin".
    subsidiaryId: z.string().trim().min(1).optional(),
  })
  // A standard user with no subsidiary would fall back to the free-text
  // Subsidiary field on every upload, defeating the point of subsidiary
  // scoping — so it's required at creation time, not just optional metadata.
  .refine((data) => data.role !== "standard" || !!data.subsidiaryId, {
    message: "Subsidiary is required for a standard user",
    path: ["subsidiaryId"],
  });

// There is no self-service signup — admins provision every account through
// this endpoint. A plain "admin" may only provision "standard" users; only a
// "superadmin" may provision another "admin" or "superadmin" (requireAdmin
// above already let both roles through, since this check is finer-grained
// than route-level access).
adminRouter.post(
  "/users",
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof createUserSchema>;
    if (req.auth!.role !== "superadmin" && input.role !== "standard") {
      res.status(403).json({ error: "only a superadmin may provision an admin or superadmin account" });
      return;
    }
    const user = await createUser(input);
    res
      .status(201)
      .json({ id: user.id, username: user.username, email: user.email, role: user.role, subsidiaryId: user.subsidiaryId });
  })
);

const updateUserActiveSchema = z.object({
  isActive: z.boolean(),
});

// Disabling an account blocks new logins immediately (enforced server-side —
// see authService.setUserActive); it does not touch anything that account
// has already uploaded/submitted. Same role-based restriction as account
// creation: a plain "admin" may only enable/disable "standard" accounts,
// only a "superadmin" may act on an "admin" or "superadmin" account — and
// nobody may disable their own account, to avoid locking themselves out of
// the admin panel with no other admin present.
adminRouter.patch(
  "/users/:id",
  validateBody(updateUserActiveSchema),
  asyncHandler(async (req, res) => {
    const { isActive } = req.body as z.infer<typeof updateUserActiveSchema>;

    if (req.params.id === req.auth!.sub) {
      res.status(403).json({ error: "you cannot disable your own account" });
      return;
    }

    const target = await findUserById(req.params.id);
    if (!target) {
      res.status(404).json({ error: "user not found" });
      return;
    }
    if (req.auth!.role !== "superadmin" && target.role !== "standard") {
      res.status(403).json({ error: "only a superadmin may enable/disable an admin or superadmin account" });
      return;
    }

    const updated = await setUserActive(req.params.id, isActive);
    res.json({
      id: updated!.id,
      username: updated!.username,
      email: updated!.email,
      role: updated!.role,
      subsidiaryId: updated!.subsidiaryId,
      isActive: updated!.isActive,
    });
  })
);
