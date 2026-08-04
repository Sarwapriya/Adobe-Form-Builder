import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "./authStore";

/**
 * Gates access to its nested routes behind an authenticated *admin* session.
 * Always used nested inside <ProtectedRoute/> (so "not authenticated at all"
 * is already handled there) — this only needs to check the role.
 */
export function AdminRoute() {
  const user = useAuthStore((s) => s.user);

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
