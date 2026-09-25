import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  LinearProgress,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RefreshIcon from "@mui/icons-material/Refresh";
import { ApiError } from "../../api/apiClient";
import { getResourceChecks, startResourceCheck, type ResourceCheck } from "../../api/formBuilderApi";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { SectionHeader } from "../common/SectionHeader";
import { showToast } from "../../store/toastStore";

const ACTIVE_POLL_MS = 15_000;
const IDLE_POLL_MS = 60_000;

function isActive(check: ResourceCheck | undefined): boolean {
  return check?.status === "scheduled" || check?.status === "running";
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function minutesUntil(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 60_000));
}

/** "samsung-mena-mid-prod7-1" → "prod7-1" for compact column headers. */
function shortHost(host: string): string {
  return host.replace(/^samsung-mena-mid-/, "").replace(/\.campaign\.adobe\.com$/, "");
}

function describe(check: ResourceCheck): { label: string; color: "default" | "info" | "success" | "error" | "warning"; detail: string } {
  const kind = check.trigger === "recheck" ? "Re-check" : check.trigger === "manual" ? "Manual check" : "Automatic check";
  switch (check.status) {
    case "scheduled": {
      const minutes = minutesUntil(check.scheduledFor);
      return {
        label: "Scheduled",
        color: "info",
        detail: `${kind} at ${formatTime(check.scheduledFor)}${minutes > 0 ? ` (in ${minutes} min)` : " (starting shortly)"}`,
      };
    }
    case "running":
      return { label: "Checking…", color: "info", detail: `${kind}: checking ${check.totalUrls} URLs` };
    case "passed":
      return { label: `All ${check.totalUrls} URLs OK`, color: "success", detail: `${kind} at ${formatTime(check.completedAt)}` };
    case "failed":
      return {
        label: `${check.failedUrls} of ${check.totalUrls} failed`,
        color: "error",
        detail: `${kind} at ${formatTime(check.completedAt)}${check.notifiedAt ? " · admins emailed" : ""}`,
      };
    default:
      return { label: "Check error", color: "warning", detail: check.errorMessage ?? "The check could not run." };
  }
}

function ResultsTable({ check }: { check: ResourceCheck }) {
  const byKey = new Map(check.results.map((r) => [`${r.fileName}\u0000${r.host}`, r]));
  return (
    <TableContainer sx={{ mt: 1.5, maxHeight: 360 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>File</TableCell>
            {check.hosts.map((host) => (
              <TableCell key={host} align="center">
                <Tooltip title={host}>
                  <span>{shortHost(host)}</span>
                </Tooltip>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {check.fileNames.map((fileName) => (
            <TableRow key={fileName} hover>
              <TableCell sx={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{fileName}</TableCell>
              {check.hosts.map((host) => {
                const r = byKey.get(`${fileName}\u0000${host}`);
                if (!r) return <TableCell key={host} align="center">–</TableCell>;
                const label = r.statusCode !== null ? String(r.statusCode) : "no response";
                return (
                  <TableCell key={host} align="center">
                    <Tooltip title={r.error ? `${r.url}\n${r.error}` : `${r.url} · ${r.elapsedMs ?? "?"} ms`}>
                      <Link
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="none"
                        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: r.ok ? "success.main" : "error.main" }}
                        aria-label={`${fileName} on ${host}: ${r.ok ? "OK" : "failed"} (${label})`}
                      >
                        {r.ok ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
                        <Typography variant="caption">{label}</Typography>
                      </Link>
                    </Tooltip>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * "Adobe server availability" for a published form: after each successful
 * SFTP deploy the backend checks (after a configurable delay, default 20 min)
 * that every generated file is served by every Adobe Campaign frontal server
 * (resource_check_service.py). Shows the latest check, its per-file ×
 * per-server results, and a "Check now" button. Polls while a check is
 * scheduled/running, and slowly otherwise so a newly scheduled check shows up
 * after a Publish/Deploy without a reload.
 */
export function ResourceCheckPanel({ formId }: { formId: string }) {
  const status = useFormBuilderStore((s) => s.status);
  const publishing = useFormBuilderStore((s) => s.publishing);
  const [checks, setChecks] = useState<ResourceCheck[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [starting, setStarting] = useState(false);
  const [expanded, setExpanded] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await getResourceChecks(formId);
      setChecks(response.checks);
      setEnabled(response.enabled);
    } catch {
      // Background refresh — keep showing the last known state.
    } finally {
      setLoaded(true);
    }
  }, [formId]);

  useEffect(() => {
    if (!publishing) void refresh();
  }, [refresh, publishing, status]);

  const latest = checks[0];
  // The newest check with results (a scheduled re-check has none yet).
  const latestCompleted = checks.find((c) => c.status === "passed" || c.status === "failed");
  const pending = checks.find((c) => isActive(c));

  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), pending ? ACTIVE_POLL_MS : IDLE_POLL_MS);
    return () => window.clearInterval(timer);
  }, [refresh, pending]);

  if (!loaded || (status !== "published" && checks.length === 0)) return null;

  async function handleCheckNow() {
    setStarting(true);
    try {
      await startResourceCheck(formId);
      showToast("Checking the Adobe servers now…", "info");
      await refresh();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not start the check", "error");
    } finally {
      setStarting(false);
    }
  }

  const showTable = expanded ?? latestCompleted?.status === "failed";
  const latestInfo = latest ? describe(latest) : null;
  const completedInfo = latestCompleted && latestCompleted !== latest ? describe(latestCompleted) : null;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader
        icon={<FactCheckIcon fontSize="small" color="primary" />}
        title="Adobe server availability"
        action={
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={starting || status !== "published" || pending?.trigger === "manual"}
            onClick={() => void handleCheckNow()}
          >
            {starting ? "Starting…" : "Check now"}
          </Button>
        }
      />

      {!latest ? (
        <Typography variant="body2" color="text.secondary">
          {enabled
            ? "No checks yet. After the next successful Publish/Deploy, the files are checked automatically on every Adobe frontal server."
            : "Automatic checks are turned off (Configuration > Deployment). You can still use Check now."}
        </Typography>
      ) : (
        <Stack spacing={0.75}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip size="small" label={latestInfo!.label} color={latestInfo!.color} />
            <Typography variant="body2" color="text.secondary">
              {latestInfo!.detail}
            </Typography>
          </Stack>
          {completedInfo && (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="caption" color="text.secondary">
                Previous result:
              </Typography>
              <Chip size="small" variant="outlined" label={completedInfo.label} color={completedInfo.color} />
              <Typography variant="caption" color="text.secondary">
                {completedInfo.detail}
              </Typography>
            </Stack>
          )}
          {latest.status === "running" && <LinearProgress sx={{ borderRadius: 1 }} />}
          {latestCompleted && (
            <Box>
              <Button size="small" onClick={() => setExpanded(!showTable)} sx={{ px: 0.5 }}>
                {showTable ? "Hide details" : "Show details"}
              </Button>
              <Collapse in={showTable} unmountOnExit>
                <ResultsTable check={latestCompleted} />
              </Collapse>
            </Box>
          )}
        </Stack>
      )}
    </Paper>
  );
}
