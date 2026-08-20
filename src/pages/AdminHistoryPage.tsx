import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { Alert, Box, Button, Chip, IconButton, Menu, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ClearIcon from "@mui/icons-material/Clear";
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
import { deleteUpload, type FormVariant, type UploadStatus } from "../api/uploadsApi";
import { downloadBlob } from "../utils/download";
import { PageHeader } from "../components/common/PageHeader";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { adminDataGridSx, ADMIN_GRID_ACTIONS_WIDTH } from "../app/dataGridSx";
import { uploadStatusColor } from "../app/statusColors";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const VARIANT_LABEL: Record<FormVariant, string> = { ff: "Full Form", oc: "One-Click" };

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

interface SummaryTileConfig {
  key: keyof UploadHistorySummary;
  label: string;
  icon: SvgIconComponent;
  color: "primary" | "info" | "success" | "error";
}

// Status colors are reserved and paired with an icon + label here, never
// color alone — total uses the neutral primary color since it isn't a
// status. Deliberately a distinct 4-color qualitative palette from the
// row-level status chip (see uploadStatusColor in statusColors.ts) — these
// tiles need every value visually distinct from its siblings at a glance,
// which a shared 2-color "good/bad" chip scheme wouldn't give them.
const SUMMARY_TILES: SummaryTileConfig[] = [
  { key: "total", label: "Total uploaded", icon: UploadFileIcon, color: "primary" },
  { key: "generated", label: "Generated (pending submit)", icon: AutorenewIcon, color: "info" },
  { key: "submitted", label: "Submitted", icon: CheckCircleIcon, color: "success" },
  { key: "failed", label: "Failed", icon: ErrorIcon, color: "error" },
];

function SummaryTile({ config, value }: { config: SummaryTileConfig; value: number }) {
  const Icon = config.icon;
  return (
    <Paper sx={{ p: 2, flex: "1 1 200px", display: "flex", alignItems: "center", gap: 1.5 }}>
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
  const debouncedSubsidiaryFilter = useDebouncedValue(subsidiaryFilter);
  const debouncedSearchFilter = useDebouncedValue(searchFilter);
  const hasActiveFilter = !!(subsidiaryFilter || projectCodeFilter || statusFilter || searchFilter);

  const [summary, setSummary] = useState<UploadHistorySummary>({ total: 0, generated: 0, submitted: 0, failed: 0 });
  const [previewMenu, setPreviewMenu] = useState<{ anchorEl: HTMLElement; uploadId: string; variants: FormVariant[] } | null>(
    null,
  );
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; fileName: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: "uploadDate", sort: "desc" }]);

  // The subsidiary/projectCode/search slice of the filters, shared by both
  // the grid query and the summary tiles below — kept separate from
  // `params` so a status-only or pagination-only change doesn't refetch the
  // summary for no reason.
  const summaryFilters = useMemo<AdminListParams>(
    () => ({
      subsidiaryId: debouncedSubsidiaryFilter.trim() || undefined,
      projectCode: projectCodeFilter || undefined,
      search: debouncedSearchFilter.trim() || undefined,
    }),
    [debouncedSubsidiaryFilter, projectCodeFilter, debouncedSearchFilter],
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

  // Bumped after a successful delete to trigger a refetch below — a plain
  // state dependency is simpler here than pulling the fetch into a
  // standalone callback ref just for this one refresh path.
  const [refreshSignal, setRefreshSignal] = useState(0);

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
  }, [params, refreshSignal]);

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
    setDownloadingId(uploadId);
    try {
      const blob = await downloadUploadZip(uploadId);
      // Mirrors adminUploadService.buildUploadZip's own fallback — a
      // "generated" (not-yet-submitted) row has no version number yet.
      downloadBlob(blob, `${subsidiaryId}-${version != null ? `v${version}` : "draft"}.zip`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handlePreview(uploadId: string, variant: FormVariant) {
    setPreviewingId(uploadId);
    try {
      const blob = await previewUpload(uploadId, variant);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Preview failed");
    } finally {
      setPreviewingId(null);
    }
  }

  // A row only ever offers what its uploader actually requested (see
  // Upload.variants) — one variant previews directly, both prompt a picker
  // rather than silently defaulting to Full Form.
  function handleViewClick(event: MouseEvent<HTMLElement>, row: AdminUploadListItem) {
    if (row.variants.length > 1) {
      setPreviewMenu({ anchorEl: event.currentTarget, uploadId: row.id, variants: row.variants });
      return;
    }
    void handlePreview(row.id, row.variants[0] ?? "ff");
  }

  // Soft-delete only (see uploadService.softDeleteUpload) — hides the record
  // from every listing but never removes the row itself. Blocked server-side
  // once an upload is submitted regardless of role, so the button is never
  // even offered for those rows below.
  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteUpload(confirmDelete.id);
      setRefreshSignal((n) => n + 1);
      setConfirmDelete(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  function handleClearFilters() {
    setSubsidiaryFilter("");
    setProjectCodeFilter("");
    setStatusFilter("");
    setSearchFilter("");
    setPaginationModel((p) => ({ ...p, page: 0 }));
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
      field: "variants",
      headerName: "Form type",
      flex: 1,
      minWidth: 220,
      sortable: false,
      renderCell: (cellParams) => (
        <Stack direction="row" spacing={0.5} sx={{ overflow: "hidden" }}>
          {cellParams.row.variants.map((v) => (
            <Chip key={v} label={v === "ff" ? "Full Form" : "One-Click"} size="small" variant="outlined" />
          ))}
        </Stack>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (cellParams) => (
        <Chip label={cellParams.value} color={uploadStatusColor[cellParams.value as UploadStatus]} size="small" />
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
      width: ADMIN_GRID_ACTIONS_WIDTH,
      sortable: false,
      renderCell: (cellParams) => {
        const hasFiles = cellParams.row.status === "submitted" || cellParams.row.status === "generated";
        // This page is admin/superadmin-only (see AdminRoute) — every row
        // here is deletable regardless of status, not just failed/generated
        // ones. uploadService.softDeleteUpload exempts admins from the
        // submitted-record lock that still applies to a standard user
        // deleting their own upload elsewhere.
        return (
          <Stack direction="row" spacing={0.25}>
            <Tooltip title={hasFiles && cellParams.row.variants.length > 1 ? "View (choose form type)" : "View"}>
              <span>
                <IconButton
                  size="small"
                  disabled={!hasFiles || previewingId === cellParams.row.id}
                  onClick={(e) => handleViewClick(e, cellParams.row)}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Download zip">
              <span>
                <IconButton
                  size="small"
                  disabled={!hasFiles || downloadingId === cellParams.row.id}
                  onClick={() => handleDownload(cellParams.row.id, cellParams.row.subsidiaryId, cellParams.row.version)}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={() => setConfirmDelete({ id: cellParams.row.id, fileName: cellParams.row.fileName })}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        icon={<HistoryIcon />}
        title="All History"
        subtitle="Every generated, submitted, or failed upload across every user, regardless of subsidiary."
      />

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        {SUMMARY_TILES.map((tile) => (
          <SummaryTile key={tile.key} config={tile} value={summary[tile.key]} />
        ))}
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
          Filters
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
          <TextField
            label="Subsidiary (exact)"
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
            // Keeps the label shrunk even at the empty-string "All" value —
            // otherwise MUI treats "" as not-filled and the label drops back
            // down over the selected text, reading as blank.
            InputLabelProps={{ shrink: true }}
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
            InputLabelProps={{ shrink: true }}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          {hasActiveFilter && (
            <Button size="small" startIcon={<ClearIcon fontSize="small" />} onClick={handleClearFilters}>
              Clear filters
            </Button>
          )}
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 600, overflow: "hidden" }}>
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
          sx={adminDataGridSx}
        />
      </Paper>

      <Menu anchorEl={previewMenu?.anchorEl ?? null} open={!!previewMenu} onClose={() => setPreviewMenu(null)}>
        {previewMenu?.variants.map((variant) => (
          <MenuItem
            key={variant}
            onClick={() => {
              void handlePreview(previewMenu.uploadId, variant);
              setPreviewMenu(null);
            }}
          >
            {VARIANT_LABEL[variant]}
          </MenuItem>
        ))}
      </Menu>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete upload record"
        message={`Delete the upload record for "${confirmDelete?.fileName}"? It will be hidden from all history views.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </Box>
  );
}
