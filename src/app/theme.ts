import { alpha, createTheme, type Theme } from "@mui/material/styles";

/** The four semantic status colors every status `<Chip>` in the app picks
 * from (`STATUS_COLOR`-style lookup objects in the list pages, QA run
 * results, etc.) — used below to give filled status chips a "glow pill"
 * treatment (solid fill + a brighter border + a soft matching shadow)
 * instead of MUI's flat default, closer to the reference look this was
 * asked to match. */
const STATUS_CHIP_COLORS = ["success", "warning", "error", "info"] as const;

/** Which side of the app is rendering: drives the accent color so admin's
 * maroon/gold gradient (see AppLayout.tsx's `sidebarGradient`/active-item
 * pill) is matched by the rest of the UI (buttons, links, focus rings, hover
 * shadows) instead of clashing with a blue theme everywhere else. "default"
 * is used before a role is known (login screen, /local's public wizard). */
export type ThemeVariant = "admin" | "subsidiary" | "default";

/** Each role's `main`/`light` are tuned brighter than the deep maroon/navy
 * this app started with (now `dark`) — a dark-mode background needs a
 * lighter, more saturated accent to read clearly, where the light-mode
 * theme could get away with the deep tone directly. `secondary` (gold/teal)
 * was already vivid enough to work unchanged on a dark background. */
/** Exported so AppLayout.tsx's sidebar (gradient active-item pill, logo
 * badge tint) can use the exact same per-role colors as the MUI theme
 * itself, rather than duplicating the hex values in two places. */
export const PALETTES: Record<ThemeVariant, { main: string; light: string; dark: string; secondary: string }> = {
  admin: { main: "#a5495c", light: "#c97e8d", dark: "#7a1428", secondary: "#c58a2e" },
  subsidiary: { main: "#3f52c4", light: "#6b7bd6", dark: "#1428a0", secondary: "#00a9b5" },
  default: { main: "#3f52c4", light: "#6b7bd6", dark: "#1428a0", secondary: "#00a9b5" },
};

export type ThemeMode = "dark" | "light";

const DARK_SHADOWS = [
  "none",
  "0 1px 2px rgba(0, 0, 0, 0.36)",
  "0 2px 6px rgba(0, 0, 0, 0.38)",
  "0 4px 10px rgba(0, 0, 0, 0.40)",
  "0 6px 14px rgba(0, 0, 0, 0.42)",
  "0 8px 18px rgba(0, 0, 0, 0.44)",
  "0 8px 18px rgba(0, 0, 0, 0.44)",
  "0 8px 18px rgba(0, 0, 0, 0.44)",
  "0 8px 18px rgba(0, 0, 0, 0.44)",
  "0 10px 22px rgba(0, 0, 0, 0.46)",
  "0 10px 22px rgba(0, 0, 0, 0.46)",
  "0 10px 22px rgba(0, 0, 0, 0.46)",
  "0 10px 22px rgba(0, 0, 0, 0.46)",
  "0 12px 26px rgba(0, 0, 0, 0.48)",
  "0 12px 26px rgba(0, 0, 0, 0.48)",
  "0 12px 26px rgba(0, 0, 0, 0.48)",
  "0 12px 26px rgba(0, 0, 0, 0.48)",
  "0 14px 30px rgba(0, 0, 0, 0.50)",
  "0 14px 30px rgba(0, 0, 0, 0.50)",
  "0 14px 30px rgba(0, 0, 0, 0.50)",
  "0 14px 30px rgba(0, 0, 0, 0.50)",
  "0 16px 34px rgba(0, 0, 0, 0.52)",
  "0 16px 34px rgba(0, 0, 0, 0.52)",
  "0 16px 34px rgba(0, 0, 0, 0.52)",
  "0 16px 34px rgba(0, 0, 0, 0.52)",
] as const;

const LIGHT_SHADOWS = [
  "none",
  "0 1px 2px rgba(20, 22, 33, 0.08)",
  "0 2px 6px rgba(20, 22, 33, 0.08)",
  "0 4px 10px rgba(20, 22, 33, 0.10)",
  "0 6px 14px rgba(20, 22, 33, 0.10)",
  "0 8px 18px rgba(20, 22, 33, 0.12)",
  "0 8px 18px rgba(20, 22, 33, 0.12)",
  "0 8px 18px rgba(20, 22, 33, 0.12)",
  "0 8px 18px rgba(20, 22, 33, 0.12)",
  "0 10px 22px rgba(20, 22, 33, 0.12)",
  "0 10px 22px rgba(20, 22, 33, 0.12)",
  "0 10px 22px rgba(20, 22, 33, 0.12)",
  "0 10px 22px rgba(20, 22, 33, 0.12)",
  "0 12px 26px rgba(20, 22, 33, 0.14)",
  "0 12px 26px rgba(20, 22, 33, 0.14)",
  "0 12px 26px rgba(20, 22, 33, 0.14)",
  "0 12px 26px rgba(20, 22, 33, 0.14)",
  "0 14px 30px rgba(20, 22, 33, 0.14)",
  "0 14px 30px rgba(20, 22, 33, 0.14)",
  "0 14px 30px rgba(20, 22, 33, 0.14)",
  "0 14px 30px rgba(20, 22, 33, 0.14)",
  "0 16px 34px rgba(20, 22, 33, 0.16)",
  "0 16px 34px rgba(20, 22, 33, 0.16)",
  "0 16px 34px rgba(20, 22, 33, 0.16)",
  "0 16px 34px rgba(20, 22, 33, 0.16)",
] as const;

/** Baseline MUI theme for the authenticated app (login/history/admin) — the
 * existing client-only wizard at /local keeps its own hand-rolled CSS
 * (index.css, with its own independent `prefers-color-scheme` dark mode)
 * untouched, though both share the same brand accent by default so the two
 * surfaces read as one product rather than two different apps.
 *
 * `mode` is user-toggled (see useThemeModeStore.ts + the switch next to
 * "Log out" in AppLayout.tsx), persisted in localStorage, defaulting to
 * dark. Light mode reuses each role's `dark` accent shade as `primary.main`
 * (the deep maroon/navy this app started with) since it reads better on a
 * white surface than the brightened dark-mode `main`. */
export function createAppTheme(variant: ThemeVariant = "default", mode: ThemeMode = "dark") {
  const accent = PALETTES[variant];
  const isDark = mode === "dark";
  return createTheme({
  palette: {
    mode,
    primary: {
      main: isDark ? accent.main : accent.dark,
      light: isDark ? accent.light : accent.main,
      dark: accent.dark,
      contrastText: "#ffffff",
    },
    secondary: {
      main: accent.secondary,
    },
    // Explicit, vivid overrides for the semantic status colors — MUI's own
    // dark-mode defaults (a pale, low-saturation green/orange/red) read as
    // flat and washed-out against this near-black background, and the same
    // fixed values read fine on a light background too. These back every
    // `<Chip color="success"/"warning"/"error"/"info">` status pill across
    // the app (form status, upload status, QA results, etc.) — see the
    // MuiChip `variants` below for the actual "glow pill" treatment.
    success: { main: "#22c55e", light: "#4ade80", dark: "#15803d", contrastText: "#06210f" },
    warning: { main: "#f59e0b", light: "#fbbf24", dark: "#b45309", contrastText: "#2b1900" },
    error: { main: "#ef4444", light: "#f87171", dark: "#b91c1c", contrastText: "#ffffff" },
    info: { main: "#3b82f6", light: "#60a5fa", dark: "#1d4ed8", contrastText: "#ffffff" },
    background: {
      default: isDark ? "#0b0b10" : "#f4f5f9",
      paper: isDark ? "#15151d" : "#ffffff",
    },
    text: {
      primary: isDark ? "#f1f2f6" : "#14161f",
      secondary: isDark ? "#9297a8" : "#5b6072",
    },
    divider: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(20, 22, 33, 0.08)",
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
  shadows: (isDark ? DARK_SHADOWS : LIGHT_SHADOWS) as unknown as Theme["shadows"],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: isDark
          ? {
              backgroundColor: "#0b0b10",
              backgroundImage: "radial-gradient(circle at top left, #16161f 0%, #0b0b10 45%)",
              backgroundAttachment: "fixed",
            }
          : {
              backgroundColor: "#f4f5f9",
              backgroundImage: "radial-gradient(circle at top left, #ffffff 0%, #f4f5f9 45%)",
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
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(20, 22, 33, 0.08)"}`,
          borderRadius: theme.shape.borderRadius * 3,
        }),
        elevation0: {
          boxShadow: isDark ? "0 1px 2px rgba(0, 0, 0, 0.3)" : "0 1px 2px rgba(20, 22, 33, 0.08)",
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
          "&:hover": { boxShadow: `0 4px 12px ${alpha(accent.main, 0.35)}` },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
      variants: STATUS_CHIP_COLORS.map((c) => ({
        props: { variant: "filled" as const, color: c },
        style: ({ theme }: { theme: Theme }) => {
          const p = theme.palette[c];
          return {
            backgroundColor: p.main,
            // A gradient fill (not a flat color) so every status pill reads
            // consistently with the rest of the app's gradient accents (the
            // sidebar active-item pill, PageHeader icon badges) instead of
            // looking like a flat, mismatched patch of color next to them.
            backgroundImage: `linear-gradient(135deg, ${p.light} 0%, ${p.main} 55%, ${p.dark} 100%)`,
            color: p.contrastText,
            border: `1px solid ${p.light}`,
            boxShadow: `0 0 0 3px ${alpha(p.main, 0.18)}, 0 2px 10px ${alpha(p.main, 0.35)}`,
          };
        },
      })),
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
            color: isDark ? "#9297a8" : "#5b6072",
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(20, 22, 33, 0.04)",
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
export const theme = createAppTheme("default", "dark");
