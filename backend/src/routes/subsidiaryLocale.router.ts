import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/authJwt";
import { listSubsidiaryLocales } from "../services/subsidiaryLocaleService";

export const subsidiaryLocaleRouter = Router();

subsidiaryLocaleRouter.use(requireAuth);

// Every authenticated user (not just admins) needs this to populate a locale
// picker for one subsidiary — admin's own Form Initiator (a convenience option
// alongside free text) and a subsidiary user's own ad-hoc form builder
// (restricted to this list, no free text). Admin-only management (add/remove)
// lives under /api/v1/admin/subsidiary-locales instead, same split as
// project-codes/subsidiaries.
subsidiaryLocaleRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const subsidiary = typeof req.query.subsidiary === "string" ? req.query.subsidiary : undefined;
    if (!subsidiary) {
      res.json([]);
      return;
    }
    const locales = await listSubsidiaryLocales(subsidiary);
    res.json(locales);
  })
);
