import type { AdminUserRole } from "../api/adminApi";

const ROLE_LABEL: Record<AdminUserRole, string> = {
  standard: "Subsidiary",
  admin: "Admin",
  superadmin: "Superadmin",
};

/** Display name for a role. The stored/API value for a subsidiary-scoped user is
 * still `"standard"` — only what people read on screen is renamed. */
export function roleLabel(role: string | null | undefined): string {
  if (!role) return "";
  return ROLE_LABEL[role as AdminUserRole] ?? role;
}
