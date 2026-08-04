import type { CSSProperties } from "react";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";

function navLinkStyle({ isActive }: { isActive: boolean }): CSSProperties {
  return {
    color: "inherit",
    textDecoration: "none",
    fontWeight: isActive ? 700 : 400,
    marginRight: 16,
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
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
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

          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.username} ({user?.role})
          </Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
            Log out
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
