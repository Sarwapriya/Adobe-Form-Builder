import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ScienceIcon from "@mui/icons-material/Science";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { DataGrid, type GridColDef, type GridPaginationModel, type GridSortModel } from "@mui/x-data-grid";
import { ApiError } from "../api/apiClient";
import {
  downloadUploadZip,
  listAllProjectCodes,
  listUploadsForAdmin,
  previewUpload,
  type AdminListParams,
  type AdminUploadListItem,
  type ProjectCode,
} from "../api/adminApi";
import { downloadBlob } from "../utils/download";
import { QaRunDialog } from "../components/admin/QaRunDialog";

/**
 * Admin-only view of every *submitted* upload across every user — an upload
 * only appears here once its uploader has submitted it (see
 * adminUploadService.listUploadsForAdmin, which hardcodes the submitted-only
 * filter server-side; not just a UI default). In-progress and failed uploads
 * live on the separate AdminHistoryPage. Search/filter/sort/pagination
 * handled server-side — the grid never fetches more than one page at a time,
 * even with thousands of uploads.
 */
export function AdminDashboardPage() {
  const [rows, setRows] = useState<AdminUploadListItem[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [qaDialogUploadId, setQaDialogUploadId] = useState<string | null>(null);

  const [subsidiaryFilter, setSubsidiaryFilter] = useState("");
  const [projectCodeFilter, setProjectCodeFilter] = useState("");
  const [projectCodes, setProjectCodes] = useState<ProjectCode[]>([]);
  const [searchFilter, setSearchFilter] = useState("");

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: "uploadDate", sort: "desc" }]);

  const params = useMemo<AdminListParams>(() => {
    const sort = sortModel[0];
    return {
      subsidiaryId: subsidiaryFilter.trim() || undefined,
      projectCode: projectCodeFilter || undefined,
      search: searchFilter.trim() || undefined,
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
      sortBy: (sort?.field as AdminListParams["sortBy"]) ?? "uploadDate",
      sortDir: sort?.sort === "asc" ? "ASC" : "DESC",
    };
  }, [subsidiaryFilter, projectCodeFilter, searchFilter, paginationModel, sortModel]);

  // All codes (not just open ones) — a submitted upload may have used a code
  // that's since been closed, and it should still be filterable here.
  useEffect(() => {
    listAllProjectCodes()
      .then(setProjectCodes)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listUploadsForAdmin(params)
      .then((result) => {
        if (cancelled) return;
        setRows(result.items);
        setRowCount(result.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load uploads");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params]);

  async function handleDownload(uploadId: string, subsidiaryId: string, version: number | null) {
    try {
      const blob = await downloadUploadZip(uploadId);
      // Mirrors adminUploadService.buildUploadZip's own fallback — a version
      // is only ever assigned once submitted (see submissionService.ts).
      downloadBlob(blob, `${subsidiaryId}-${version != null ? `v${version}` : "draft"}.zip`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Download failed");
    }
  }

  // Opens the generated Full Form in a new tab as a self-contained HTML blob
  // (CSS/JS inlined server-side — see previewService.ts) rather than
  // navigating there directly, since a plain link can't carry the
  // Authorization header the admin API requires.
  async function handlePreview(uploadId: string) {
    try {
      const blob = await previewUpload(uploadId, "ff");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      // The new tab has already loaded the blob URL by the time it opens;
      // revoke it shortly after rather than immediately, so it isn't yanked
      // out from under a still-loading document.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Preview failed");
    }
  }

  const columns: GridColDef<AdminUploadListItem>[] = [
    { field: "subsidiaryId", headerName: "Subsidiary", flex: 1 },
    { field: "projectCode", headerName: "Project Code", flex: 1, valueGetter: (_, row) => row.projectCode ?? "—" },
    { field: "username", headerName: "User", flex: 1, valueGetter: (_, row) => row.username ?? "—" },
    { field: "fileName", headerName: "File", flex: 1.5 },
    {
      field: "version",
      headerName: "Version",
      width: 90,
      valueGetter: (_, row) => (row.version != null ? `v${row.version}` : "—"),
    },
    {
      field: "uploadDate",
      headerName: "Uploaded",
      flex: 1,
      valueGetter: (_, row) => new Date(row.uploadDate).toLocaleString(),
    },
    {
      field: "submittedAt",
      headerName: "Submitted",
      flex: 1,
      valueGetter: (_, row) => (row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "—"),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 240,
      sortable: false,
      renderCell: (cellParams) => (
        <Stack direction="row" spacing={0.5}>
          <Button size="small" startIcon={<VisibilityIcon />} onClick={() => handlePreview(cellParams.row.id)}>
            View
          </Button>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => handleDownload(cellParams.row.id, cellParams.row.subsidiaryId, cellParams.row.version)}
          >
            Zip
          </Button>
          <Button size="small" startIcon={<ScienceIcon />} onClick={() => setQaDialogUploadId(cellParams.row.id)}>
            QA
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          <AdminPanelSettingsIcon />
        </Box>
        <Stack spacing={0.2}>
          <Typography variant="h4" component="h1" sx={{ lineHeight: 1.1 }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search, preview, and download every submitted campaign form.
          </Typography>
        </Stack>
      </Stack>

      <Paper sx={{ p: 2, mb: 2, display: "flex", gap: 2, flexWrap: "wrap", borderRadius: 3 }}>
        <TextField
          label="Subsidiary"
          size="small"
          value={subsidiaryFilter}
          onChange={(e) => setSubsidiaryFilter(e.target.value)}
        />
        <TextField
          select
          label="Project Code"
          size="small"
          sx={{ minWidth: 160 }}
          value={projectCodeFilter}
          onChange={(e) => setProjectCodeFilter(e.target.value)}
        >
          <MenuItem value="">All project codes</MenuItem>
          {projectCodes.map((pc) => (
            <MenuItem key={pc.id} value={pc.code}>
              {pc.code}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Search"
          size="small"
          placeholder="Subsidiary, project code, file name, or username"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          sx={{ minWidth: 260 }}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 600, borderRadius: 3, overflow: "hidden" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={rowCount}
          loading={loading}
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          pageSizeOptions={[10, 20, 50, 100]}
          disableRowSelectionOnClick
          sx={{
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: "#f8f9fc",
              borderBottom: "1px solid rgba(20, 22, 33, 0.08)",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 700,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              color: "text.secondary",
            },
            "& .MuiDataGrid-cell": { borderColor: "rgba(20, 22, 33, 0.06)" },
            "& .MuiDataGrid-row:hover": { bgcolor: "rgba(20, 40, 160, 0.04)" },
          }}
        />
      </Paper>

      {qaDialogUploadId && (
        <QaRunDialog uploadId={qaDialogUploadId} open={!!qaDialogUploadId} onClose={() => setQaDialogUploadId(null)} />
      )}
    </Box>
  );
}
