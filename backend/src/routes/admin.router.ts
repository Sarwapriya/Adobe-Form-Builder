import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAdmin } from "../middleware/authJwt";
import { listAllUploads, incrementSubmissionCount } from "../services/uploadService";
import { computeDiff } from "../services/diffService";
import { NotFoundError } from "../utils/errors";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get(
  "/uploads",
  asyncHandler(async (req, res) => {
    const subsidiaryId =
      typeof req.query.subsidiaryId === "string" ? req.query.subsidiaryId : undefined;
    const uploads = await listAllUploads(subsidiaryId);
    res.json(uploads);
  })
);

adminRouter.post(
  "/submission/:fileId",
  asyncHandler(async (req, res) => {
    const newCount = await incrementSubmissionCount(req.params.fileId);
    if (newCount === null) {
      throw new NotFoundError(`Upload not found: ${req.params.fileId}`);
    }
    res.json({ submissionCount: newCount });
  })
);

adminRouter.get(
  "/diff",
  asyncHandler(async (req, res) => {
    const { oldFileId, newFileId } = req.query;
    if (typeof oldFileId !== "string" || typeof newFileId !== "string") {
      res.status(400).json({ error: "oldFileId and newFileId query params are required" });
      return;
    }

    const diff = await computeDiff(oldFileId, newFileId);
    res.json(diff);
  })
);
