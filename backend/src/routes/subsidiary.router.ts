import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/authJwt";
import { validateBody } from "../middleware/validate";
import { findSubsidiaryByName, listActiveSubsidiaries, setSubsidiaryNotificationEmails } from "../services/subsidiaryService";

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

// Lets a subsidiary-scoped standard user see and manage their *own*
// subsidiary's two extra notification-email addresses (see
// Subsidiary.notificationEmail1/2's own doc comment) without needing
// admin access — admins/superadmins keep full read/write over every
// subsidiary via /api/v1/admin/subsidiaries regardless, this is purely
// additive self-service for the one row a standard user is scoped to.
// req.auth.subsidiaryId is the subsidiary's *name*, not its id — see
// findSubsidiaryByName's own doc comment.
subsidiaryRouter.get(
  "/mine",
  asyncHandler(async (req, res) => {
    if (!req.auth!.subsidiaryId) {
      res.status(400).json({ error: "Your account isn't scoped to a subsidiary" });
      return;
    }
    const subsidiary = await findSubsidiaryByName(req.auth!.subsidiaryId);
    if (!subsidiary) {
      res.status(404).json({ error: "Subsidiary not found" });
      return;
    }
    res.json(subsidiary);
  })
);

const updateMineNotificationEmailSchema = z.object({
  notificationEmail1: z.preprocess((v) => (v === "" ? null : v), z.string().email().nullable().optional()),
  notificationEmail2: z.preprocess((v) => (v === "" ? null : v), z.string().email().nullable().optional()),
});

subsidiaryRouter.patch(
  "/mine/notification-email",
  validateBody(updateMineNotificationEmailSchema),
  asyncHandler(async (req, res) => {
    if (!req.auth!.subsidiaryId) {
      res.status(400).json({ error: "Your account isn't scoped to a subsidiary" });
      return;
    }
    const subsidiary = await findSubsidiaryByName(req.auth!.subsidiaryId);
    if (!subsidiary) {
      res.status(404).json({ error: "Subsidiary not found" });
      return;
    }
    const emails = req.body as z.infer<typeof updateMineNotificationEmailSchema>;
    const updated = await setSubsidiaryNotificationEmails(subsidiary.id, emails);
    res.json(updated);
  })
);
