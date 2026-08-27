import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material";

/** Shared width for the Actions column on the admin DataGrids (AdminDashboardPage,
 * AdminHistoryPage) — both now use icon-only buttons, so they share one width
 * instead of drifting apart (previously 240 vs 230, a side effect of each page
 * hand-rolling its own text-button column). */
export const ADMIN_GRID_ACTIONS_WIDTH = 150;

/** Shared DataGrid header/hover styling — was previously duplicated
 * byte-for-byte between AdminDashboardPage and AdminHistoryPage. A theme
 * callback (not a plain object) since every color here needs to track
 * `palette.mode` — DataGrid isn't covered by the MuiTableHead/MuiTableRow
 * overrides in theme.ts, so this is the one table styling surface that has
 * to read the theme explicitly rather than getting it for free. */
export const adminDataGridSx: SxProps<Theme> = (theme) => ({
  border: "none",
  "& .MuiDataGrid-columnHeaders": {
    bgcolor: alpha(theme.palette.text.primary, 0.04),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  "& .MuiDataGrid-columnHeaderTitle": {
    fontWeight: 700,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: "text.secondary",
  },
  "& .MuiDataGrid-cell": { borderColor: theme.palette.divider },
  "& .MuiDataGrid-row:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
});
