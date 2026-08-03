import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/authJwt";
import { uploadMiddleware } from "../services/fileService";
import { recordUpload, listUploadsForSubsidiary } from "../services/uploadService";

export const uploadRouter = Router();

uploadRouter.post(
  "/:subsidiaryId",
  requireAuth,
  uploadMiddleware.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "file is required" });
      return;
    }

    const uploadedBy = String(req.auth?.sub ?? "unknown");
    const upload = await recordUpload(req.params.subsidiaryId, req.file, uploadedBy);

    res.status(201).json({
      success: true,
      fileId: upload.fileId,
      filePath: upload.filePath,
    });
  })
);

uploadRouter.get(
  "/:subsidiaryId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const uploads = await listUploadsForSubsidiary(req.params.subsidiaryId);
    res.json(uploads);
  })
);
