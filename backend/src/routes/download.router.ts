import fs from "fs";
import path from "path";
import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { optionalAuth } from "../middleware/authJwt";
import { findUploadById } from "../services/uploadService";
import { absoluteFilePath } from "../services/fileService";
import { NotFoundError } from "../utils/errors";

export const downloadRouter = Router();

downloadRouter.get(
  "/:fileId",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const upload = await findUploadById(req.params.fileId);
    if (!upload) {
      throw new NotFoundError(`Upload not found: ${req.params.fileId}`);
    }

    const absolutePath = path.resolve(absoluteFilePath(upload.filePath));
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundError(`Stored file missing on disk for ${req.params.fileId}`);
    }

    res.download(absolutePath, upload.fileName);
  })
);
