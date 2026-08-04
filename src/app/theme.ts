import { createTheme } from "@mui/material/styles";

/** Baseline MUI theme for the authenticated app (login/history/admin) — the
 * existing client-only wizard at /local keeps its own hand-rolled CSS
 * (index.css) untouched, though both share the same brand blue so the two
 * surfaces read as one product rather than two different apps. */
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1428a0",
      light: "#3f52c4",
      dark: "#0d1c73",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#00a9b5",
    },
    background: {
      default: "#f5f6fa",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a1c23",
      secondary: "#5f6473",
    },
    divider: "rgba(20, 22, 33, 0.08)",
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: ['"Segoe UI"', "system-ui", "-apple-system", "Roboto", "sans-serif"].join(","),
    h4: { fontWeight: 700, letterSpacing: -0.5 },
    h5: { fontWeight: 700, letterSpacing: -0.3 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  shadows: [
    "none",
    "0 1px 2px rgba(20, 22, 33, 0.06)",
    "0 2px 6px rgba(20, 22, 33, 0.07)",
    "0 4px 10px rgba(20, 22, 33, 0.08)",
    "0 6px 14px rgba(20, 22, 33, 0.09)",
    "0 8px 18px rgba(20, 22, 33, 0.10)",
    "0 8px 18px rgba(20, 22, 33, 0.10)",
    "0 8px 18px rgba(20, 22, 33, 0.10)",
    "0 8px 18px rgba(20, 22, 33, 0.10)",
    "0 10px 22px rgba(20, 22, 33, 0.11)",
    "0 10px 22px rgba(20, 22, 33, 0.11)",
    "0 10px 22px rgba(20, 22, 33, 0.11)",
    "0 10px 22px rgba(20, 22, 33, 0.11)",
    "0 12px 26px rgba(20, 22, 33, 0.12)",
    "0 12px 26px rgba(20, 22, 33, 0.12)",
    "0 12px 26px rgba(20, 22, 33, 0.12)",
    "0 12px 26px rgba(20, 22, 33, 0.12)",
    "0 14px 30px rgba(20, 22, 33, 0.13)",
    "0 14px 30px rgba(20, 22, 33, 0.13)",
    "0 14px 30px rgba(20, 22, 33, 0.13)",
    "0 14px 30px rgba(20, 22, 33, 0.13)",
    "0 16px 34px rgba(20, 22, 33, 0.14)",
    "0 16px 34px rgba(20, 22, 33, 0.14)",
    "0 16px 34px rgba(20, 22, 33, 0.14)",
    "0 16px 34px rgba(20, 22, 33, 0.14)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: "radial-gradient(circle at top left, #eef0fb 0%, #f5f6fa 45%)",
          backgroundAttachment: "fixed",
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(20, 22, 33, 0.07)",
        },
        elevation0: {
          boxShadow: "0 1px 2px rgba(20, 22, 33, 0.05)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "linear-gradient(90deg, #1428a0 0%, #24379f 100%)",
          boxShadow: "0 2px 10px rgba(20, 40, 160, 0.18)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingLeft: 18,
          paddingRight: 18,
        },
        contained: {
          boxShadow: "none",
          "&:hover": { boxShadow: "0 4px 12px rgba(20, 40, 160, 0.25)" },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            fontWeight: 700,
            color: "#5f6473",
            backgroundColor: "#f8f9fc",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: 0.4,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td": { borderBottom: 0 },
        },
      },
    },
  },
});
