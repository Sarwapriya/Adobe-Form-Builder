import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/authJwt";
import { listOpenProjectCodes, listOpenProjectCodesForSubsidiary } from "../services/projectCodeService";

export const projectCodeRouter = Router();

projectCodeRouter.use(requireAuth);

// Every authenticated user (not just admins) needs this to populate the
// upload form's "Project Code" dropdown — admin-only management (create,
// open/close) lives under /api/v1/admin/project-codes instead. With
// ?subsidiary=NAME, also excludes any code an admin has specifically blocked
// for that subsidiary (see subsidiaryProjectBlockService.ts) — without it,
// only the global open/closed state applies.
projectCodeRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const subsidiary = typeof req.query.subsidiary === "string" ? req.query.subsidiary : undefined;
    const codes = subsidiary ? await listOpenProjectCodesForSubsidiary(subsidiary) : await listOpenProjectCodes();
    res.json(codes);
  })
);
