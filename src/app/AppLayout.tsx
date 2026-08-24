import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  Collapse,
  Divider,
  Drawer,
  Grow,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DescriptionIcon from "@mui/icons-material/Description";
import LogoutIcon from "@mui/icons-material/Logout";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleIcon from "@mui/icons-material/People";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import TranslateIcon from "@mui/icons-material/Translate";
import DomainIcon from "@mui/icons-material/Domain";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { isAdminRole, useAuthStore } from "../auth/authStore";
import { useAiChatStore } from "../store/aiChatStore";
import { AIChatButton } from "../components/ai/AIChatButton";
import { AIChatPanel } from "../components/ai/AIChatPanel";

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 76;
const COLLAPSE_STORAGE_KEY = "sidebarCollapsed";
const AI_PANEL_WIDTH = 380;

/** Matches "/admin/form-builder/:id" — deliberately excludes the two static
 * list sub-routes ("/admin/form-builder/hr", "/admin/form-builder/adhoc"),
 * which have no form to scope the AI panel to. */
const ADMIN_FORM_BUILDER_ID_RE = /^\/admin\/form-builder\/(?!hr$|adhoc$)([^/]+)$/;
/** Matches "/my-forms/adhoc/:id" — deliberately excludes the bare
 * "/my-forms/adhoc" list page itself. */
const MY_ADHOC_FORM_ID_RE = /^\/my-forms\/adhoc\/([^/]+)$/;

/** When the current page is one of the two Form Builder editors, the AI
 * panel's conversation gets scoped to that form (campaign context, and
 * client-applied actions target its draft) — returns null everywhere else,
 * which the panel treats as "general chat" (search/reference previous
 * campaigns, no form to apply an edit to). */
function editorFormIdFromPath(pathname: string): string | null {
  return pathname.match(ADMIN_FORM_BUILDER_ID_RE)?.[1] ?? pathname.match(MY_ADHOC_FORM_ID_RE)?.[1] ?? null;
}

interface NavChild {
  to: string;
  label: string;
  /** Whether this child should read as active for a given pathname — a
   * function rather than a plain exact/prefix flag because "HR Forms" needs
   * to stay highlighted on an individual form's translate page
   * ("/my-forms/:id"), which isn't a literal prefix of its own link target. */
  isActive: (pathname: string) => boolean;
}

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  /** Exact-match only — otherwise "/admin" would also read as active while on "/admin/history". */
  exact: boolean;
  /** Sub-menu items, expandable under the parent when the sidebar isn't
   * collapsed. In collapsed (icon-rail) mode the parent just links straight
   * to the first child instead of showing a menu. */
  children?: NavChild[];
}

/** A labeled cluster of nav items, rendered with a small uppercase caption
 * above it (hidden in collapsed/icon-rail mode, where a divider stands in
 * instead) — lets the admin section read as "Excel Upload" vs. "Form
 * Configuration" at a glance instead of one flat list of six items. */
interface NavSection {
  label: string;
  items: NavItem[];
}

/** Shell for every authenticated page: a collapsible left sidebar (nav +
 * account) with the current route rendered via <Outlet/>. Mounted once as the
 * layout route wrapping "/" and "/admin*" (see App.tsx). Collapsed state is
 * remembered across reloads via localStorage, matching the polish of a
 * typical SaaS admin shell rather than resetting every visit. */
export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = isAdminRole(user?.role);
  const panelLabel = isAdmin ? "Admin Panel" : "Subsidiary Panel";
  /** Deep red/maroon for the admin panel vs. the original Samsung blue for the
   * subsidiary panel — a strong, unmissable color cue so which side of the app
   * you're in is obvious at a glance, not just from the nav item labels. */
  const sidebarGradient = isAdmin
    ? "linear-gradient(180deg, #7a1428 0%, #3d0a14 100%)"
    : "linear-gradient(180deg, #1428a0 0%, #16227a 100%)";

  useEffect(() => {
    document.title = `Form Builder · ${panelLabel}`;
  }, [panelLabel]);

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true");
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  /** Section-header accordion state (distinct from the sidebar-rail `collapsed`
   * above). "Excel Upload" always starts closed for every user — the section's
   * items only appear once the user clicks the header to expand it. Every other
   * section defaults open (see the `?? true` fallback below). */
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ "Excel Upload": false });

  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const editorFormId = editorFormIdFromPath(location.pathname);
  const aiOpen = useAiChatStore((s) => s.open);

  useEffect(() => {
    useAiChatStore.getState().setFormId(editorFormId);
  }, [editorFormId]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  /** Every nav item lives inside a labeled section — admin and subsidiary users
   * each get their own set: a "Form Configuration" group for the form-builder
   * side, and a general "Configuration"/"Administration" group for everything
   * else. The Excel-upload workflow (UploadHistoryPage, AdminDashboardPage,
   * AdminHistoryPage) is intentionally hidden from navigation for both roles —
   * its routes/components are untouched, just not linked here. Admins never
   * have subsidiaryId set, so exactly one branch below applies to a given user. */
  const sections: NavSection[] = isAdminRole(user?.role)
    ? [
        {
          label: "Form Configuration",
          items: [
            {
              to: "/admin/form-builder",
              label: "Form Initiator",
              icon: <DesignServicesIcon />,
              exact: false,
              children: [
                {
                  to: "/admin/form-builder/hr",
                  label: "HR Form Initiator",
                  isActive: (p: string) => p.startsWith("/admin/form-builder/hr"),
                },
                {
                  to: "/admin/form-builder/adhoc",
                  label: "Ad-hoc Forms",
                  isActive: (p: string) => p.startsWith("/admin/form-builder/adhoc"),
                },
              ],
            },
          ],
        },
        {
          label: "Question Master",
          items: [{ to: "/admin/question-master", label: "Question Master", icon: <ListAltIcon />, exact: false }],
        },
        {
          label: "Administration",
          items: [
            { to: "/admin/configuration", label: "Configuration", icon: <SettingsIcon />, exact: true },
            { to: "/admin/users", label: "User Management", icon: <PeopleIcon />, exact: true },
          ],
        },
      ]
    : [
        ...(user?.subsidiaryId
          ? [
              {
                label: "Form Configuration",
                items: [
                  {
                    to: "/my-forms",
                    label: "My Forms",
                    icon: <TranslateIcon />,
                    exact: false,
                    children: [
                      {
                        to: "/my-forms/adhoc",
                        label: "Ad-hoc Forms",
                        isActive: (p: string) => p.startsWith("/my-forms/adhoc"),
                      },
                      {
                        to: "/my-forms/hr",
                        label: "HR Forms",
                        isActive: (p: string) => p.startsWith("/my-forms") && !p.startsWith("/my-forms/adhoc"),
                      },
                    ],
                  },
                  { to: "/my-submissions", label: "My Submissions", icon: <HistoryIcon />, exact: true },
                ],
              },
              {
                label: "Configuration",
                items: [{ to: "/my-subsidiary", label: "My Subsidiary", icon: <DomainIcon />, exact: true }],
              },
            ]
          : []),
      ];

  const drawerWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  function renderNavItem(item: NavItem) {
    const hasChildren = !!item.children?.length;
    const selected = hasChildren
      ? item.children!.some((c) => c.isActive(location.pathname))
      : item.exact
        ? location.pathname === item.to
        : location.pathname.startsWith(item.to);
    const isOpen = hasChildren && !collapsed && (expandedMenus[item.to] ?? selected);

    const linkProps =
      hasChildren && !collapsed
        ? { onClick: () => setExpandedMenus((m) => ({ ...m, [item.to]: !isOpen })) }
        : { component: Link, to: hasChildren ? item.children![0].to : item.to };

    const button = (
      <ListItemButton
        {...linkProps}
        selected={selected}
        sx={{
          borderRadius: 2,
          mb: 0.5,
          minHeight: 44,
          justifyContent: collapsed ? "center" : "flex-start",
          color: "rgba(255,255,255,0.85)",
          "&.Mui-selected": {
            bgcolor: "rgba(255,255,255,0.16)",
            color: "#fff",
          },
          "&.Mui-selected:hover": { bgcolor: "rgba(255,255,255,0.20)" },
          "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
        }}
      >
        <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 1.5, justifyContent: "center", color: "inherit" }}>
          {item.icon}
        </ListItemIcon>
        {!collapsed && (
          <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: selected ? 700 : 500 }} />
        )}
        {hasChildren && !collapsed && (isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />)}
      </ListItemButton>
    );

    return (
      <Box key={item.to}>
        {collapsed ? (
          <Tooltip title={item.label} placement="right">
            {button}
          </Tooltip>
        ) : (
          button
        )}
        {hasChildren && !collapsed && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => {
                const childSelected = child.isActive(location.pathname);
                return (
                  <ListItemButton
                    key={child.to}
                    component={Link}
                    to={child.to}
                    selected={childSelected}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      ml: 2,
                      minHeight: 36,
                      color: "rgba(255,255,255,0.75)",
                      "&.Mui-selected": { bgcolor: "rgba(255,255,255,0.16)", color: "#fff" },
                      "&.Mui-selected:hover": { bgcolor: "rgba(255,255,255,0.20)" },
                      "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                    }}
                  >
                    <ListItemText
                      primary={child.label}
                      primaryTypographyProps={{ fontWeight: childSelected ? 700 : 500, fontSize: 13 }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Collapse>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          whiteSpace: "nowrap",
          transition: (t) => t.transitions.create("width", { duration: t.transitions.duration.shortest }),
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            overflowX: "hidden",
            boxSizing: "border-box",
            border: "none",
            backgroundImage: sidebarGradient,
            color: "#fff",
            transition: (t) => t.transitions.create("width", { duration: t.transitions.duration.shortest }),
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2, py: 2.5, minHeight: 72 }}>
          <Tooltip title={collapsed ? panelLabel : ""} placement="right">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(255,255,255,0.14)",
              }}
            >
              <DescriptionIcon fontSize="small" />
            </Box>
          </Tooltip>
          {!collapsed && (
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={700} noWrap>
                Form Builder
              </Typography>
              <Chip
                label={panelLabel}
                size="small"
                sx={{
                  height: 18,
                  mt: 0.25,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  color: "#fff",
                  bgcolor: isAdmin ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.16)",
                  "& .MuiChip-label": { px: 0.75 },
                }}
              />
            </Box>
          )}
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

        <List sx={{ px: 1.25, py: 1.5, flexGrow: 1 }}>
          {sections.map((section, i) => {
            const sectionOpen = openSections[section.label] ?? true;
            return (
              <Box key={section.label} sx={{ mt: i > 0 ? 1.5 : 0 }}>
                {!collapsed ? (
                  <Box
                    onClick={() => setOpenSections((s) => ({ ...s, [section.label]: !sectionOpen }))}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 1.5,
                      py: 0.5,
                      cursor: "pointer",
                      borderRadius: 1,
                      "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(255,255,255,0.5)",
                        fontWeight: 700,
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                      }}
                    >
                      {section.label}
                    </Typography>
                    {sectionOpen ? (
                      <ExpandLessIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }} />
                    ) : (
                      <ExpandMoreIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }} />
                    )}
                  </Box>
                ) : (
                  i > 0 && <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", my: 1 }} />
                )}
                {collapsed ? (
                  section.items.map((item) => renderNavItem(item))
                ) : (
                  <Collapse in={sectionOpen} timeout="auto" unmountOnExit>
                    {section.items.map((item) => renderNavItem(item))}
                  </Collapse>
                )}
              </Box>
            );
          })}
        </List>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

        <Box sx={{ p: 1.25 }}>
          {collapsed ? (
            <Tooltip title={`${user?.username} · ${user?.role}`} placement="right">
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "#fff", mx: "auto", mb: 1 }}>
                {user?.username?.[0]?.toUpperCase() ?? "?"}
              </Avatar>
            </Tooltip>
          ) : (
            <Chip
              avatar={
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "#fff" }}>
                  {user?.username?.[0]?.toUpperCase() ?? "?"}
                </Avatar>
              }
              label={`${user?.username} · ${user?.role}`}
              sx={{
                width: "100%",
                justifyContent: "flex-start",
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.10)",
                mb: 1,
                "& .MuiChip-avatar": { ml: 0.5 },
                "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
              }}
            />
          )}

          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              minHeight: 40,
              justifyContent: collapsed ? "center" : "flex-start",
              color: "rgba(255,255,255,0.85)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 1.5, justifyContent: "center", color: "inherit" }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            {!collapsed && <ListItemText primary="Log out" />}
          </ListItemButton>

          <IconButton
            onClick={() => setCollapsed((c) => !c)}
            size="small"
            sx={{
              display: "flex",
              mx: "auto",
              mt: 1,
              color: "rgba(255,255,255,0.7)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.08)", color: "#fff" },
            }}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: 3 }}>
        <Box sx={{ maxWidth: 1280, mx: "auto" }}>
          <Outlet />
        </Box>
      </Box>

      {/* Available on every authenticated page under this layout — a
          master-page fixture, not scoped to the two form editors — so both
          admin and subsidiary users always have it in the bottom-right
          corner. Floats *over* the page rather than a persistent drawer that
          resizes it, so the rest of the page's content keeps its full width
          whether the assistant is open or minimized. Only the *context* it
          hands the assistant (which form, if any) changes with the route,
          via editorFormId above. */}
      <Grow in={aiOpen} style={{ transformOrigin: "bottom right" }}>
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: AI_PANEL_WIDTH,
            height: "min(70vh, 640px)",
            zIndex: (t) => t.zIndex.drawer + 2,
            borderRadius: 3,
            overflow: "hidden",
            display: aiOpen ? "flex" : "none",
            flexDirection: "column",
          }}
        >
          <AIChatPanel />
        </Paper>
      </Grow>
      <AIChatButton />
    </Box>
  );
}
