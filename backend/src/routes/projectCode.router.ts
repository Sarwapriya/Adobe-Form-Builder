import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/authJwt";
import { listOpenProjectCodes } from "../services/projectCodeService";

export const projectCodeRouter = Router();

projectCodeRouter.use(requireAuth);

// Every authenticated user (not just admins) needs this to populate the
// upload form's "Project Code" dropdown — admin-only management (create,
// open/close) lives under /api/v1/admin/project-codes instead.
projectCodeRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const codes = await listOpenProjectCodes();
    res.json(codes);
  })
);
