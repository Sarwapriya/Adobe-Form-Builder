import type { ChipProps } from "@mui/material";
import type { QaRun } from "../api/qaApi";

/** Shared status->chip-color map for QA-run status chips (QaRunDialog). */
export const qaRunStatusColor: Record<QaRun["status"], ChipProps["color"]> = {
  pending: "default",
  running: "info",
  passed: "success",
  failed: "error",
  error: "warning",
};
