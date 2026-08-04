import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/authJwt";
import { regenerateUpload } from "../services/uploadService";

export const generateRouter = Router();

generateRouter.use(requireAuth);

generateRouter.post(
  "/:uploadId",
  asyncHandler(async (req, res) => {
    const isAdmin = req.auth!.role === "admin";
    const result = await regenerateUpload(req.params.uploadId, req.auth!.sub, isAdmin);

    if (result.outcome === "not_found") {
      res.status(404).json({ error: "upload not found" });
      return;
    }
    if (result.outcome === "locked") {
      res.status(409).json({
        error: "this upload has been submitted and generated-files locking is enabled; it cannot be regenerated",
      });
      return;
    }

    res.json({ validation: result.validation });
  }),
);
