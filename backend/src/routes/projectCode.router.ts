import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/authJwt";
import { isAdminRole } from "../entities/User";
import { listOpenProjectCodes, listOpenProjectCodesForSubsidiary } from "../services/projectCodeService";

export const projectCodeRouter = Router();

projectCodeRouter.use(requireAuth);

// Every authenticated user (not just admins) needs this to populate the
// upload form's "Project Code" dropdown — admin-only management (create,
// open/close) lives under /api/v1/admin/project-codes instead. With
// ?subsidiary=NAME, also excludes any code an admin has specifically blocked
// for that subsidiary (see subsidiaryProjectBlockService.ts) — without it,
// only the global open/closed state applies. A locked code is additionally
// excluded for non-admin callers (admins stay exempt from the lock — see
// ProjectCode.isLocked's own doc comment), so a subsidiary user never even
// sees a locked code as a selectable upload option.
projectCodeRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const excludeLocked = !isAdminRole(req.auth!.role);
    const subsidiary = typeof req.query.subsidiary === "string" ? req.query.subsidiary : undefined;
    const codes = subsidiary
      ? await listOpenProjectCodesForSubsidiary(subsidiary, excludeLocked)
      : await listOpenProjectCodes(excludeLocked);
    res.json(codes);
  })
);
