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
import {
  createUser,
  findUserById,
  listUsers,
  setUserActive,
  setUserNotificationEmails,
  updateUser,
} from "../services/authService";
import { buildUploadPreview, type PreviewVariant } from "../services/previewService";
import {
  createProjectCode,
  listProjectCodes,
  setProjectCodeDateRange,
  setProjectCodeLocked,
  setProjectCodeOpen,
  setProjectCodeValue,
} from "../services/projectCodeService";
import {
  createSubsidiary,
  deleteSubsidiary,
  listSubsidiaries,
  setSubsidiaryActive,
  setSubsidiaryNotificationEmails,
} from "../services/subsidiaryService";
import {
  createSubsidiaryProjectBlock,
  deleteSubsidiaryProjectBlock,
  listSubsidiaryProjectBlocks,
} from "../services/subsidiaryProjectBlockService";
import {
  addSubsidiaryLocale,
  listAllSubsidiaryLocales,
  removeSubsidiaryLocale,
} from "../services/subsidiaryLocaleService";
import { buildQaReportDownload, createQaRun, getQaRunDetail, listQaRunsForUpload } from "../services/qaRunService";
import { sendTestEmail } from "../services/emailService";
import { getSmtpSettingsForDisplay, saveSmtpSettings } from "../services/smtpSettingsService";
import { getFabrixSettingsForDisplay, saveFabrixSettings } from "../services/fabrixSettingsService";
import { sendMessage as sendFabrixMessage } from "../services/fabrixAIService";
import {
  generateQuestionMaster,
  generateQuestionMasterFromUploads,
  getReadiness as getQuestionMasterReadiness,
  getUploadReadiness as getQuestionMasterUploadReadiness,
  getVersionFile as getQuestionMasterVersionFile,
  listVersions as listQuestionMasterVersions,
} from "../services/questionMasterService";
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

// "YYYY-MM-DD", matching <input type="date">'s own value format.
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date string (YYYY-MM-DD)");

const createProjectCodeSchema = z.object({
  code: z.string().trim().min(1),
  // Purely descriptive campaign dates — see ProjectCode entity's own doc
  // comment; never enforced against uploads. cutoffDate is likewise not
  // enforced here, but is meaningful (drives the pending-approval reminder).
  startDate: dateStringSchema.nullable().optional(),
  endDate: dateStringSchema.nullable().optional(),
  cutoffDate: dateStringSchema.nullable().optional(),
});

adminRouter.post(
  "/project-codes",
  validateBody(createProjectCodeSchema),
  asyncHandler(async (req, res) => {
    const { code, startDate, endDate, cutoffDate } = req.body as z.infer<typeof createProjectCodeSchema>;
    const created = await createProjectCode(code, { startDate, endDate, cutoffDate });
    res.status(201).json(created);
  })
);

const updateProjectCodeSchema = z.object({
  code: z.string().trim().min(1).optional(),
  isOpen: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  startDate: dateStringSchema.nullable().optional(),
  endDate: dateStringSchema.nullable().optional(),
  cutoffDate: dateStringSchema.nullable().optional(),
});

// Closing a project code here blocks new uploads against it for everyone — see
// uploadService.createUpload's call to assertProjectCodeOpenForUpload. Locking it
// (isLocked) is a separate, more permanent freeze that only blocks non-admin
// uploads/contributions — see ProjectCode.isLocked's own doc comment. Neither affects
// uploads already made under that code. startDate/endDate are purely descriptive (see
// ProjectCode entity) and every field here is applied independently — any of them
// can be sent alone (e.g. the "click a chip to toggle" UI only ever sends isOpen or
// isLocked; the date-range editor only ever sends the dates; the rename field only
// ever sends code) or together. Renaming (code) never touches
// uploads already made under the old value — see setProjectCodeValue's own
// doc comment.
adminRouter.patch(
  "/project-codes/:id",
  validateBody(updateProjectCodeSchema),
  asyncHandler(async (req, res) => {
    const { code, isOpen, isLocked, ...dateRange } = req.body as z.infer<typeof updateProjectCodeSchema>;

    let updated = null;
    if (code !== undefined) {
      updated = await setProjectCodeValue(req.params.id, code);
    }
    if (isOpen !== undefined) {
      updated = await setProjectCodeOpen(req.params.id, isOpen);
    }
    if (isLocked !== undefined) {
      updated = await setProjectCodeLocked(req.params.id, isLocked);
    }
    if ("startDate" in dateRange || "endDate" in dateRange || "cutoffDate" in dateRange) {
      updated = await setProjectCodeDateRange(req.params.id, dateRange);
    }
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
  isActive: z.boolean().optional(),
  // Extra notification recipients (see Subsidiary entity's own doc comment) —
  // sent as "" from the UI to clear a slot, normalized to null here so an
  // empty string never fails the .email() check below.
  notificationEmail1: z.preprocess((v) => (v === "" ? null : v), z.string().email().nullable().optional()),
  notificationEmail2: z.preprocess((v) => (v === "" ? null : v), z.string().email().nullable().optional()),
});

// Disabling a subsidiary here is the reversible way to block *every* project
// for it in one step — see uploadService.createUpload's call to
// assertSubsidiaryActiveForUpload. Independent of, and layered above,
// /subsidiary-project-blocks below (a single project-scoped restriction). It
// does not affect uploads already made under that subsidiary. isActive and
// the notification emails are applied independently — either can be sent
// alone (the "click a chip to toggle" UI only ever sends isActive; the
// notification-email editor only ever sends those two fields) or together.
adminRouter.patch(
  "/subsidiaries/:id",
  validateBody(updateSubsidiarySchema),
  asyncHandler(async (req, res) => {
    const { isActive, ...emails } = req.body as z.infer<typeof updateSubsidiarySchema>;

    let updated = null;
    if (isActive !== undefined) {
      updated = await setSubsidiaryActive(req.params.id, isActive);
    }
    if ("notificationEmail1" in emails || "notificationEmail2" in emails) {
      updated = await setSubsidiaryNotificationEmails(req.params.id, emails);
    }
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

// The admin-managed master list of which locale codes each subsidiary's users
// may pick from — read by both admin's own Form Initiator (a convenience picker
// alongside free text) and a subsidiary user's own ad-hoc form builder
// (restricted, no free text — see subsidiaryLocale.router.ts's read-only GET).
adminRouter.get(
  "/subsidiary-locales",
  asyncHandler(async (_req, res) => {
    const locales = await listAllSubsidiaryLocales();
    res.json(locales);
  })
);

const createSubsidiaryLocaleSchema = z.object({
  subsidiaryName: z.string().trim().min(1),
  code: z
    .string()
    .trim()
    .regex(/^[a-zA-Z]{2,3}_[A-Z]{2}$/, 'Use the format "<lang>_<COUNTRY>", e.g. "ar_AE"'),
  langSubtag: z.string().trim().min(2).max(3),
  isRtl: z.boolean(),
  label: z.string().trim().min(1),
  isFallback: z.boolean(),
});

adminRouter.post(
  "/subsidiary-locales",
  validateBody(createSubsidiaryLocaleSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof createSubsidiaryLocaleSchema>;
    const created = await addSubsidiaryLocale(input);
    res.status(201).json(created);
  })
);

adminRouter.delete(
  "/subsidiary-locales/:id",
  asyncHandler(async (req, res) => {
    const deleted = await removeSubsidiaryLocale(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "locale not found" });
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

const updateUserProfileSchema = z.object({
  username: z.string().trim().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["admin", "standard", "superadmin"]).optional(),
  // null clears it, undefined (omit the key) leaves it as-is — same
  // "presence vs value" convention setUserNotificationEmails uses. Whether
  // clearing it is actually allowed (i.e. the resulting role isn't
  // "standard") is checked against the row's *existing* state in
  // authService.updateUser, not here, since a zod schema only sees this
  // request's own body.
  subsidiaryId: z.string().trim().min(1).nullable().optional(),
});

// Full account-details edit (username/email/role/subsidiary) — superadmin
// only, any target including themselves. Deliberately stricter than
// setUserActive's own admin-may-manage-standard-users split above: changing
// someone's role or login identity is a bigger lever than a reversible
// enable/disable toggle, so it stays superadmin-only regardless of the
// target's role.
adminRouter.patch(
  "/users/:id/profile",
  validateBody(updateUserProfileSchema),
  asyncHandler(async (req, res) => {
    if (req.auth!.role !== "superadmin") {
      res.status(403).json({ error: "only a superadmin may update another user's account details" });
      return;
    }

    const input = req.body as z.infer<typeof updateUserProfileSchema>;
    const updated = await updateUser(req.params.id, input);
    if (!updated) {
      res.status(404).json({ error: "user not found" });
      return;
    }
    res.json({
      id: updated.id,
      username: updated.username,
      email: updated.email,
      role: updated.role,
      subsidiaryId: updated.subsidiaryId,
      isActive: updated.isActive,
      notificationEmail: updated.notificationEmail,
      notificationEmail2: updated.notificationEmail2,
    });
  })
);

const updateNotificationEmailSchema = z.object({
  notificationEmail: z.preprocess((v) => (v === "" ? null : v), z.string().email().nullable().optional()),
  notificationEmail2: z.preprocess((v) => (v === "" ? null : v), z.string().email().nullable().optional()),
});

// A superadmin may set anyone's notificationEmail(s), including their own. A
// plain admin may set their own, any other admin's (same role), and any
// standard/subsidiary-scoped user's — but not a superadmin's. Deliberately
// looser than isActive's own "superadmin only for admin/superadmin targets"
// split above, since this isn't an account-security toggle, just contact
// addresses (see User.notificationEmail/notificationEmail2's own doc
// comment) — a plain admin managing another admin's or a subsidiary user's
// contact address can't do anything more sensitive with that access.
adminRouter.patch(
  "/users/:id/notification-email",
  validateBody(updateNotificationEmailSchema),
  asyncHandler(async (req, res) => {
    const emails = req.body as z.infer<typeof updateNotificationEmailSchema>;

    const target = await findUserById(req.params.id);
    if (!target) {
      res.status(404).json({ error: "user not found" });
      return;
    }

    const isSelf = target.id === req.auth!.sub;
    const canManage =
      req.auth!.role === "superadmin" ||
      isSelf ||
      (req.auth!.role === "admin" && (target.role === "admin" || target.role === "standard"));
    if (!canManage) {
      res.status(403).json({ error: "You are not allowed to update this user's notification email" });
      return;
    }

    const updated = await setUserNotificationEmails(req.params.id, emails);
    if (!updated) {
      res.status(404).json({ error: "user not found" });
      return;
    }
    res.json({
      id: updated.id,
      username: updated.username,
      email: updated.email,
      role: updated.role,
      subsidiaryId: updated.subsidiaryId,
      isActive: updated.isActive,
      notificationEmail: updated.notificationEmail,
      notificationEmail2: updated.notificationEmail2,
    });
  })
);

const createQaRunSchema = z.object({
  uploadId: z.string().trim().min(1),
  variant: z.enum(["ff", "oc"]),
});

// Kicks off a Playwright QA run for one upload's generated variant — see
// qaRunService.createQaRun. Returns immediately with a "pending" run; the
// actual browser automation happens in the background (no job queue, just a
// fire-and-forget async call in this same process — see runQaJob's own doc
// comment for why that's an acceptable tradeoff here). The frontend polls
// GET /qa-runs/:id until status leaves "pending"/"running".
adminRouter.post(
  "/qa-runs",
  validateBody(createQaRunSchema),
  asyncHandler(async (req, res) => {
    const { uploadId, variant } = req.body as z.infer<typeof createQaRunSchema>;
    const result = await createQaRun(uploadId, variant, req.auth!.sub);

    if (result.outcome === "not_found") {
      res.status(404).json({ error: "upload not found" });
      return;
    }
    if (result.outcome === "no_files") {
      res.status(409).json({ error: "this upload has no generated files for that variant yet" });
      return;
    }
    res.status(201).json(result.qaRun);
  })
);

// Every QA run ever triggered for one upload, newest first — the admin
// dashboard's QA panel history for that upload.
adminRouter.get(
  "/qa-runs",
  asyncHandler(async (req, res) => {
    const uploadId = typeof req.query.uploadId === "string" ? req.query.uploadId : undefined;
    if (!uploadId) {
      res.status(400).json({ error: "uploadId query param is required" });
      return;
    }
    const runs = await listQaRunsForUpload(uploadId);
    res.json(runs);
  })
);

// One run's full detail — status/counts plus every individual test case
// result (name/status/fieldId/message), what the "which fields should be
// fixed" view in the admin dashboard reads.
adminRouter.get(
  "/qa-runs/:id",
  asyncHandler(async (req, res) => {
    const detail = await getQaRunDetail(req.params.id);
    if (!detail) {
      res.status(404).json({ error: "QA run not found" });
      return;
    }
    res.json({ run: detail.run, results: detail.results });
  })
);

// The same run, as a standalone downloadable HTML report — see
// qaRunService.buildQaReportDownload / writeQaReport.
adminRouter.get(
  "/qa-runs/:id/download",
  asyncHandler(async (req, res) => {
    const result = await buildQaReportDownload(req.params.id);
    if (result.outcome === "not_found") {
      res.status(404).json({ error: "QA run not found" });
      return;
    }
    if (result.outcome === "not_ready") {
      res.status(409).json({ error: "this QA run has no report yet — it may still be running, or it errored before completing" });
      return;
    }
    res.set("Content-Type", "text/html");
    res.set("Content-Disposition", `attachment; filename="qa-report-${req.params.id}.html"`);
    res.send(result.html);
  })
);

// Every active-subsidiary Form under a project code, plus whether each has been
// published yet — lets the Question Master page show who isn't ready before an admin
// clicks Generate. See questionMasterService.getReadiness.
adminRouter.get(
  "/question-master/readiness",
  asyncHandler(async (req, res) => {
    const projectCode = typeof req.query.projectCode === "string" ? req.query.projectCode : undefined;
    if (!projectCode) {
      res.status(400).json({ error: "projectCode query param is required" });
      return;
    }
    const readiness = await getQuestionMasterReadiness(projectCode);
    res.json(readiness);
  })
);

const generateQuestionMasterSchema = z.object({
  projectCode: z.string().trim().min(1),
  division: z.string().trim().max(50).optional(),
});

// Compiles every published form under the given project code into a new, versioned
// Question Master .xlsx. See questionMasterService.generateQuestionMaster.
adminRouter.post(
  "/question-master/generate",
  validateBody(generateQuestionMasterSchema),
  asyncHandler(async (req, res) => {
    const { projectCode, division } = req.body as z.infer<typeof generateQuestionMasterSchema>;
    const result = await generateQuestionMaster(projectCode, division ?? "", req.auth!.sub);
    if (result.outcome === "project_not_found") {
      res.status(404).json({ error: `Unknown project code "${projectCode}"` });
      return;
    }
    if (result.outcome === "not_locked") {
      res.status(409).json({ error: "This project code must be locked before generating a Question Master" });
      return;
    }
    res.status(201).json(result.version);
  })
);

// Additive counterpart to /question-master/readiness above — every active
// subsidiary's most recent Excel upload under a project code, plus whether it's been
// submitted yet. See questionMasterService.getUploadReadiness.
adminRouter.get(
  "/question-master/upload-readiness",
  asyncHandler(async (req, res) => {
    const projectCode = typeof req.query.projectCode === "string" ? req.query.projectCode : undefined;
    if (!projectCode) {
      res.status(400).json({ error: "projectCode query param is required" });
      return;
    }
    const readiness = await getQuestionMasterUploadReadiness(projectCode);
    res.json(readiness);
  })
);

// Additive counterpart to /question-master/generate above — compiles every submitted
// Excel upload under the given project code into a new, versioned Question Master
// .xlsx. See questionMasterService.generateQuestionMasterFromUploads.
adminRouter.post(
  "/question-master/generate-from-uploads",
  validateBody(generateQuestionMasterSchema),
  asyncHandler(async (req, res) => {
    const { projectCode, division } = req.body as z.infer<typeof generateQuestionMasterSchema>;
    const result = await generateQuestionMasterFromUploads(projectCode, division ?? "", req.auth!.sub);
    if (result.outcome === "project_not_found") {
      res.status(404).json({ error: `Unknown project code "${projectCode}"` });
      return;
    }
    if (result.outcome === "not_locked") {
      res.status(409).json({ error: "This project code must be locked before generating a Question Master" });
      return;
    }
    if (result.outcome === "no_uploads") {
      res.status(409).json({ error: "No active subsidiary has a submitted Excel upload under this project code yet" });
      return;
    }
    res.status(201).json(result.version);
  })
);

// Every Question Master version generated for a project code, newest first.
adminRouter.get(
  "/question-master/versions",
  asyncHandler(async (req, res) => {
    const projectCode = typeof req.query.projectCode === "string" ? req.query.projectCode : undefined;
    if (!projectCode) {
      res.status(400).json({ error: "projectCode query param is required" });
      return;
    }
    const versions = await listQuestionMasterVersions(projectCode);
    res.json(versions);
  })
);

adminRouter.get(
  "/question-master/versions/:id/download",
  asyncHandler(async (req, res) => {
    const result = await getQuestionMasterVersionFile(req.params.id);
    if (result.outcome === "not_found") {
      res.status(404).json({ error: "Question Master version not found" });
      return;
    }
    res.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.set("Content-Disposition", `attachment; filename="${result.fileName}"`);
    res.send(result.buffer);
  })
);

// --- SMTP settings (Configuration page) -----------------------------------
// DB-stored SMTP connection config, admin-managed — see smtpSettingsService.ts
// for the AdminSettings keys used and emailService.ts's resolveSmtpConfig for
// how this takes precedence over the original SMTP_* env vars. The real
// password is write-only from the browser's perspective: GET never returns
// it, only whether one is set (hasPassword).
const smtpSettingsSchema = z.object({
  host: z.string().trim().min(1),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: z.string().trim().nullable().optional(),
  password: z.string().optional(),
  from: z.string().trim().nullable().optional(),
});

adminRouter.get(
  "/smtp-settings",
  asyncHandler(async (_req, res) => {
    res.json(await getSmtpSettingsForDisplay());
  })
);

adminRouter.patch(
  "/smtp-settings",
  validateBody(smtpSettingsSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof smtpSettingsSchema>;
    await saveSmtpSettings({
      host: input.host,
      port: input.port,
      secure: input.secure,
      user: input.user?.trim() || null,
      password: input.password,
      from: input.from?.trim() || null,
    });
    res.json(await getSmtpSettingsForDisplay());
  })
);

// Sends a real test email, to the calling admin's own account, using
// whatever SMTP settings are currently saved — immediate confirmation that a
// newly-entered credential actually works instead of digging through server
// logs after the fact.
adminRouter.post(
  "/smtp-settings/test",
  asyncHandler(async (req, res) => {
    const user = await findUserById(req.auth!.sub);
    if (!user) {
      res.status(404).json({ error: "user not found" });
      return;
    }
    const result = await sendTestEmail(user.email);
    if (!result.ok) {
      res.status(502).json({ error: result.error });
      return;
    }
    res.json({ ok: true, sentTo: user.email });
  })
);

// DB-stored FabriXAI Agent-API connection config, admin-managed — mirrors the
// SMTP settings routes immediately above (see fabrixSettingsService.ts for the
// AdminSettings keys used, and fabrixAIService.ts's own doc comment for the
// wire contract these settings feed). The real API key is write-only from the
// browser's perspective: GET never returns it, only whether one is set
// (hasApiKey).
const fabrixSettingsSchema = z.object({
  baseUrl: z.string().trim().min(1),
  agentId: z.string().trim().min(1),
  apiKey: z.string().optional(),
  clientHeader: z.string().optional(),
  openApiToken: z.string().optional(),
  enabled: z.boolean().optional(),
});

adminRouter.get(
  "/fabrix-settings",
  asyncHandler(async (_req, res) => {
    res.json(await getFabrixSettingsForDisplay());
  })
);

adminRouter.patch(
  "/fabrix-settings",
  validateBody(fabrixSettingsSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof fabrixSettingsSchema>;
    await saveFabrixSettings({
      baseUrl: input.baseUrl,
      agentId: input.agentId,
      apiKey: input.apiKey,
      clientHeader: input.clientHeader,
      openApiToken: input.openApiToken,
      enabled: input.enabled,
    });
    res.json(await getFabrixSettingsForDisplay());
  })
);

// Sends a trivial prompt through FabriXAI using whatever settings are
// currently saved — the FabriXAI equivalent of the SMTP "test email" button
// above: immediate confirmation of whether the adapter's best-guess wire
// contract (see fabrixAIService.ts's callFabrixAgent) actually round-trips
// against the real service, instead of only finding out mid-conversation.
adminRouter.post(
  "/fabrix-settings/test",
  asyncHandler(async (_req, res) => {
    const settings = await getFabrixSettingsForDisplay();
    if (!settings.baseUrl || !settings.agentId) {
      res.status(400).json({ ok: false, error: "FabriXAI base URL and agent id must be configured first" });
      return;
    }
    const result = await sendFabrixMessage({
      agentId: settings.agentId,
      messages: [{ role: "user", content: "Reply with the single word OK." }],
    });
    if (!result.ok) {
      res.json({ ok: false, error: result.error });
      return;
    }
    res.json({ ok: true });
  })
);
