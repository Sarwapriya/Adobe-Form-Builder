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

/** Each role's `main`/`light` are tuned brighter than the deep `dark` shade
 * — a dark-mode background needs a lighter, more saturated accent to read
 * clearly, where the light-mode theme could get away with the deep tone
 * directly. Indigo (admin) / emerald (subsidiary) — see SIDEBAR_DARK_BASE
 * below for the matching slate-navy/slate sidebar base tones these sit on
 * top of in dark mode. `secondary` (gold/teal) is a deliberately distinct
 * complementary accent, not a shade of `main`, so a page using both reads as
 * two colors, not one color at two opacities. */
/** Exported so AppLayout.tsx's sidebar (gradient active-item pill, logo
 * badge tint) can use the exact same per-role colors as the MUI theme
 * itself, rather than duplicating the hex values in two places. */
export const PALETTES: Record<ThemeVariant, { main: string; light: string; dark: string; secondary: string }> = {
  admin: { main: "#4F46E5", light: "#818CF8", dark: "#4338CA", secondary: "#c58a2e" },
  subsidiary: { main: "#10B981", light: "#34D399", dark: "#047857", secondary: "#00a9b5" },
  default: { main: "#10B981", light: "#34D399", dark: "#047857", secondary: "#00a9b5" },
};

/** Dark-mode sidebar base gradient (top→bottom), per role — replaces a
 * single shared near-black base both roles used to sit on, so admin and
 * subsidiary are now distinguishable by sidebar tone itself (slate-navy vs.
 * a visibly lighter slate), not only by the accent glow bleeding in from
 * the top (see AppLayout.tsx's `sidebarGradient`). Light mode keeps its
 * existing white-based sidebar unchanged — only the dark-mode base changes
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
    // Amber — already matches the "pending" status color this app's own
    // design brief calls for, unchanged.
    warning: { main: "#f59e0b", light: "#fbbf24", dark: "#b45309", contrastText: "#2b1900" },
    // Shifted from a flat red toward true crimson (more magenta-leaning) to
    // match "rejected" status tags in this app's design brief — a shared
    // token, so this affects every error state across both roles, not just
    // rejected forms.
    error: { main: "#E11D48", light: "#FB7185", dark: "#9F1239", contrastText: "#ffffff" },
    info: { main: "#3b82f6", light: "#60a5fa", dark: "#1d4ed8", contrastText: "#ffffff" },
    background: {
      // Lifted off near-black (was #0b0b10/#15151d, barely a hair apart) —
      // GitHub Dark's two-tone (#0d1117/#161b22) gives the same "moody dark"
      // feel but with real separation between page background and card
      // surfaces, so a Paper's edge reads without depending on the (also
      // faint) border/divider color to do all the work.
      // Light mode's default nudged to #F1F5F9 (slate-100) — the exact
      // workspace tone this app's own design brief calls for, paired with a
      // literal subtle grid-pattern body background below rather than the
      // previous soft radial glow.
      default: isDark ? "#0d1117" : "#F1F5F9",
      paper: isDark ? "#1c212b" : "#ffffff",
    },
    text: {
      primary: isDark ? "#f1f2f6" : "#14161f",
      // Raised from #9297a8 (~3.9:1 on the old #15151d paper, under WCAG AA's
      // 4.5:1 for normal text) to a value that clears AA against both the new
      // paper and background tones — this is the color every caption/helper/
      // timestamp string in the app uses, so it needed to hold up at small
      // sizes, not just for headings.
      secondary: isDark ? "#aab0c2" : "#5b6072",
    },
    // Raised from 0.08 — at that opacity it was invisible often enough that
    // table rows and card edges relied on nothing else to separate from each
    // other. Still subtle, just no longer "effectively absent."
    divider: isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(20, 22, 33, 0.08)",
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
              backgroundColor: "#0d1117",
              backgroundImage: "radial-gradient(circle at top left, #1c212b 0%, #0d1117 45%)",
              backgroundAttachment: "fixed",
            }
          : {
              backgroundColor: "#F1F5F9",
              // A literal subtle grid-pattern (faint 1px lines every 24px)
              // instead of the previous soft radial glow — the main
              // workspace texture this app's own design brief calls for.
              backgroundImage:
                "linear-gradient(to right, rgba(20, 22, 33, 0.035) 1px, transparent 1px), " +
                "linear-gradient(to bottom, rgba(20, 22, 33, 0.035) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
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
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(20, 22, 33, 0.08)"}`,
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
            // Dialed back for dark mode specifically — against the near-black
            // background the previous glow (0.18/0.35 alpha) read as a bright
            // neon halo that pulled focus away from surrounding text; same
            // treatment, just toned down rather than removed.
            boxShadow: isDark
              ? `0 0 0 2px ${alpha(p.main, 0.12)}, 0 2px 8px ${alpha(p.main, 0.22)}`
              : `0 0 0 3px ${alpha(p.main, 0.18)}, 0 2px 10px ${alpha(p.main, 0.35)}`,
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
            color: isDark ? "#aab0c2" : "#5b6072",
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
