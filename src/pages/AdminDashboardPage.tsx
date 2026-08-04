import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, MenuItem, Paper, TextField, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { DataGrid, type GridColDef, type GridPaginationModel, type GridSortModel } from "@mui/x-data-grid";
import { ApiError } from "../api/apiClient";
import { downloadUploadZip, listUploadsForAdmin, type AdminListParams, type AdminUploadListItem } from "../api/adminApi";
import type { UploadStatus } from "../api/uploadsApi";
import { downloadBlob } from "../utils/download";

const STATUS_COLOR: Record<UploadStatus, "default" | "success" | "error" | "warning"> = {
  uploaded: "default",
  generated: "success",
  submitted: "success",
  failed: "error",
};

const STATUS_OPTIONS: Array<{ value: UploadStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "uploaded", label: "Uploaded" },
  { value: "generated", label: "Generated" },
  { value: "submitted", label: "Submitted" },
  { value: "failed", label: "Failed" },
];

/** Admin-only view of every upload across every user: search/filter/sort/
 * pagination handled server-side (see adminUploadService.listUploadsForAdmin
 * on the backend) — the grid never fetches more than one page at a time,
 * even with thousands of uploads. */
export function AdminDashboardPage() {
  const [rows, setRows] = useState<AdminUploadListItem[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subsidiaryFilter, setSubsidiaryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<UploadStatus | "">("");
  const [searchFilter, setSearchFilter] = useState("");

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: "uploadDate", sort: "desc" }]);

  const params = useMemo<AdminListParams>(() => {
    const sort = sortModel[0];
    return {
      subsidiaryId: subsidiaryFilter.trim() || undefined,
      status: statusFilter || undefined,
      search: searchFilter.trim() || undefined,
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
      sortBy: (sort?.field as AdminListParams["sortBy"]) ?? "uploadDate",
      sortDir: sort?.sort === "asc" ? "ASC" : "DESC",
    };
  }, [subsidiaryFilter, statusFilter, searchFilter, paginationModel, sortModel]);

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

  async function handleDownload(uploadId: string, subsidiaryId: string, version: number) {
    try {
      const blob = await downloadUploadZip(uploadId);
      downloadBlob(blob, `${subsidiaryId}-v${version}.zip`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Download failed");
    }
  }

  const columns: GridColDef<AdminUploadListItem>[] = [
    { field: "subsidiaryId", headerName: "Subsidiary", flex: 1 },
    { field: "username", headerName: "User", flex: 1, valueGetter: (_, row) => row.username ?? "—" },
    { field: "fileName", headerName: "File", flex: 1.5 },
    { field: "version", headerName: "Version", width: 90 },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (cellParams) => (
        <Chip label={cellParams.value} color={STATUS_COLOR[cellParams.value as UploadStatus]} size="small" />
      ),
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
      headerName: "Download",
      width: 110,
      sortable: false,
      renderCell: (cellParams) => (
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={() => handleDownload(cellParams.row.id, cellParams.row.subsidiaryId, cellParams.row.version)}
        >
          Zip
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      <Paper sx={{ p: 2, mb: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          label="Subsidiary"
          size="small"
          value={subsidiaryFilter}
          onChange={(e) => setSubsidiaryFilter(e.target.value)}
        />
        <TextField
          label="Search"
          size="small"
          placeholder="Subsidiary, file name, or username"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        />
        <TextField
          select
          label="Status"
          size="small"
          sx={{ minWidth: 160 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as UploadStatus | "")}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 600 }}>
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
        />
      </Paper>
    </Box>
  );
}
