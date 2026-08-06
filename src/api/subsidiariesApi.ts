import { apiClient } from "./apiClient";

export interface Subsidiary {
  id: string;
  name: string;
  createdAt: string;
}

/** GET /api/v1/subsidiaries — every subsidiary, populating the upload form's
 * "Subsidiary" dropdown. Any authenticated user, not just admins — see
 * backend/src/routes/subsidiary.router.ts. There's no open/closed
 * distinction on a subsidiary itself — see projectCodesApi.ts's
 * `subsidiary` filter param and adminApi.ts's block management for the
 * actual per-subsidiary upload restriction (always scoped to one project
 * code). Admin-only subsidiary creation lives in adminApi.ts. */
export function listSubsidiaries(): Promise<Subsidiary[]> {
  return apiClient.get<Subsidiary[]>("/api/v1/subsidiaries");
}
