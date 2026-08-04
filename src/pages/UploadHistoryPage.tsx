import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { ApiError } from "../api/apiClient";
import {
  deleteUpload,
  listMyUploads,
  regenerateUpload,
  submitUpload,
  uploadWorkbook,
  type UploadListItem,
  type ValidationResult,
} from "../api/uploadsApi";

const STATUS_COLOR: Record<UploadListItem["status"], "default" | "success" | "error" | "warning"> = {
  uploaded: "default",
  generated: "success",
  submitted: "success",
  failed: "error",
};

/** The authenticated user's own upload workflow: submit a new workbook (the
 * server auto-generates on upload — see uploadsApi.uploadWorkbook), then see
 * and act on their own history. Always scoped to the caller (GET
 * /api/v1/uploads never takes a userId param) — the equivalent cross-user
 * view is AdminDashboardPage. */
export function UploadHistoryPage() {
  const [subsidiaryId, setSubsidiaryId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);

  const [rows, setRows] = useState<UploadListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); // MUI TablePagination is 0-based
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const result = await listMyUploads({ page: page + 1, pageSize, sortBy: "uploadDate", sortDir: "DESC" });
      setRows(result.items);
      setTotal(result.total);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to load upload history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [page, pageSize]);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!file || !subsidiaryId.trim()) return;

    setUploading(true);
    setUploadError(null);
    setLastValidation(null);
    try {
      const response = await uploadWorkbook(subsidiaryId.trim(), file);
      setLastValidation(response.validation);
      setFile(null);
      setSubsidiaryId("");
      setPage(0);
      await refresh();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    setActionError(null);
    try {
      await deleteUpload(id);
      await refresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  async function handleRegenerate(id: string) {
    setActionError(null);
    try {
      await regenerateUpload(id);
      await refresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Regeneration failed");
    }
  }

  async function handleSubmit(id: string) {
    setActionError(null);
    try {
      await submitUpload(id);
      await refresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Submit failed");
    }
  }

  return (
    <Box>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          Upload a workbook
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Submit an Excel workbook to generate a new campaign form, then track it below.
        </Typography>
      </Stack>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <UploadFileIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              New upload
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Generation runs automatically after upload
            </Typography>
          </Box>
        </Stack>

        <Box
          component="form"
          onSubmit={handleUpload}
          sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}
        >
          <TextField
            label="Subsidiary"
            value={subsidiaryId}
            onChange={(e) => setSubsidiaryId(e.target.value)}
            required
            size="small"
          />
          <Button variant="outlined" component="label">
            {file ? file.name : "Choose .xlsx/.xls file"}
            <input type="file" accept=".xlsx,.xls" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </Button>
          <Button type="submit" variant="contained" disabled={!file || !subsidiaryId.trim() || uploading}>
            {uploading ? "Uploading..." : "Upload & Generate"}
          </Button>
        </Box>

        {uploadError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {uploadError}
          </Alert>
        )}

        {lastValidation && lastValidation.errors.length === 0 && lastValidation.warnings.length === 0 && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Uploaded and generated successfully.
          </Alert>
        )}
        {lastValidation && lastValidation.errors.length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {lastValidation.errors.length} blocking error(s):
            <ul>
              {lastValidation.errors.map((issue, i) => (
                <li key={i}>{issue.message}</li>
              ))}
            </ul>
          </Alert>
        )}
        {lastValidation && lastValidation.warnings.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {lastValidation.warnings.length} warning(s):
            <ul>
              {lastValidation.warnings.map((issue, i) => (
                <li key={i}>{issue.message}</li>
              ))}
            </ul>
          </Alert>
        )}
      </Paper>

      <Typography variant="h5" component="h2" gutterBottom fontWeight={700}>
        Your upload history
      </Typography>

      {actionError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {actionError}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Subsidiary</TableCell>
                <TableCell>File</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">No uploads yet — submit a workbook above to get started.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.subsidiaryId}</TableCell>
                    <TableCell>{row.fileName}</TableCell>
                    <TableCell>v{row.version}</TableCell>
                    <TableCell>
                      <Chip label={row.status} color={STATUS_COLOR[row.status]} size="small" />
                    </TableCell>
                    <TableCell>{new Date(row.uploadDate).toLocaleString()}</TableCell>
                    <TableCell>{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "—"}</TableCell>
                    <TableCell align="right">
                      {row.status === "generated" && (
                        <Tooltip title="Submit">
                          <IconButton size="small" onClick={() => handleSubmit(row.id)}>
                            <SendIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {row.status !== "submitted" && (
                        <Tooltip title="Regenerate">
                          <IconButton size="small" onClick={() => handleRegenerate(row.id)}>
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {row.status !== "submitted" && (
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(row.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </Paper>
    </Box>
  );
}
