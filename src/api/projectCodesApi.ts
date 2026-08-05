import { apiClient } from "./apiClient";

export interface ProjectCode {
  id: string;
  code: string;
  isOpen: boolean;
  createdAt: string;
}

/** GET /api/v1/project-codes — open project codes only, populating the
 * upload form's "Project Code" dropdown. Any authenticated user, not just
 * admins — see backend/src/routes/projectCode.router.ts. Admin management
 * (seeing closed codes too, creating, opening/closing) lives in adminApi.ts. */
export function listOpenProjectCodes(): Promise<ProjectCode[]> {
  return apiClient.get<ProjectCode[]>("/api/v1/project-codes");
}
