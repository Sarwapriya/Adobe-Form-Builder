import { alpha, createTheme } from "@mui/material/styles";

/** Which side of the app is rendering: drives the accent color so admin's
 * red/maroon sidebar (see AppLayout.tsx's `sidebarGradient`) is matched by
 * the rest of the UI (buttons, links, focus rings, hover shadows) instead of
 * clashing with a blue theme everywhere else. "default" is used before a
 * role is known (login screen, /local's public wizard). */
export type ThemeVariant = "admin" | "subsidiary" | "default";

const PALETTES: Record<ThemeVariant, { main: string; light: string; dark: string; secondary: string }> = {
  admin: { main: "#7a1428", light: "#a5495c", dark: "#4a0f1a", secondary: "#c58a2e" },
  subsidiary: { main: "#1428a0", light: "#3f52c4", dark: "#0d1c73", secondary: "#00a9b5" },
  default: { main: "#1428a0", light: "#3f52c4", dark: "#0d1c73", secondary: "#00a9b5" },
};

/** Baseline MUI theme for the authenticated app (login/history/admin) — the
 * existing client-only wizard at /local keeps its own hand-rolled CSS
 * (index.css) untouched, though both share the same brand blue by default so
 * the two surfaces read as one product rather than two different apps. */
export function createAppTheme(variant: ThemeVariant = "default") {
  const accent = PALETTES[variant];
  return createTheme({
  palette: {
    mode: "light",
    primary: {
      main: accent.main,
      light: accent.light,
      dark: accent.dark,
      contrastText: "#ffffff",
    },
    secondary: {
      main: accent.secondary,
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
        // borderRadius here matches every Paper's own previous inline
        // `sx={{ borderRadius: 3 }}` override exactly (MUI's sx shorthand
        // multiplies a numeric borderRadius by theme.shape.borderRadius) —
        // centralized so pages that need it don't have to repeat it.
        root: ({ theme }) => ({
          backgroundImage: "none",
          border: "1px solid rgba(20, 22, 33, 0.07)",
          borderRadius: theme.shape.borderRadius * 3,
        }),
        elevation0: {
          boxShadow: "0 1px 2px rgba(20, 22, 33, 0.05)",
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
          "&:hover": { boxShadow: `0 4px 12px ${alpha(accent.main, 0.25)}` },
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
}

/** Convenience default export for surfaces where no role is known yet. */
export const theme = createAppTheme("default");
