import { Navigate, Outlet } from "react-router-dom";
import { isAdminRole, useAuthStore } from "./authStore";

/**
 * Gates access to its nested routes behind an authenticated admin session
 * ("admin" or "superadmin" — see isAdminRole). Always used nested inside
 * <ProtectedRoute/> (so "not authenticated at all" is already handled there)
 * — this only needs to check the role.
 */
export function AdminRoute() {
  const user = useAuthStore((s) => s.user);

  if (!isAdminRole(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
