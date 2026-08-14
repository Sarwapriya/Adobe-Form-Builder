import type { ChipProps } from "@mui/material";
import type { UploadStatus } from "../api/uploadsApi";
import type { QaRun } from "../api/qaApi";

/** Shared status->chip-color map for every upload-status chip in the app
 * (AdminHistoryPage's and UploadHistoryPage's tables). "generated" (not yet
 * submitted) is deliberately distinct from "submitted" (done) — they used to
 * both render as "success", which visually hid the fact a "generated" row
 * still needs the uploader to submit it. */
export const uploadStatusColor: Record<UploadStatus, ChipProps["color"]> = {
  uploaded: "default",
  generated: "info",
  submitted: "success",
  failed: "error",
};

/** Shared status->chip-color map for QA-run status chips (QaRunDialog). */
export const qaRunStatusColor: Record<QaRun["status"], ChipProps["color"]> = {
  pending: "default",
  running: "info",
  passed: "success",
  failed: "error",
  error: "warning",
};
