import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HistoryIcon from "@mui/icons-material/History";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import type { SvgIconComponent } from "@mui/icons-material";
import { DataGrid, type GridColDef, type GridPaginationModel, type GridSortModel } from "@mui/x-data-grid";
import { ApiError } from "../api/apiClient";
import {
  downloadUploadZip,
  getUploadHistorySummary,
  listAllProjectCodes,
  listUploadHistoryForAdmin,
  previewUpload,
  type AdminListParams,
  type AdminUploadListItem,
  type ProjectCode,
  type UploadHistorySummary,
} from "../api/adminApi";
import type { UploadStatus } from "../api/uploadsApi";
import { downloadBlob } from "../utils/download";

// Only these three statuses can ever appear here (the backend's
// listUploadHistoryForAdmin filters to exactly this set) — a "generated" row
// is still not-yet-submitted, so it's only guaranteed to show up here until
// its owner's next login purges it if they never submit it (see
// uploadCleanupService.ts); "uploaded" never lingers long enough to see.
const STATUS_OPTIONS: Array<{ value: UploadStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "generated", label: "Generated" },
  { value: "submitted", label: "Submitted" },
  { value: "failed", label: "Failed" },
];

const STATUS_COLOR: Record<UploadStatus, "default" | "success" | "error" | "warning"> = {
  uploaded: "default",
  generated: "success",
  submitted: "success",
  failed: "error",
};

interface SummaryTileConfig {
  key: keyof UploadHistorySummary;
  label: string;
  icon: SvgIconComponent;
  color: "primary" | "info" | "success" | "error";
}

// Status colors are reserved and paired with an icon + label here, never
// color alone — total uses the neutral primary color since it isn't a status.
const SUMMARY_TILES: SummaryTileConfig[] = [
  { key: "total", label: "Total uploaded", icon: UploadFileIcon, color: "primary" },
  { key: "generated", label: "Generated (pending submit)", icon: AutorenewIcon, color: "info" },
  { key: "submitted", label: "Submitted", icon: CheckCircleIcon, color: "success" },
  { key: "failed", label: "Failed", icon: ErrorIcon, color: "error" },
];

function SummaryTile({ config, value }: { config: SummaryTileConfig; value: number }) {
  const Icon = config.icon;
  return (
    <Paper sx={{ p: 2, flex: "1 1 200px", display: "flex", alignItems: "center", gap: 1.5, borderRadius: 3 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: `${config.color}.main`,
          color: `${config.color}.contrastText`,
          flexShrink: 0,
        }}
      >
        <Icon fontSize="small" />
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={700} lineHeight={1.1}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {config.label}
        </Typography>
      </Box>
    </Paper>
  );
}

/**
 * The full audit trail: every generated, submitted, or failed upload across
 * every user, including ones the admin dashboard doesn't show (submitted-only)
 * or that get cleaned up once their owner logs in again without submitting.
 * Preview/download work for generated and submitted rows; a failed upload
 * never produced generated files.
 */
export function AdminHistoryPage() {
  const [rows, setRows] = useState<AdminUploadListItem[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subsidiaryFilter, setSubsidiaryFilter] = useState("");
  const [projectCodeFilter, setProjectCodeFilter] = useState("");
  const [projectCodes, setProjectCodes] = useState<ProjectCode[]>([]);
  const [statusFilter, setStatusFilter] = useState<UploadStatus | "">("");
  const [searchFilter, setSearchFilter] = useState("");

  const [summary, setSummary] = useState<UploadHistorySummary>({ total: 0, generated: 0, submitted: 0, failed: 0 });

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: "uploadDate", sort: "desc" }]);

  // The subsidiary/projectCode/search slice of the filters, shared by both
  // the grid query and the summary tiles below — kept separate from
  // `params` so a status-only or pagination-only change doesn't refetch the
  // summary for no reason.
  const summaryFilters = useMemo<AdminListParams>(
    () => ({
      subsidiaryId: subsidiaryFilter.trim() || undefined,
      projectCode: projectCodeFilter || undefined,
      search: searchFilter.trim() || undefined,
    }),
    [subsidiaryFilter, projectCodeFilter, searchFilter],
  );

  const params = useMemo<AdminListParams>(() => {
    const sort = sortModel[0];
    return {
      ...summaryFilters,
      status: statusFilter || undefined,
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
      sortBy: (sort?.field as AdminListParams["sortBy"]) ?? "uploadDate",
      sortDir: sort?.sort === "asc" ? "ASC" : "DESC",
    };
  }, [summaryFilters, statusFilter, paginationModel, sortModel]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listUploadHistoryForAdmin(params)
      .then((result) => {
        if (cancelled) return;
        setRows(result.items);
        setRowCount(result.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load upload history");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params]);

  useEffect(() => {
    let cancelled = false;
    getUploadHistorySummary(summaryFilters)
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [summaryFilters]);

  useEffect(() => {
    listAllProjectCodes()
      .then(setProjectCodes)
      .catch(() => undefined);
  }, []);

  async function handleDownload(uploadId: string, subsidiaryId: string, version: number | null) {
    try {
      const blob = await downloadUploadZip(uploadId);
      // Mirrors adminUploadService.buildUploadZip's own fallback — a
      // "generated" (not-yet-submitted) row has no version number yet.
      downloadBlob(blob, `${subsidiaryId}-${version != null ? `v${version}` : "draft"}.zip`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Download failed");
    }
  }

  async function handlePreview(uploadId: string) {
    try {
      const blob = await previewUpload(uploadId, "ff");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
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
      headerName: "Actions",
      width: 180,
      sortable: false,
      renderCell: (cellParams) => {
        const hasFiles = cellParams.row.status === "submitted" || cellParams.row.status === "generated";
        return (
          <Stack direction="row" spacing={0.5}>
            <Button
              size="small"
              startIcon={<VisibilityIcon />}
              disabled={!hasFiles}
              onClick={() => handlePreview(cellParams.row.id)}
            >
              View
            </Button>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              disabled={!hasFiles}
              onClick={() => handleDownload(cellParams.row.id, cellParams.row.subsidiaryId, cellParams.row.version)}
            >
              Zip
            </Button>
          </Stack>
        );
      },
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
          <HistoryIcon />
        </Box>
        <Stack spacing={0.2}>
          <Typography variant="h4" component="h1" sx={{ lineHeight: 1.1 }}>
            All History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Every generated, submitted, or failed upload across every user, regardless of subsidiary.
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        {SUMMARY_TILES.map((tile) => (
          <SummaryTile key={tile.key} config={tile} value={summary[tile.key]} />
        ))}
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
    </Box>
  );
}
