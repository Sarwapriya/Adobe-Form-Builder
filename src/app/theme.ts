import { createTheme } from "@mui/material/styles";

/** Baseline MUI theme for the authenticated app (login/history/admin) — the
 * existing client-only wizard at /local keeps its own hand-rolled CSS
 * (index.css) untouched, so this theme only affects MUI components. */
export const theme = createTheme({
  palette: {
    mode: "light",
  },
});
