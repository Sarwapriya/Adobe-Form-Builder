import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "./authStore";

/**
 * Gates access to its nested routes (rendered via <Outlet/>) behind an
 * authenticated session. While the initial silentRefresh (triggered once at
 * app startup — see App.tsx) is still in flight, status is "idle"/"loading"
 * and a spinner renders instead, to avoid a flash of the login page for users
 * who actually do have a valid session.
 */
export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
