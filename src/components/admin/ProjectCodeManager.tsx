import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Alert, Box, Button, Chip, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import EditOffIcon from "@mui/icons-material/EditOff";
import EditIcon from "@mui/icons-material/Edit";
import BadgeIcon from "@mui/icons-material/Badge";
import { ApiError } from "../../api/apiClient";
import {
  createProjectCode,
  listAllProjectCodes,
  setProjectCodeDateRange,
  setProjectCodeLocked,
  setProjectCodeOpen,
  setProjectCodeValue,
  type ProjectCode,
} from "../../api/adminApi";
import { SectionHeader } from "../common/SectionHeader";
import { LoadingState } from "../common/LoadingState";

/** Backend returns Date columns as full ISO datetime strings ("2026-06-01T00:00:00.000Z")
 * once serialized to JSON — an <input type="date"> needs exactly "YYYY-MM-DD". */
function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

/**
 * Inline admin panel for managing project codes (campaigns): create new
 * ones, rename a code's own text value, toggle a code open/closed, toggle a
 * separate locked/unlocked freeze, and set/edit each one's descriptive campaign
 * date range plus its cutoff date.
 * Closing a code blocks new uploads against it (enforced server-side — see
 * uploadService.createUpload) without touching uploads already made under
 * it; renaming likewise never touches anything already uploaded under the
 * old value (Upload.projectCode is a text snapshot, not a live reference —
 * see that column's own doc comment). Locking is independent of open/closed —
 * it additionally blocks subsidiary Form Builder contributions (which open/closed
 * never covers) and is the precondition for generating a Question Master; admins
 * stay exempt from it (see backend ProjectCode entity's own doc comment). Start/end
 * date are purely informational
 * and never enforced; cutoffDate isn't enforced here either but is meaningful
 * — see backend ProjectCode entity's own doc comment. Lives on
 * ConfigurationPage, admin/superadmin only (gated by AdminRoute);
 * the upload form's own dropdown (any user, open codes only) is a separate
 * endpoint — see projectCodesApi.ts.
 */
export function ProjectCodeManager({ onChange }: { onChange?: () => void } = {}) {
  const [codes, setCodes] = useState<ProjectCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newCutoffDate, setNewCutoffDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [togglingLockedId, setTogglingLockedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setCodes(await listAllProjectCodes());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load project codes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newCode.trim()) return;

    setCreating(true);
    setError(null);
    try {
      await createProjectCode(newCode.trim(), newStartDate || undefined, newEndDate || undefined, newCutoffDate || undefined);
      setNewCode("");
      setNewStartDate("");
      setNewEndDate("");
      setNewCutoffDate("");
      await refresh();
      onChange?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create project code");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(code: ProjectCode) {
    setTogglingId(code.id);
    setError(null);
    try {
      await setProjectCodeOpen(code.id, !code.isOpen);
      await refresh();
      onChange?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update project code");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleToggleLock(code: ProjectCode) {
    setTogglingLockedId(code.id);
    setError(null);
    try {
      await setProjectCodeLocked(code.id, !code.isLocked);
      await refresh();
      onChange?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update project code");
    } finally {
      setTogglingLockedId(null);
    }
  }

  async function handleSaveDateRange(id: string, startDate: string, endDate: string, cutoffDate: string) {
    setSavingId(id);
    setError(null);
    try {
      await setProjectCodeDateRange(id, startDate || null, endDate || null, cutoffDate || null);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update campaign dates");
    } finally {
      setSavingId(null);
    }
  }

  async function handleRename(id: string, code: string) {
    setRenamingId(id);
    setError(null);
    try {
      await setProjectCodeValue(id, code);
      await refresh();
      onChange?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to rename project code");
    } finally {
      setRenamingId(null);
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader icon={<BadgeIcon fontSize="small" color="primary" />} title="Campaign - Project Code" />

      <Box component="form" onSubmit={handleCreate} sx={{ display: "flex", gap: 1.5, mb: 1.5, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          label="New project code"
          size="small"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
        />
        <TextField
          label="Start date"
          type="date"
          size="small"
          value={newStartDate}
          onChange={(e) => setNewStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End date"
          type="date"
          size="small"
          value={newEndDate}
          onChange={(e) => setNewEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Cutoff date"
          type="date"
          size="small"
          value={newCutoffDate}
          onChange={(e) => setNewCutoffDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button type="submit" variant="outlined" disabled={!newCode.trim() || creating}>
          {creating ? "Adding..." : "Add"}
        </Button>
      </Box>

      {error && !loading && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingState />
      ) : codes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No project codes yet — add one above so users can select it when uploading.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {codes.map((code) => (
            <ProjectCodeRow
              key={code.id}
              code={code}
              toggling={togglingId === code.id}
              togglingLocked={togglingLockedId === code.id}
              saving={savingId === code.id}
              renaming={renamingId === code.id}
              onToggle={() => handleToggle(code)}
              onToggleLock={() => handleToggleLock(code)}
              onSaveDateRange={(startDate, endDate, cutoffDate) => handleSaveDateRange(code.id, startDate, endDate, cutoffDate)}
              onRename={(newValue) => handleRename(code.id, newValue)}
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

function ProjectCodeRow({
  code,
  toggling,
  togglingLocked,
  saving,
  renaming,
  onToggle,
  onToggleLock,
  onSaveDateRange,
  onRename,
}: {
  code: ProjectCode;
  toggling: boolean;
  togglingLocked: boolean;
  saving: boolean;
  renaming: boolean;
  onToggle: () => void;
  onToggleLock: () => void;
  onSaveDateRange: (startDate: string, endDate: string, cutoffDate: string) => void;
  onRename: (code: string) => void;
}) {
  const [startDate, setStartDate] = useState(toDateInputValue(code.startDate));
  const [endDate, setEndDate] = useState(toDateInputValue(code.endDate));
  const [cutoffDate, setCutoffDate] = useState(toDateInputValue(code.cutoffDate));
  const [codeValue, setCodeValue] = useState(code.code);

  // Re-sync local edits if the underlying row changes from elsewhere (e.g.
  // after a refresh following a successful save).
  useEffect(() => {
    setStartDate(toDateInputValue(code.startDate));
    setEndDate(toDateInputValue(code.endDate));
    setCutoffDate(toDateInputValue(code.cutoffDate));
  }, [code.startDate, code.endDate, code.cutoffDate]);

  useEffect(() => {
    setCodeValue(code.code);
  }, [code.code]);

  const isDirty =
    startDate !== toDateInputValue(code.startDate) ||
    endDate !== toDateInputValue(code.endDate) ||
    cutoffDate !== toDateInputValue(code.cutoffDate);
  const isCodeDirty = codeValue.trim() !== code.code && codeValue.trim().length > 0;

  return (
    <Box sx={(t) => ({ px: 1.5, py: 1.25, borderRadius: 2, bgcolor: alpha(t.palette.text.primary, 0.03) })}>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
        <TextField
          label="Project code"
          size="small"
          value={codeValue}
          onChange={(e) => setCodeValue(e.target.value)}
          sx={{ minWidth: 160 }}
        />
        <Button size="small" variant="text" disabled={!isCodeDirty || renaming} onClick={() => onRename(codeValue.trim())}>
          {renaming ? "Saving..." : "Save code"}
        </Button>
        <Chip
          label={code.isOpen ? "Open" : "Closed"}
          color={code.isOpen ? "success" : "default"}
          icon={code.isOpen ? <LockOpenIcon /> : <LockIcon />}
          onClick={onToggle}
          disabled={toggling}
          title={code.isOpen ? "Open — click to close" : "Closed — click to reopen"}
          sx={{ minWidth: 100 }}
        />
        <Chip
          label={code.isLocked ? "Locked" : "Unlocked"}
          color={code.isLocked ? "warning" : "default"}
          icon={code.isLocked ? <EditOffIcon /> : <EditIcon />}
          onClick={onToggleLock}
          disabled={togglingLocked}
          title={
            code.isLocked
              ? "Locked — subsidiary uploads/contributions are frozen; click to unlock"
              : "Unlocked — click to freeze subsidiary uploads/contributions and allow generating a Question Master"
          }
          sx={{ minWidth: 100 }}
        />
      </Stack>
      <Divider sx={{ my: 1 }} />
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
        <TextField
          label="Start date"
          type="date"
          size="small"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End date"
          type="date"
          size="small"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Cutoff date"
          type="date"
          size="small"
          value={cutoffDate}
          onChange={(e) => setCutoffDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button size="small" variant="text" disabled={!isDirty || saving} onClick={() => onSaveDateRange(startDate, endDate, cutoffDate)}>
          {saving ? "Saving..." : "Save dates"}
        </Button>
      </Stack>
    </Box>
  );
}
