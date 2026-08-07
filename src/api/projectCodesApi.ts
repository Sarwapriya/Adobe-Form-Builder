import { apiClient } from "./apiClient";

export interface ProjectCode {
  id: string;
  code: string;
  isOpen: boolean;
  /** Purely descriptive campaign date range ("YYYY-MM-DD"), never enforced
   * against uploads — see backend ProjectCode entity's own doc comment. */
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

/** GET /api/v1/project-codes — open project codes only, populating the
 * upload form's "Project Code" dropdown. Any authenticated user, not just
 * admins — see backend/src/routes/projectCode.router.ts. Passing
 * `subsidiaryName` also excludes any code an admin has specifically blocked
 * for that subsidiary (see adminApi.ts's subsidiary-project-block
 * management) — without it, only the global open/closed state applies.
 * Admin management (seeing closed codes too, creating, opening/closing)
 * lives in adminApi.ts. */
export function listOpenProjectCodes(subsidiaryName?: string): Promise<ProjectCode[]> {
  const query = subsidiaryName ? `?subsidiary=${encodeURIComponent(subsidiaryName)}` : "";
  return apiClient.get<ProjectCode[]>(`/api/v1/project-codes${query}`);
}
