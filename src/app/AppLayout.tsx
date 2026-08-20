import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DescriptionIcon from "@mui/icons-material/Description";
import LogoutIcon from "@mui/icons-material/Logout";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
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

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 76;
const COLLAPSE_STORAGE_KEY = "sidebarCollapsed";

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

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true");
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const navItems: NavItem[] = [
    { to: "/", label: "Upload History", icon: <UploadFileIcon />, exact: true },
    ...(user?.subsidiaryId
      ? [
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
          { to: "/my-subsidiary", label: "My Subsidiary", icon: <DomainIcon />, exact: true },
        ]
      : []),
  ];

  /** Admin Dashboard/All History aren't specific to the Excel-upload workflow
   * or the form-builder one — they're the general submitted/generated-output
   * overview an admin checks regardless of which flow produced it — so they
   * stay ungrouped (no section caption) rather than living under either
   * labeled group below. "Upload History" above already stands in as the
   * Excel-upload entry point (it's shared with subsidiary users, who upload
   * workbooks from that same page), so there's no separate "Excel Upload"
   * group left to house on the admin side. */
  const adminCommonItems: NavItem[] = isAdminRole(user?.role)
    ? [
        { to: "/admin", label: "Admin Dashboard", icon: <AdminPanelSettingsIcon />, exact: true },
        { to: "/admin/history", label: "All History", icon: <HistoryIcon />, exact: true },
      ]
    : [];

  /** Admin-only items, grouped into the form-builder side (Form Initiator/
   * Question Master) and general back-office administration (master data +
   * accounts) that isn't specific to either flow — Configuration and User
   * Management govern both Excel uploads and form-builder forms equally, so
   * neither belongs under a single-flow group. Mirrors the split the
   * subsidiary side's own "My Forms" submenu already draws between ad-hoc/HR
   * forms and everything else. */
  const adminSections: NavSection[] = isAdminRole(user?.role)
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
            { to: "/admin/question-master", label: "Question Master", icon: <ListAltIcon />, exact: false },
          ],
        },
        {
          label: "Administration",
          items: [
            { to: "/admin/configuration", label: "Configuration", icon: <SettingsIcon />, exact: true },
            { to: "/admin/users", label: "User Management", icon: <PeopleIcon />, exact: true },
          ],
        },
      ]
    : [];

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
            backgroundImage: "linear-gradient(180deg, #1428a0 0%, #16227a 100%)",
            color: "#fff",
            transition: (t) => t.transitions.create("width", { duration: t.transitions.duration.shortest }),
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 2, py: 2.5, minHeight: 72 }}>
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
          {!collapsed && (
            <Typography variant="h6" fontWeight={700} noWrap sx={{ flexGrow: 1 }}>
              Form Builder
            </Typography>
          )}
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

        <List sx={{ px: 1.25, py: 1.5, flexGrow: 1 }}>
          {navItems.map((item) => renderNavItem(item))}
          {adminCommonItems.map((item) => renderNavItem(item))}
          {adminSections.map((section) => (
            <Box key={section.label} sx={{ mt: 1.5 }}>
              {!collapsed ? (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    px: 1.5,
                    py: 0.5,
                    color: "rgba(255,255,255,0.5)",
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                  }}
                >
                  {section.label}
                </Typography>
              ) : (
                <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", my: 1 }} />
              )}
              {section.items.map((item) => renderNavItem(item))}
            </Box>
          ))}
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
    </Box>
  );
}
