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
      <Typography variant="h4" component="h1" gutterBottom>
        Upload a workbook
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
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

      <Typography variant="h5" component="h2" gutterBottom>
        Your upload history
      </Typography>

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}

      <Paper>
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
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No uploads yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.subsidiaryId}</TableCell>
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
