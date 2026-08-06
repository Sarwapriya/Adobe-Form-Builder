import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/authJwt";
import { listActiveSubsidiaries } from "../services/subsidiaryService";

export const subsidiaryRouter = Router();

subsidiaryRouter.use(requireAuth);

// Every authenticated user (not just admins) needs this to populate the
// upload form's and user-creation form's "Subsidiary" dropdowns — a disabled
// subsidiary shouldn't even appear as an option, not just be rejected on
// submit. Admin-only management (creating, disabling, deleting — also seeing
// disabled ones) lives under /api/v1/admin/subsidiaries instead.
subsidiaryRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const subsidiaries = await listActiveSubsidiaries();
    res.json(subsidiaries);
  })
);
