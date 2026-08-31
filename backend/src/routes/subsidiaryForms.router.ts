import { Router } from "express";
import { z } from "zod";
import { contributionContentSchema, formDefinitionSchema, type BuilderConfig, type QuestionDefinition } from "@formbuilder/shared";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/authJwt";
import { validateBody } from "../middleware/validate";
import { getAccessibleFormDetail, listAccessibleForms } from "../services/formAccessService";
import { listOwnContributions, listOwnContributionsAllForms, saveContributionDraft, submitContribution } from "../services/formContributionService";
import { getSubsidiaryDashboardSummary } from "../services/dashboardService";
import {
  createForm,
  deleteAdHocForm,
  findOwnedAdHocForm,
  getFormDetail,
  listMyAdHocForms,
  submitAdHocFormForReview,
  updateDraft,
} from "../services/formBuilderService";

/**
 * Standard-user-facing counterpart to admin's own `/api/v1/admin/forms` — a
 * subsidiary-scoped, read-mostly view of *published* forms plus the ability to
 * submit a contribution (translations + additive questions/consents, never a direct
 * edit — see `formContributionService`'s own doc comment). Mounted at
 * `/api/v1/forms`, distinct from the admin path, same as how `/api/v1/uploads`
 * (any authenticated user) sits alongside `/api/v1/admin/uploads` (admin only).
 */
export const subsidiaryFormsRouter = Router();

subsidiaryFormsRouter.use(requireAuth);

subsidiaryFormsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const subsidiaryId = req.auth!.subsidiaryId;
    if (!subsidiaryId) {
      res.json([]);
      return;
    }
    const forms = await listAccessibleForms(subsidiaryId, req.auth!.sub);
    res.json(forms);
  }),
);

// Registered before "/:id" — otherwise Express would match "contributions" here as
// a form id and this route would never be reached.
subsidiaryFormsRouter.get(
  "/contributions/mine",
  asyncHandler(async (req, res) => {
    const contributions = await listOwnContributionsAllForms(req.auth!.sub);
    res.json(contributions);
  }),
);

// The subsidiary user's post-login "Dashboard" landing page — scoped to their
// own ad-hoc campaigns only (see dashboardService.ts's own doc comment).
// Registered before "/:id" for the same route-ordering reason as above.
subsidiaryFormsRouter.get(
  "/dashboard-summary",
  asyncHandler(async (req, res) => {
    const subsidiaryId = req.auth!.subsidiaryId;
    if (!subsidiaryId) {
      res.json({ counts: { total: 0, drafts: 0, pendingReview: 0, changesRequested: 0, published: 0 }, recentCampaigns: [], continueWorking: [], actionRequired: [] });
      return;
    }
    res.json(await getSubsidiaryDashboardSummary(subsidiaryId));
  }),
);

// A subsidiary user's own self-service "ad-hoc" forms — a brand-new form they
// build themselves (My Forms → New Ad-hoc Form), distinct from the read-only
// contribution flow above (which only ever touches an existing *published*
// admin-authored form). Registered under "/adhoc" and before "/:id" for the same
// route-ordering reason as "/contributions/mine" above. The subsidiary is never
// taken from the request body — always forced to the caller's own
// req.auth.subsidiaryId, same convention as upload.router.ts.

const createAdHocFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  // "Copy from an existing form" — clones one of this same subsidiary's own
  // previous ad-hoc forms as the starting point instead of a blank template.
  // Ownership-checked below via findOwnedAdHocForm, same as every other
  // /adhoc/* route — never trusts the id alone, so a subsidiary user can't
  // pull another subsidiary's private ad-hoc content by guessing an id.
  copyFromFormId: z.string().trim().min(1).optional(),
});

const createAdHocFormWithQuestionsSchema = z.object({
  name: z.string().trim().min(1).max(200),
  questions: z.array(z.object({
    id: z.string(),
    order: z.number(),
    headingByLocale: z.record(z.string(), z.string()),
    subheadingByLocale: z.record(z.string(), z.string()).optional(),
    controlType: z.enum(["radio", "checkbox", "text", "shortText", "dropdown"]),
    required: z.boolean(),
    answers: z.array(z.object({
      id: z.string(),
      order: z.number(),
      textByLocale: z.record(z.string(), z.string()),
    })).optional(),
  })),
});

subsidiaryFormsRouter.post(
  "/adhoc",
  validateBody(createAdHocFormSchema),
  asyncHandler(async (req, res) => {
    const subsidiaryId = req.auth!.subsidiaryId;
    if (!subsidiaryId) {
      res.status(403).json({ error: "This account has no subsidiary assigned" });
      return;
    }
    const { name, copyFromFormId } = req.body as z.infer<typeof createAdHocFormSchema>;
    if (copyFromFormId) {
      const owned = await findOwnedAdHocForm(copyFromFormId, subsidiaryId);
      if (!owned) {
        res.status(404).json({ error: "Form to copy not found" });
        return;
      }
    }
    const form = await createForm({ name, subsidiaryId, userId: req.auth!.sub, origin: "adhoc", copyFromFormId });
    res.status(201).json(form);
  }),
);

subsidiaryFormsRouter.post(
  "/adhoc/with-questions",
  validateBody(createAdHocFormWithQuestionsSchema),
  asyncHandler(async (req, res) => {
    const subsidiaryId = req.auth!.subsidiaryId;
    if (!subsidiaryId) {
      res.status(403).json({ error: "This account has no subsidiary assigned" });
      return;
    }
    const { name, questions } = req.body as z.infer<typeof createAdHocFormWithQuestionsSchema>;
    const form = await createForm({ name, subsidiaryId, userId: req.auth!.sub, origin: "adhoc", questions: questions as unknown as QuestionDefinition[] });
    res.status(201).json(form);
  }),
);

subsidiaryFormsRouter.get(
  "/adhoc",
  asyncHandler(async (req, res) => {
    const subsidiaryId = req.auth!.subsidiaryId;
    if (!subsidiaryId) {
      res.json([]);
      return;
    }
    const forms = await listMyAdHocForms(subsidiaryId);
    res.json(forms);
  }),
);

subsidiaryFormsRouter.get(
  "/adhoc/:id",
  asyncHandler(async (req, res) => {
    const subsidiaryId = req.auth!.subsidiaryId;
    if (!subsidiaryId || !(await findOwnedAdHocForm(req.params.id, subsidiaryId))) {
      res.status(404).json({ error: "form not found" });
      return;
    }
    const detail = await getFormDetail(req.params.id);
    res.json(detail);
  }),
);

const updateAdHocDraftSchema = z.object({
  definition: formDefinitionSchema,
  config: z.object({ variants: z.array(z.enum(["ff", "oc"])).min(1) }).catchall(z.unknown()),
});

subsidiaryFormsRouter.patch(
  "/adhoc/:id/draft",
  validateBody(updateAdHocDraftSchema),
  asyncHandler(async (req, res) => {
    const subsidiaryId = req.auth!.subsidiaryId;
    const owned = subsidiaryId ? await findOwnedAdHocForm(req.params.id, subsidiaryId) : null;
    if (!owned) {
      res.status(404).json({ error: "form not found" });
      return;
    }
    if (owned.pendingReview) {
      res.status(409).json({ error: "This form is awaiting admin review — it can't be edited until reviewed" });
      return;
    }
    const { definition, config } = req.body as z.infer<typeof updateAdHocDraftSchema>;
    await updateDraft(req.params.id, definition, config as BuilderConfig);
    res.status(204).send();
  }),
);

subsidiaryFormsRouter.post(
  "/adhoc/:id/submit-for-review",
  asyncHandler(async (req, res) => {
    const subsidiaryId = req.auth!.subsidiaryId;
    if (!subsidiaryId) {
      res.status(404).json({ error: "form not found" });
      return;
    }
    const outcome = await submitAdHocFormForReview(req.params.id, subsidiaryId);
    if (outcome === "not_found") {
      res.status(404).json({ error: "form not found" });
      return;
    }
    if (outcome === "already_pending") {
      res.status(409).json({ error: "This form is already awaiting review" });
      return;
    }
    res.status(204).send();
  }),
);

subsidiaryFormsRouter.delete(
  "/adhoc/:id",
  asyncHandler(async (req, res) => {
    const subsidiaryId = req.auth!.subsidiaryId;
    if (!subsidiaryId) {
      res.status(404).json({ error: "form not found" });
      return;
    }
    const outcome = await deleteAdHocForm(req.params.id, subsidiaryId);
    if (outcome === "not_found") {
      res.status(404).json({ error: "form not found" });
      return;
    }
    if (outcome === "already_published") {
      res.status(409).json({ error: "This form has already been published and can no longer be deleted" });
      return;
    }
    res.status(204).send();
  }),
);

subsidiaryFormsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const subsidiaryId = req.auth!.subsidiaryId;
    if (!subsidiaryId) {
      res.status(404).json({ error: "form not found" });
      return;
    }
    const detail = await getAccessibleFormDetail(req.params.id, subsidiaryId);
    if (!detail) {
      res.status(404).json({ error: "form not found" });
      return;
    }
    res.json(detail);
  }),
);

const submitContributionSchema = z.object({
  content: contributionContentSchema,
  note: z.string().trim().max(2000).optional(),
});

subsidiaryFormsRouter.post(
  "/:id/contributions",
  validateBody(submitContributionSchema),
  asyncHandler(async (req, res) => {
    const subsidiaryId = req.auth!.subsidiaryId;
    if (!subsidiaryId) {
      res.status(404).json({ error: "form not found" });
      return;
    }
    const { content, note } = req.body as z.infer<typeof submitContributionSchema>;
    const result = await submitContribution(req.params.id, req.auth!.sub, subsidiaryId, content, note);
    if (result.outcome === "not_found") {
      res.status(404).json({ error: "form not found" });
      return;
    }
    if (result.outcome === "invalid") {
      res.status(422).json({ error: "contribution is not valid", validation: result.validation });
      return;
    }
    if (result.outcome === "project_locked") {
      res.status(409).json({ error: "This project code is locked — contributions can no longer be submitted" });
      return;
    }
    res.status(201).json(result.contribution);
  }),
);

subsidiaryFormsRouter.get(
  "/:id/contributions",
  asyncHandler(async (req, res) => {
    const contributions = await listOwnContributions(req.params.id, req.auth!.sub);
    res.json(contributions);
  }),
);

// Save-in-progress work without queuing it for admin review (see
// FormContribution.ts's own doc comment on the "draft" status) — the Translate &
// Extend page's Ctrl+S/"Save Draft" button. Reuses the same body shape as submit;
// unlike submit, this never runs validateContribution, since the whole point is
// being able to save incomplete work.
const saveContributionDraftSchema = z.object({
  content: contributionContentSchema,
  note: z.string().trim().max(2000).optional(),
});

subsidiaryFormsRouter.patch(
  "/:id/contributions/draft",
  validateBody(saveContributionDraftSchema),
  asyncHandler(async (req, res) => {
    const subsidiaryId = req.auth!.subsidiaryId;
    if (!subsidiaryId) {
      res.status(404).json({ error: "form not found" });
      return;
    }
    const { content, note } = req.body as z.infer<typeof saveContributionDraftSchema>;
    const result = await saveContributionDraft(req.params.id, req.auth!.sub, subsidiaryId, content, note);
    if (result.outcome === "not_found") {
      res.status(404).json({ error: "form not found" });
      return;
    }
    res.status(200).json(result.contribution);
  }),
);
