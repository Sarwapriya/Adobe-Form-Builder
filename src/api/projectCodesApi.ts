import { apiClient } from "./apiClient";

export interface ProjectCode {
  id: string;
  code: string;
  isOpen: boolean;
  /** A separate, more permanent freeze from `isOpen` — once locked, subsidiary
   * (non-admin) users can no longer submit Form Builder contributions or Excel
   * uploads for this project code, and it becomes the precondition for generating a
   * Question Master (see backend ProjectCode entity's own doc comment). Admins stay
   * exempt. */
  isLocked: boolean;
  /** Purely descriptive campaign date range ("YYYY-MM-DD"), never enforced
   * against uploads — see backend ProjectCode entity's own doc comment. */
  startDate: string | null;
  endDate: string | null;
  /** Deadline for subsidiary users to get their contributions to this
   * project's forms approved ("YYYY-MM-DD") — see backend ProjectCode
   * entity's own doc comment. Unlike startDate/endDate, meaningful but not
   * enforced here either; it's what a reminder-email feature reads. */
  cutoffDate: string | null;
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
