import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/authJwt";
import { submitUpload } from "../services/submissionService";

export const submitRouter = Router();

submitRouter.use(requireAuth);

submitRouter.post(
  "/:uploadId",
  asyncHandler(async (req, res) => {
    const isAdmin = req.auth!.role === "admin";
    const result = await submitUpload(req.params.uploadId, req.auth!.sub, isAdmin);

    if (result.outcome === "not_found") {
      res.status(404).json({ error: "upload not found" });
      return;
    }
    if (result.outcome === "not_ready") {
      res.status(409).json({ error: "upload has not been successfully generated yet and cannot be submitted" });
      return;
    }

    res.json({ upload: result.upload });
  }),
);
