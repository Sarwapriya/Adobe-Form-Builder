import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Chip,
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
import DescriptionIcon from "@mui/icons-material/Description";
import LogoutIcon from "@mui/icons-material/Logout";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleIcon from "@mui/icons-material/People";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { isAdminRole, useAuthStore } from "../auth/authStore";

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 76;
const COLLAPSE_STORAGE_KEY = "sidebarCollapsed";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  /** Exact-match only — otherwise "/admin" would also read as active while on "/admin/history". */
  exact: boolean;
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

  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const navItems: NavItem[] = [
    { to: "/", label: "Upload History", icon: <UploadFileIcon />, exact: true },
    ...(isAdminRole(user?.role)
      ? [
          { to: "/admin", label: "Admin Dashboard", icon: <AdminPanelSettingsIcon />, exact: true },
          { to: "/admin/history", label: "All History", icon: <HistoryIcon />, exact: true },
          { to: "/admin/configuration", label: "Configuration", icon: <SettingsIcon />, exact: true },
          { to: "/admin/users", label: "User Management", icon: <PeopleIcon />, exact: true },
          { to: "/admin/form-builder", label: "Form Builder", icon: <DesignServicesIcon />, exact: false },
        ]
      : []),
  ];

  const drawerWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

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
          {navItems.map((item) => {
            const selected = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
            const button = (
              <ListItemButton
                key={item.to}
                component={Link}
                to={item.to}
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
                <ListItemIcon
                  sx={{ minWidth: 0, mr: collapsed ? 0 : 1.5, justifyContent: "center", color: "inherit" }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: selected ? 700 : 500 }} />
                )}
              </ListItemButton>
            );
            return collapsed ? (
              <Tooltip key={item.to} title={item.label} placement="right">
                {button}
              </Tooltip>
            ) : (
              button
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
    </Box>
  );
}
