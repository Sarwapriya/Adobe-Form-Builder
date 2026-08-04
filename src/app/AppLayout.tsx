import type { CSSProperties } from "react";
import { AppBar, Avatar, Box, Button, Chip, Toolbar, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";

function navLinkStyle({ isActive }: { isActive: boolean }): CSSProperties {
  return {
    color: "#fff",
    textDecoration: "none",
    fontWeight: isActive ? 700 : 500,
    fontSize: 14,
    padding: "6px 14px",
    borderRadius: 999,
    marginRight: 8,
    background: isActive ? "rgba(255, 255, 255, 0.18)" : "transparent",
    transition: "background 0.15s ease",
  };
}

/** Shell for every authenticated page: top nav (role-gated Admin Dashboard
 * link, username, logout) + the current route rendered via <Outlet/>. Mounted
 * once as the layout route wrapping "/" and "/admin" (see App.tsx). */
export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1, py: 1 }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4, fontWeight: 700 }}>
            Form Builder
          </Typography>

          <Box sx={{ flexGrow: 1, display: "flex" }}>
            <NavLink to="/" end style={navLinkStyle}>
              Upload History
            </NavLink>
            {user?.role === "admin" && (
              <NavLink to="/admin" style={navLinkStyle}>
                Admin Dashboard
              </NavLink>
            )}
          </Box>

          <Chip
            avatar={
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "#fff" }}>
                {user?.username?.[0]?.toUpperCase() ?? "?"}
              </Avatar>
            }
            label={`${user?.username} · ${user?.role}`}
            sx={{
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.12)",
              mr: 2,
              "& .MuiChip-avatar": { ml: 0.5 },
            }}
          />
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ bgcolor: "rgba(255,255,255,0.08)", "&:hover": { bgcolor: "rgba(255,255,255,0.16)" } }}
          >
            Log out
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, p: 3, maxWidth: 1280, width: "100%", mx: "auto" }}>
        <Outlet />
      </Box>
    </Box>
  );
}
