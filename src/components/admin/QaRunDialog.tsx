import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { alpha } from "@mui/material/styles";
import { ApiError } from "../../api/apiClient";
import {
  createQaRun,
  downloadQaReport,
  getQaRunDetail,
  listQaRuns,
  type QaRun,
  type QaRunSubject,
  type QaRunVariant,
  type QaTestCaseResult,
} from "../../api/qaApi";
import { downloadBlob } from "../../utils/download";
import { qaRunStatusColor } from "../../app/statusColors";

const VARIANT_LABELS: Record<QaRunVariant, string> = { ff: "Full Form", oc: "One-Click" };

const CATEGORY_LABELS: Record<string, string> = {
  structure: "Page structure",
  "field-validation": "Field validation",
  "field-interaction": "Field interaction",
  "required-enforcement": "Required-field enforcement",
  "submit-gating": "Submit button gating",
  "submit-flow": "Submit flow",
};

const POLL_INTERVAL_MS = 2000;

/** A stable string key for a QaRunSubject — for effect dependency arrays,
 * since the subject object itself is a fresh reference on every render. */
function subjectKey(subject: QaRunSubject): string {
  return subject.kind === "contribution" ? subject.contributionId : subject.formId;
}

const SUBJECT_NOUN: Record<QaRunSubject["kind"], string> = {
  contribution: "submission",
  adhoc: "form",
};

/**
 * Admin-only "run QA automation" dialog for one subject — a pending
 * Translate & Extend contribution, or an ad-hoc form awaiting review: pick a
 * generated variant (Full Form / One-Click), trigger a real Playwright run
 * (see backend qaRunService.ts — a headless-Chromium session against the
 * exact same self-contained HTML/CSS/JS the "Preview" button renders, via an
 * in-memory merge/generate for a "contribution"/"adhoc" subject that hasn't
 * been approved/published yet), watch it move from pending -> running ->
 * passed/failed/error, then inspect every individual test case (which fields
 * need fixing, and why) or download the whole thing as a standalone HTML
 * report.
 *
 * `availableVariants` restricts the picker to whichever variant(s) this
 * subject's form's own BuilderConfig.variants actually offers — offering one
 * that isn't available would just lead to a 409 from the backend's own check.
 */
export function QaRunDialog({
  subject,
  availableVariants,
  open,
  onClose,
}: {
  subject: QaRunSubject;
  availableVariants: QaRunVariant[];
  open: boolean;
  onClose: () => void;
}) {
  const [variant, setVariant] = useState<QaRunVariant>(availableVariants[0] ?? "ff");
  const [runs, setRuns] = useState<QaRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [results, setResults] = useState<QaTestCaseResult[] | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function refreshRuns() {
    setLoadingRuns(true);
    try {
      const rows = await listQaRuns(subject);
      setRuns(rows);
      if (rows.length > 0 && !selectedRunId) setSelectedRunId(rows[0].id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load QA runs");
    } finally {
      setLoadingRuns(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setSelectedRunId(null);
    setResults(null);
    setVariant(availableVariants[0] ?? "ff");
    void refreshRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subjectKey(subject)]);

  // Polls the selected run while it's still pending/running, and always
  // refreshes its detail (results table) whenever the selection changes.
  // Uses a single setTimeout re-armed only after each request settles —
  // NOT setInterval, which would stack a new repeating timer on top of the
  // one already ticking every time `load` re-fires while still pending,
  // causing runaway exponential request growth (this is exactly what
  // flooded the backend's rate limiter and locked out login earlier).
  useEffect(() => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
    if (!selectedRunId) return;

    let cancelled = false;

    async function load() {
      try {
        const detail = await getQaRunDetail(selectedRunId!);
        if (cancelled) return;
        setResults(detail.results);
        setRuns((prev) => prev.map((r) => (r.id === detail.run.id ? detail.run : r)));
        if (detail.run.status === "pending" || detail.run.status === "running") {
          pollTimer.current = setTimeout(load, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load QA run detail");
      }
    }
    void load();

    return () => {
      cancelled = true;
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRunId]);

  async function handleRun() {
    setStarting(true);
    setError(null);
    try {
      const created = await createQaRun(subject, variant);
      setRuns((prev) => [created, ...prev]);
      setSelectedRunId(created.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start QA run");
    } finally {
      setStarting(false);
    }
  }

  async function handleDownload(run: QaRun) {
    setDownloadingId(run.id);
    setError(null);
    try {
      const blob = await downloadQaReport(run.id);
      downloadBlob(blob, `qa-report-${run.variant}-${run.id}.html`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  }

  const selectedRun = runs.find((r) => r.id === selectedRunId) ?? null;
  const isRunActive = selectedRun?.status === "pending" || selectedRun?.status === "running";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6" fontWeight={700}>
          QA automation
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5, flexWrap: "wrap" }}>
          <TextField
            select
            label="Variant"
            size="small"
            sx={{ minWidth: 160 }}
            value={variant}
            onChange={(e) => setVariant(e.target.value as QaRunVariant)}
          >
            {availableVariants.map((v) => (
              <MenuItem key={v} value={v}>
                {VARIANT_LABELS[v]}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            disabled={starting || availableVariants.length === 0}
            onClick={handleRun}
          >
            {starting ? "Starting..." : "Run QA"}
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loadingRuns ? (
          <CircularProgress size={20} />
        ) : runs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No QA runs yet for this {SUBJECT_NOUN[subject.kind]} — pick a variant above and click "Run QA".
          </Typography>
        ) : (
          <>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              {runs.map((run) => (
                <Chip
                  key={run.id}
                  label={`${run.variant.toUpperCase()} · ${run.status}${
                    run.status === "passed" || run.status === "failed" ? ` (${run.passedTests}/${run.totalTests})` : ""
                  }`}
                  color={qaRunStatusColor[run.status]}
                  variant={run.id === selectedRunId ? "filled" : "outlined"}
                  onClick={() => setSelectedRunId(run.id)}
                  icon={run.status === "pending" || run.status === "running" ? <CircularProgress size={14} /> : undefined}
                />
              ))}
            </Stack>

            {selectedRun && (
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {selectedRun.variant.toUpperCase()} run · {selectedRun.status}
                  </Typography>
                  {isRunActive && (
                    <Typography variant="caption" color="text.secondary">
                      Running in the background — this updates automatically.
                    </Typography>
                  )}
                  {(selectedRun.status === "passed" || selectedRun.status === "failed") && (
                    <Tooltip title="Download standalone HTML report">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(selectedRun)}
                          disabled={downloadingId === selectedRun.id}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Stack>

                {selectedRun.status === "error" && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    The QA tool itself failed to complete this run: {selectedRun.errorMessage ?? "unknown error"}
                  </Alert>
                )}

                {(selectedRun.status === "passed" || selectedRun.status === "failed") && (
                  <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
                    <Box sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: (t) => alpha(t.palette.success.main, 0.12) }}>
                      <Typography variant="caption" sx={{ color: "success.dark", display: "block" }} fontWeight={700}>
                        PASSED
                      </Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color: "success.dark" }} lineHeight={1.2}>
                        {selectedRun.passedTests} / {selectedRun.totalTests}
                      </Typography>
                    </Box>
                    <Box sx={{ px: 2, py: 1, borderRadius: 2, bgcolor: (t) => alpha(t.palette.error.main, 0.12) }}>
                      <Typography variant="caption" sx={{ color: "error.dark", display: "block" }} fontWeight={700}>
                        FAILED
                      </Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color: "error.dark" }} lineHeight={1.2}>
                        {selectedRun.failedTests} / {selectedRun.totalTests}
                      </Typography>
                    </Box>
                  </Stack>
                )}

                {results && results.length > 0 && (
                  <TableContainer sx={{ maxHeight: 360 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell width={90}>Result</TableCell>
                          <TableCell width={160}>Category</TableCell>
                          <TableCell>Check</TableCell>
                          <TableCell width={80}>Field</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {results.map((r) => (
                          <TableRow key={r.id} hover>
                            <TableCell>
                              <Chip
                                label={r.status === "passed" ? "Pass" : "Fail"}
                                color={r.status === "passed" ? "success" : "error"}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{CATEGORY_LABELS[r.category] ?? r.category}</TableCell>
                            <TableCell>
                              <Typography variant="body2">{r.name}</Typography>
                              {r.status === "failed" && r.message && (
                                <Typography variant="caption" color="error.main" sx={{ display: "block" }}>
                                  {r.message}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>{r.fieldId ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
