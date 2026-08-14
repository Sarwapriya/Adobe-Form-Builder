import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { Box, Button, Alert, Chip, IconButton, Menu, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ScienceIcon from "@mui/icons-material/Science";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ClearIcon from "@mui/icons-material/Clear";
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
import type { FormVariant } from "../api/uploadsApi";
import { downloadBlob } from "../utils/download";
import { QaRunDialog } from "../components/admin/QaRunDialog";
import { PageHeader } from "../components/common/PageHeader";
import { adminDataGridSx, ADMIN_GRID_ACTIONS_WIDTH } from "../app/dataGridSx";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

const VARIANT_LABEL: Record<FormVariant, string> = { ff: "Full Form", oc: "One-Click" };

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

  const [qaDialogRow, setQaDialogRow] = useState<AdminUploadListItem | null>(null);
  const [previewMenu, setPreviewMenu] = useState<{ anchorEl: HTMLElement; uploadId: string; variants: FormVariant[] } | null>(
    null,
  );
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const [subsidiaryFilter, setSubsidiaryFilter] = useState("");
  const [projectCodeFilter, setProjectCodeFilter] = useState("");
  const [projectCodes, setProjectCodes] = useState<ProjectCode[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const debouncedSubsidiaryFilter = useDebouncedValue(subsidiaryFilter);
  const debouncedSearchFilter = useDebouncedValue(searchFilter);
  const hasActiveFilter = !!(subsidiaryFilter || projectCodeFilter || searchFilter);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: "uploadDate", sort: "desc" }]);

  const params = useMemo<AdminListParams>(() => {
    const sort = sortModel[0];
    return {
      subsidiaryId: debouncedSubsidiaryFilter.trim() || undefined,
      projectCode: projectCodeFilter || undefined,
      search: debouncedSearchFilter.trim() || undefined,
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
      sortBy: (sort?.field as AdminListParams["sortBy"]) ?? "uploadDate",
      sortDir: sort?.sort === "asc" ? "ASC" : "DESC",
    };
  }, [debouncedSubsidiaryFilter, projectCodeFilter, debouncedSearchFilter, paginationModel, sortModel]);

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
    setDownloadingId(uploadId);
    try {
      const blob = await downloadUploadZip(uploadId);
      // Mirrors adminUploadService.buildUploadZip's own fallback — a version
      // is only ever assigned once submitted (see submissionService.ts).
      downloadBlob(blob, `${subsidiaryId}-${version != null ? `v${version}` : "draft"}.zip`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Download failed");
    } finally {
      setDownloadingId(null);
    }
  }

  // Opens a generated variant in a new tab as a self-contained HTML blob
  // (CSS/JS inlined server-side — see previewService.ts) rather than
  // navigating there directly, since a plain link can't carry the
  // Authorization header the admin API requires.
  async function handlePreview(uploadId: string, variant: FormVariant) {
    setPreviewingId(uploadId);
    try {
      const blob = await previewUpload(uploadId, variant);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      // The new tab has already loaded the blob URL by the time it opens;
      // revoke it shortly after rather than immediately, so it isn't yanked
      // out from under a still-loading document.
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

  function handleClearFilters() {
    setSubsidiaryFilter("");
    setProjectCodeFilter("");
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
      renderCell: (cellParams) => (
        <Stack direction="row" spacing={0.25}>
          <Tooltip title={cellParams.row.variants.length > 1 ? "View (choose form type)" : "View"}>
            <span>
              <IconButton
                size="small"
                disabled={previewingId === cellParams.row.id}
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
                disabled={downloadingId === cellParams.row.id}
                onClick={() => handleDownload(cellParams.row.id, cellParams.row.subsidiaryId, cellParams.row.version)}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Run QA">
            <IconButton size="small" onClick={() => setQaDialogRow(cellParams.row)}>
              <ScienceIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        icon={<AdminPanelSettingsIcon />}
        title="Admin Dashboard"
        subtitle="Search, preview, and download every submitted campaign form."
      />

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

      {qaDialogRow && (
        <QaRunDialog
          uploadId={qaDialogRow.id}
          availableVariants={qaDialogRow.variants}
          open={!!qaDialogRow}
          onClose={() => setQaDialogRow(null)}
        />
      )}

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
    </Box>
  );
}
