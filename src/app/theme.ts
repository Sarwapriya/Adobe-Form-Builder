import { alpha, createTheme, type Theme } from "@mui/material/styles";

/** The four semantic status colors every status `<Chip>` in the app picks
 * from (`STATUS_COLOR`-style lookup objects in the list pages, QA run
 * results, etc.) — used below to give filled status chips a flat tinted-
 * badge treatment (restrained, no gradient/glow — see this app's enterprise
 * design brief's "without excessive gradients or decorative effects"). */
const STATUS_CHIP_COLORS = ["success", "warning", "error", "info"] as const;

/** Which side of the app is rendering: drives the accent color so admin's
 * deep-navy gradient (see AppLayout.tsx's `sidebarGradient`/active-item
 * pill) is matched by the rest of the UI (buttons, links, focus rings, hover
 * shadows) instead of clashing with subsidiary's cyan theme. "default" is
 * used before a role is known (login screen, /local's public wizard). */
export type ThemeVariant = "admin" | "subsidiary" | "default";

/** `dark` is each role's light-mode `primary.main` — the two anchor brand
 * colors per role: admin gets deep navy (`#1E293B`), subsidiary/default gets
 * cyan (`#06B6D4`), kept visually distinct (desaturated slate-navy vs. a
 * vivid saturated cyan) so the two sides read unmistakably apart rather than
 * as shades of one hue. `main`/`light` are brightened variants of that same
 * base color for dark-mode legibility (same Tailwind-scale step pattern the
 * previous blue palette used) — see SIDEBAR_DARK_BASE below for the matching
 * sidebar base tones these sit on top of in dark mode. `secondary` (cyan)
 * stays the shared accent for both roles — for subsidiary this now matches
 * its own primary `dark`, reinforcing cyan as that role's whole identity. */
/** Exported so AppLayout.tsx's sidebar (active-item color, logo badge tint)
 * can use the exact same per-role colors as the MUI theme itself, rather
 * than duplicating the hex values in two places. */
export const PALETTES: Record<ThemeVariant, { main: string; light: string; dark: string; secondary: string }> = {
  admin: { main: "#64748B", light: "#94A3B8", dark: "#1E293B", secondary: "#06B6D4" },
  subsidiary: { main: "#22D3EE", light: "#67E8F9", dark: "#06B6D4", secondary: "#06B6D4" },
  default: { main: "#22D3EE", light: "#67E8F9", dark: "#06B6D4", secondary: "#06B6D4" },
};

/** Dark-mode sidebar base gradient (top→bottom), per role — lets admin and
 * subsidiary stay distinguishable by sidebar tone itself (slate-navy vs. a
 * visibly lighter slate), not only by the accent color bleeding in from the
 * top (see AppLayout.tsx's `sidebarGradient`). Light mode keeps its
 * existing white-based sidebar unchanged — only the dark-mode base is set
 * here. */
export const SIDEBAR_DARK_BASE: Record<ThemeVariant, { from: string; to: string }> = {
  admin: { from: "#0F172A", to: "#0B1222" },
  subsidiary: { from: "#1E293B", to: "#13202F" },
  default: { from: "#1E293B", to: "#13202F" },
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
 * dark. Light mode reuses each role's `dark` accent shade (this app's
 * design brief's own brand blue, one of two per role) as `primary.main`
 * since it reads better on a white surface than the brightened dark-mode
 * `main`. */
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
    // Exact values from this app's enterprise design brief — a shared
    // token, so these affect every status state across both roles, not
    // just one page. light/dark shades are the neighboring steps on the
    // same Tailwind-style scale these values already sit on.
    success: { main: "#168568", light: "#34C99A", dark: "#0F6B53", contrastText: "#06211a" },
    warning: { main: "#B7791F", light: "#D9A548", dark: "#8A5A14", contrastText: "#2a1c04" },
    error: { main: "#D14343", light: "#E07A7A", dark: "#A33333", contrastText: "#ffffff" },
    // The brief's accent cyan — reused as `info`, the one semantic slot
    // this app otherwise leaves available for a brand accent.
    info: { main: "#06B6D4", light: "#22D3EE", dark: "#0E7490", contrastText: "#06210f" },
    background: {
      // Dark mode's surfaces are unchanged (this app's design brief
      // describes only a light theme) — just the accent colors above
      // change what sits on top of them. Light mode moves to the brief's
      // exact workspace/card tones.
      default: isDark ? "#0d1117" : "#F6F7FB",
      paper: isDark ? "#1c212b" : "#FFFFFF",
    },
    text: {
      // Dark mode unchanged; light mode moves to the brief's exact text
      // colors (#111827/#667085 — both already comfortably clear WCAG AA
      // against the new #F6F7FB/#FFFFFF surfaces).
      primary: isDark ? "#f1f2f6" : "#111827",
      secondary: isDark ? "#aab0c2" : "#667085",
    },
    // Light mode's border moves to the brief's exact #E4E7EC; dark mode
    // unchanged.
    divider: isDark ? "rgba(255, 255, 255, 0.14)" : "#E4E7EC",
  },
  shape: {
    borderRadius: 10,
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
              backgroundColor: "#0d1117",
              backgroundImage: "radial-gradient(circle at top left, #1c212b 0%, #0d1117 45%)",
              backgroundAttachment: "fixed",
            }
          : {
              // A flat, restrained canvas — this app's design brief calls
              // for "clean white content surfaces with subtle neutral
              // backgrounds," not a decorative texture.
              backgroundColor: "#F6F7FB",
              backgroundImage: "none",
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
        root: {
          backgroundImage: "none",
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.14)" : "#E4E7EC"}`,
          // A fixed, restrained card radius (not a multiple of the base
          // control radius) — this app's design brief explicitly calls out
          // "excessively rounded cards" as a look to avoid.
          borderRadius: 12,
        },
        elevation0: {
          boxShadow: isDark ? "0 1px 2px rgba(0, 0, 0, 0.3)" : "0 1px 2px rgba(17, 24, 39, 0.06)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          // A rounded-rect control, not a full pill — this app's design
          // brief asks for a precise, enterprise look rather than the
          // rounder, more "consumer app" shape this used previously.
          borderRadius: 8,
          paddingLeft: 18,
          paddingRight: 18,
        },
        contained: {
          boxShadow: "none",
          // A restrained hover lift rather than a colored glow — this app's
          // design brief asks for minimal decorative effects.
          "&:hover": { boxShadow: `0 2px 6px ${alpha(accent.main, 0.18)}` },
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
          // A flat tinted badge (soft background tint + solid-color text +
          // a thin matching border, no gradient fill or glow) — this app's
          // design brief asks for a restrained, enterprise look rather than
          // the gradient "glow pill" this used previously.
          return {
            backgroundColor: alpha(p.main, isDark ? 0.22 : 0.12),
            backgroundImage: "none",
            color: isDark ? p.light : p.dark,
            border: `1px solid ${alpha(p.main, isDark ? 0.4 : 0.3)}`,
            boxShadow: "none",
          };
        },
      })),
    },
    MuiTextField: {
      defaultProps: { variant: "outlined" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            fontWeight: 700,
            color: isDark ? "#aab0c2" : "#667085",
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "#F0F2F7",
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
