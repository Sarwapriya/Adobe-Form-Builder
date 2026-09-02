import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAdmin } from "../middleware/authJwt";
import { validateBody } from "../middleware/validate";
import {
  createUser,
  findUserById,
  listUsers,
  setUserActive,
  setUserNotificationEmails,
  updateUser,
} from "../services/authService";
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
import {
  buildQaReportDownload,
  createAdHocReviewQaRun,
  createContributionQaRun,
  getQaRunDetail,
  listQaRunsForForm,
} from "../services/qaRunService";
import { sendTestEmail } from "../services/emailService";
import { getSmtpSettingsForDisplay, saveSmtpSettings } from "../services/smtpSettingsService";
import { getFabrixSettingsForDisplay, saveFabrixSettings } from "../services/fabrixSettingsService";
import { sendMessage as sendFabrixMessage } from "../services/fabrixAIService";
import {
  listFabrixModels,
  createFabrixModel,
  updateFabrixModel,
  moveFabrixModel,
  deleteFabrixModel,
} from "../services/fabrixModelsService";
import { getClaudeSettingsForDisplay, saveClaudeSettings } from "../services/claudeSettingsService";
import { sendMessage as sendClaudeMessage } from "../services/claudeAIService";
import { listOtherAiModels } from "../services/otherAiModelsService";
import { getSftpDeploymentSettings, saveSftpTarget, setActiveSftpEnvironment } from "../services/sftpSettingsService";
import { getAdminDashboardSummary } from "../services/dashboardService";
import {
  generateQuestionMaster,
  getReadiness as getQuestionMasterReadiness,
  getVersionFile as getQuestionMasterVersionFile,
  listVersions as listQuestionMasterVersions,
} from "../services/questionMasterService";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

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

// Closing a project code here blocks new uploads and new Form Initiator forms
// against it for everyone — see uploadService.createUpload's and
// formBuilderService.createForm/approveAdHocForm's calls to
// assertProjectCodeOpen. Locking it (isLocked) is a separate, more permanent
// freeze that only blocks non-admin uploads/contributions — see
// ProjectCode.isLocked's own doc comment. Neither affects uploads/forms
// already made under that code. startDate/endDate are purely descriptive (see
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
// for it in one step — see uploadService.createUpload's and
// formBuilderService.createForm/approveAdHocForm's calls to
// assertSubsidiaryActive. Independent of, and layered above,
// /subsidiary-project-blocks below (a single project-scoped restriction). It
// does not affect uploads/forms already made under that subsidiary. isActive and
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
  firstName: z.string().trim().max(100).nullable().optional(),
  lastName: z.string().trim().max(100).nullable().optional(),
});

// Full account-details edit (username/email/role/subsidiary) — same
// admin-may-manage-standard-users, superadmin-may-manage-anyone split as
// setUserActive/account creation above, applied twice here since this
// endpoint can change two different things a plain admin shouldn't be able
// to touch on a non-standard account: (1) the *target's own current* role
// (a plain admin may only edit an existing "standard" account — never
// another admin's or superadmin's, regardless of what fields are being
// changed) and (2) the *requested* role (a plain admin may never grant
// "admin"/"superadmin" via this field, which would otherwise be a
// privilege-escalation path around account creation's own same-shaped
// check).
adminRouter.patch(
  "/users/:id/profile",
  validateBody(updateUserProfileSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof updateUserProfileSchema>;

    const target = await findUserById(req.params.id);
    if (!target) {
      res.status(404).json({ error: "user not found" });
      return;
    }
    if (req.auth!.role !== "superadmin") {
      if (target.role !== "standard") {
        res.status(403).json({ error: "only a superadmin may update an admin or superadmin account" });
        return;
      }
      if (input.role && input.role !== "standard") {
        res.status(403).json({ error: "only a superadmin may grant an admin or superadmin role" });
        return;
      }
    }

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
      firstName: updated.firstName,
      lastName: updated.lastName,
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
      firstName: updated.firstName,
      lastName: updated.lastName,
    });
  })
);

// Exactly one of contributionId/formId identifies the QA subject —
// contributionId for a pending Translate & Extend contribution (merged onto its
// form's draft in-memory, never persisted — see
// qaRunService.createContributionQaRun), or formId alone for an ad-hoc form's own
// draft while it awaits admin review (qaRunService.createAdHocReviewQaRun).
const createQaRunSchema = z
  .object({
    contributionId: z.string().trim().min(1).optional(),
    formId: z.string().trim().min(1).optional(),
    variant: z.enum(["ff", "oc"]),
  })
  .refine((v) => [v.contributionId, v.formId].filter((x) => x !== undefined).length === 1, {
    message: "Exactly one of contributionId or formId is required",
  });

// Kicks off a Playwright QA run for one generated variant of a pending
// contribution, or an ad-hoc form awaiting review — see
// qaRunService.createContributionQaRun/createAdHocReviewQaRun. Returns
// immediately with a "pending" run; the actual browser automation happens in
// the background (no job queue, just a fire-and-forget async call in this
// same process — see runQaJob's own doc comment for why that's an acceptable
// tradeoff here). The frontend polls GET /qa-runs/:id until status leaves
// "pending"/"running".
adminRouter.post(
  "/qa-runs",
  validateBody(createQaRunSchema),
  asyncHandler(async (req, res) => {
    const { contributionId, formId, variant } = req.body as z.infer<typeof createQaRunSchema>;
    const result = contributionId
      ? await createContributionQaRun(contributionId, variant, req.auth!.sub)
      : await createAdHocReviewQaRun(formId!, variant, req.auth!.sub);

    if (result.outcome === "not_found") {
      res.status(404).json({ error: "form or pending contribution not found" });
      return;
    }
    if (result.outcome === "no_files") {
      res.status(409).json({ error: "no generated output for that variant yet" });
      return;
    }
    if (result.outcome === "invalid") {
      res.status(422).json({ error: "this form has blocking validation errors — fix them before running QA", validation: result.validation });
      return;
    }
    res.status(201).json(result.qaRun);
  })
);

// Every QA run ever triggered for one Configuration form (?formId= — covers
// both contribution-based and ad-hoc pending-review runs, since both set
// QaRun.formId), newest first.
adminRouter.get(
  "/qa-runs",
  asyncHandler(async (req, res) => {
    const formId = typeof req.query.formId === "string" ? req.query.formId : undefined;
    if (!formId) {
      res.status(400).json({ error: "formId query param is required" });
      return;
    }
    const runs = await listQaRunsForForm(formId);
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

// DB-stored connection config for the FabriX OpenAPI chat endpoint
// (POST /openapi/chat/v1/messages), admin-managed — mirrors the SMTP
// settings routes immediately above (see fabrixSettingsService.ts for the
// AdminSettings keys used, and fabrixAIService.ts's own doc comment for the
// confirmed wire contract these settings feed). The two secrets
// (clientHeader/openApiToken) are write-only from the browser's
// perspective: GET never returns them, only whether one is set.
const fabrixSettingsSchema = z.object({
  baseUrl: z.string().trim().min(1),
  clientHeader: z.string().optional(),
  openApiToken: z.string().optional(),
  userEmail: z.string().trim().optional(),
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
      clientHeader: input.clientHeader,
      openApiToken: input.openApiToken,
      userEmail: input.userEmail,
      enabled: input.enabled,
    });
    res.json(await getFabrixSettingsForDisplay());
  })
);

// Sends a trivial prompt through FabriXAI using whatever settings are
// currently saved — the FabriXAI equivalent of the SMTP "test email" button
// above: immediate confirmation of whether the confirmed wire contract (see
// fabrixAIService.ts's callFabrixAgent) actually round-trips against the
// real service, instead of only finding out mid-conversation.
adminRouter.post(
  "/fabrix-settings/test",
  asyncHandler(async (_req, res) => {
    const settings = await getFabrixSettingsForDisplay();
    if (!settings.baseUrl || settings.enabledModelCount === 0) {
      res.status(400).json({ ok: false, error: "FabriXAI base URL and at least one enabled model must be configured first" });
      return;
    }
    const result = await sendFabrixMessage({
      messages: [{ role: "user", content: "Reply with the single word OK." }],
    });
    if (!result.ok) {
      res.json({ ok: false, error: result.error });
      return;
    }
    res.json({ ok: true });
  })
);

// The admin-managed FabriX LLM catalog (Configuration > AI Assistant >
// Models) — every *enabled* row is sent together in the chat request's
// modelIds array (see fabrixSettingsService.ts/fabrixAIService.ts), letting
// FabriX route around/fall back past a model that's unavailable or
// token/rate-limited rather than this app needing its own retry logic.
adminRouter.get(
  "/fabrix-models",
  asyncHandler(async (_req, res) => {
    res.json(await listFabrixModels());
  })
);

const createFabrixModelSchema = z.object({
  name: z.string().trim().min(1),
  modelId: z.string().trim().min(1),
});

adminRouter.post(
  "/fabrix-models",
  validateBody(createFabrixModelSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof createFabrixModelSchema>;
    const created = await createFabrixModel(input);
    res.status(201).json(created);
  })
);

const updateFabrixModelSchema = z.object({
  name: z.string().trim().min(1).optional(),
  modelId: z.string().trim().min(1).optional(),
  isEnabled: z.boolean().optional(),
});

adminRouter.patch(
  "/fabrix-models/:id",
  validateBody(updateFabrixModelSchema),
  asyncHandler(async (req, res) => {
    const updated = await updateFabrixModel(req.params.id, req.body as z.infer<typeof updateFabrixModelSchema>);
    if (!updated) {
      res.status(404).json({ error: "fabrix model not found" });
      return;
    }
    res.json(updated);
  })
);

const moveFabrixModelSchema = z.object({
  direction: z.enum(["up", "down"]),
});

adminRouter.post(
  "/fabrix-models/:id/move",
  validateBody(moveFabrixModelSchema),
  asyncHandler(async (req, res) => {
    const { direction } = req.body as z.infer<typeof moveFabrixModelSchema>;
    const moved = await moveFabrixModel(req.params.id, direction);
    if (!moved) {
      res.status(404).json({ error: "fabrix model not found" });
      return;
    }
    res.json(moved);
  })
);

adminRouter.delete(
  "/fabrix-models/:id",
  asyncHandler(async (req, res) => {
    const deleted = await deleteFabrixModel(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "fabrix model not found" });
      return;
    }
    res.status(204).send();
  })
);

// DB-stored connection config for the Anthropic Claude Messages API,
// admin-managed — the automatic fallback provider used only when FabriX
// can't be reached (see aiProviderService.ts). Simpler surface than
// FabriX's: one API key, one model string, no separate headers/model-array.
// The key is write-only from the browser's perspective: GET never returns
// it, only whether one is set.
const claudeSettingsSchema = z.object({
  model: z.string().trim().min(1),
  apiKey: z.string().optional(),
  enabled: z.boolean().optional(),
});

adminRouter.get(
  "/claude-settings",
  asyncHandler(async (_req, res) => {
    res.json(await getClaudeSettingsForDisplay());
  })
);

// Read-only reference catalog of known models for the fallback AI providers
// (Configuration > AI Assistant > Other AI Providers), for the Model field's
// picklist in the admin UI (see otherAiModelsService.ts).
adminRouter.get(
  "/other-ai-models",
  asyncHandler(async (_req, res) => {
    res.json(await listOtherAiModels());
  })
);

adminRouter.patch(
  "/claude-settings",
  validateBody(claudeSettingsSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof claudeSettingsSchema>;
    await saveClaudeSettings({ model: input.model, apiKey: input.apiKey, enabled: input.enabled });
    res.json(await getClaudeSettingsForDisplay());
  })
);

// Sends a trivial prompt through Claude directly (not via aiProviderService's
// dispatch) using whatever Claude settings are currently saved — lets an
// admin verify the Claude connection works even while FabriX is the active
// provider, mirroring the FabriX "Send test message" button above.
adminRouter.post(
  "/claude-settings/test",
  asyncHandler(async (_req, res) => {
    const settings = await getClaudeSettingsForDisplay();
    if (!settings.hasApiKey) {
      res.status(400).json({ ok: false, error: "A Claude API key must be configured first" });
      return;
    }
    const result = await sendClaudeMessage({ messages: [{ role: "user", content: "Reply with the single word OK." }] });
    if (!result.ok) {
      res.json({ ok: false, error: result.error });
      return;
    }
    res.json({ ok: true });
  })
);

// DB-stored SFTP deployment config (Configuration > Deployment) — staging
// and production targets are both always stored; `activeEnvironment` picks
// which one sftpService.deployGeneratedFiles actually pushes to on every
// Publish/Deploy. See sftpSettingsService.ts's own doc comment — none of
// these fields are secrets in themselves (no password/key content), just a
// host/username/local-file-path/remote-path, so unlike FabriX/Claude nothing
// here is encrypted or write-only.
const sftpTargetSchema = z.object({
  host: z.string().trim().min(1),
  port: z.coerce.number().int().min(1).max(65535).optional(),
  username: z.string().trim().min(1),
  privateKeyPath: z.string().trim().min(1),
  remotePath: z.string().trim().min(1),
});

adminRouter.get(
  "/deployment-settings",
  asyncHandler(async (_req, res) => {
    res.json(await getSftpDeploymentSettings());
  })
);

adminRouter.patch(
  "/deployment-settings/:environment",
  validateBody(sftpTargetSchema),
  asyncHandler(async (req, res) => {
    const environment = req.params.environment;
    if (environment !== "staging" && environment !== "production") {
      res.status(400).json({ error: "environment must be 'staging' or 'production'" });
      return;
    }
    const input = req.body as z.infer<typeof sftpTargetSchema>;
    await saveSftpTarget(environment, {
      host: input.host,
      port: input.port ?? 22,
      username: input.username,
      privateKeyPath: input.privateKeyPath,
      remotePath: input.remotePath,
    });
    res.json(await getSftpDeploymentSettings());
  })
);

const setActiveSftpEnvironmentSchema = z.object({ environment: z.enum(["staging", "production"]) });

adminRouter.post(
  "/deployment-settings/active",
  validateBody(setActiveSftpEnvironmentSchema),
  asyncHandler(async (req, res) => {
    const { environment } = req.body as z.infer<typeof setActiveSftpEnvironmentSchema>;
    await setActiveSftpEnvironment(environment);
    res.json(await getSftpDeploymentSettings());
  })
);

// Admin's post-login "Dashboard" landing page — system-wide campaign counts,
// activity trends, and the merged pending-approvals/recent-activity feeds
// (see dashboardService.ts's own doc comment for the status-bucketing rule).
adminRouter.get(
  "/dashboard-summary",
  asyncHandler(async (_req, res) => {
    res.json(await getAdminDashboardSummary());
  })
);
