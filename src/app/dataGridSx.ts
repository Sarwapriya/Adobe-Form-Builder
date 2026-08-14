import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material";

/** Shared width for the Actions column on the admin DataGrids (AdminDashboardPage,
 * AdminHistoryPage) — both now use icon-only buttons, so they share one width
 * instead of drifting apart (previously 240 vs 230, a side effect of each page
 * hand-rolling its own text-button column). */
export const ADMIN_GRID_ACTIONS_WIDTH = 150;

/** Shared DataGrid header/hover styling — was previously duplicated
 * byte-for-byte between AdminDashboardPage and AdminHistoryPage. */
export const adminDataGridSx: SxProps<Theme> = {
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
  "& .MuiDataGrid-row:hover": { bgcolor: alpha("#1428a0", 0.04) },
};
