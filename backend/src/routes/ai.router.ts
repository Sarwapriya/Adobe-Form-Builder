import { Router } from "express";
import { aiChatRequestSchema, aiToolCallSchema } from "@formbuilder/shared";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/authJwt";
import { validateBody } from "../middleware/validate";
import { aiRateLimiter } from "../middleware/rateLimit";
import { NotFoundError } from "../utils/errors";
import {
  confirmAction,
  getConversation,
  listConversations,
  rejectAction,
  sendChatMessage,
} from "../services/aiAssistantService";
import { getCampaign, searchCampaigns, type AiToolCallerContext } from "../services/aiCampaignTools";

/**
 * FabriXAI-backed Form Builder assistant — mounted at /api/v1/ai.
 * requireAuth throughout, no blanket admin gate: both admin and
 * subsidiary-scoped standard users use the chatbot, exactly like
 * subsidiaryForms.router.ts, with every handler deriving its own scoping
 * from req.auth rather than trusting anything the client/model supplies.
 */
export const aiRouter = Router();

aiRouter.use(requireAuth);

function toCallerContext(auth: { sub: string; role: "admin" | "standard" | "superadmin"; subsidiaryId: string | null }): AiToolCallerContext {
  return { userId: auth.sub, role: auth.role, subsidiaryId: auth.subsidiaryId };
}

aiRouter.post(
  "/chat",
  aiRateLimiter,
  validateBody(aiChatRequestSchema),
  asyncHandler(async (req, res) => {
    const response = await sendChatMessage(req.auth!, req.body);
    res.json(response);
  }),
);

aiRouter.get(
  "/conversations",
  asyncHandler(async (req, res) => {
    const formId = typeof req.query.formId === "string" ? req.query.formId : undefined;
    const conversations = await listConversations(req.auth!, formId);
    res.json(conversations);
  }),
);

aiRouter.get(
  "/conversations/:id",
  asyncHandler(async (req, res) => {
    const detail = await getConversation(req.auth!, req.params.id);
    res.json(detail);
  }),
);

aiRouter.post(
  "/actions/:id/confirm",
  asyncHandler(async (req, res) => {
    const result = await confirmAction(req.auth!, req.params.id);
    res.json(result);
  }),
);

aiRouter.post(
  "/actions/:id/reject",
  asyncHandler(async (req, res) => {
    await rejectAction(req.auth!, req.params.id);
    res.status(204).send();
  }),
);

// Thin, non-chat convenience wrappers around the same read-only tool
// functions aiAssistantService dispatches to internally — same
// subsidiary-scoping, just reachable directly without a chat round-trip
// (see the plan's §8 of the brief).
aiRouter.get(
  "/campaigns/search",
  asyncHandler(async (req, res) => {
    // Reuses the shared discriminated-union tool-call schema (the only
    // exported validator for SearchCampaignsArgs) rather than duplicating
    // its field rules here — a small indirection since the per-tool arg
    // schemas themselves aren't part of the package's public surface.
    const parsed = aiToolCallSchema.safeParse({
      tool: "SEARCH_CAMPAIGNS",
      args: {
        searchText: typeof req.query.searchText === "string" ? req.query.searchText : undefined,
        projectCode: typeof req.query.projectCode === "string" ? req.query.projectCode : undefined,
        status: typeof req.query.status === "string" ? req.query.status : undefined,
      },
    });
    if (!parsed.success || parsed.data.tool !== "SEARCH_CAMPAIGNS") {
      res.status(400).json({ error: "validation failed" });
      return;
    }
    const results = await searchCampaigns(toCallerContext(req.auth!), parsed.data.args);
    res.json(results);
  }),
);

aiRouter.get(
  "/campaigns/:id",
  asyncHandler(async (req, res) => {
    const campaign = await getCampaign(toCallerContext(req.auth!), { formId: req.params.id });
    if (!campaign) throw new NotFoundError("campaign not found");
    res.json(campaign);
  }),
);
