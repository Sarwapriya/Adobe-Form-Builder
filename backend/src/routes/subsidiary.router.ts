import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/authJwt";
import { listSubsidiaries } from "../services/subsidiaryService";

export const subsidiaryRouter = Router();

subsidiaryRouter.use(requireAuth);

// Every authenticated user (not just admins) needs this to populate the
// upload form's "Subsidiary" dropdown — admin-only management (creating new
// ones) lives under /api/v1/admin/subsidiaries instead. There's no
// open/closed distinction on a subsidiary itself, so this is always the full
// list — see subsidiaryProjectBlockService.ts for the actual per-subsidiary
// upload restriction.
subsidiaryRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const subsidiaries = await listSubsidiaries();
    res.json(subsidiaries);
  })
);
