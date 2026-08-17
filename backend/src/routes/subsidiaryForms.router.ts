import { Router } from "express";
import { z } from "zod";
import { contributionContentSchema } from "@formbuilder/shared";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/authJwt";
import { validateBody } from "../middleware/validate";
import { getAccessibleFormDetail, listAccessibleForms } from "../services/formAccessService";
import { listOwnContributions, listOwnContributionsAllForms, submitContribution } from "../services/formContributionService";

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
