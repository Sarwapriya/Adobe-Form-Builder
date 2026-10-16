import type { BuilderConfig, FormDefinition } from "@formbuilder/shared";
import { apiClient } from "./apiClient";

export type TemplateScope = "USER" | "SUBSIDIARY" | "GLOBAL";

export interface TemplateSummary {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  scope: TemplateScope;
  subsidiaryName: string | null;
  createdByUserId: string;
  createdByUsername: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateDetail extends TemplateSummary {
  definition: FormDefinition;
  config: BuilderConfig;
}

// A type alias (not an interface) — object type aliases get an implicit
// string index signature when every property is string/number/undefined,
// matching formBuilderApi.ts's ListFormsParams convention.
export type ListTemplatesParams = {
  search?: string;
  category?: string;
};

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** Every template visible to the caller — scope/ownership filtering happens
 * entirely server-side (`app/routers/templates.py`'s `list_templates`), so
 * this never needs to know the caller's own role/subsidiary to filter
 * client-side. */
export function listTemplates(params: ListTemplatesParams = {}): Promise<TemplateSummary[]> {
  return apiClient.get<TemplateSummary[]>(`/api/v1/templates${buildQuery(params)}`);
}

/** Full `definition`/`config` — used by the preview dialog and by "Save as
 * Template" when re-saving a template's own content isn't needed (the
 * create-from-template flow never calls this itself; the backend resolves
 * `copyFromTemplateId` on its own, see formBuilderApi.ts's CreateFormInput). */
export function getTemplateDetail(templateId: string): Promise<TemplateDetail> {
  return apiClient.get<TemplateDetail>(`/api/v1/templates/${templateId}`);
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category?: string;
  /** Resolved against the caller's actual role/subsidiary server-side — a
   * subsidiary user requesting "GLOBAL" or another subsidiary's name is
   * rejected, not silently downgraded. See templates.py's `_resolve_scope`. */
  scope: TemplateScope;
  targetSubsidiaryName?: string;
  definition: FormDefinition;
  config: BuilderConfig;
}

export function createTemplate(input: CreateTemplateInput): Promise<TemplateSummary> {
  return apiClient.post<TemplateSummary>("/api/v1/templates", input);
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  category?: string;
  scope?: TemplateScope;
  targetSubsidiaryName?: string;
}

export function updateTemplate(templateId: string, input: UpdateTemplateInput): Promise<TemplateSummary> {
  return apiClient.put<TemplateSummary>(`/api/v1/templates/${templateId}`, input);
}

export function deleteTemplate(templateId: string): Promise<void> {
  return apiClient.delete<void>(`/api/v1/templates/${templateId}`);
}
