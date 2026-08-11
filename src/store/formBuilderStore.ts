import { create } from "zustand";
import { validateFormDefinition, type BuilderConfig, type FormDefinition, type ValidationResult } from "@formbuilder/shared";
import {
  deleteForm as apiDeleteForm,
  FormInvalidError,
  getFormDetail,
  publishForm as apiPublishForm,
  unpublishForm as apiUnpublishForm,
  updateDraft as apiUpdateDraft,
  type FormDetail,
  type FormStatus,
} from "../api/formBuilderApi";

interface FormBuilderState {
  formId: string | null;
  name: string;
  subsidiaryId: string;
  projectCode: string | null;
  status: FormStatus;
  definition: FormDefinition | null;
  config: BuilderConfig | null;
  validation: ValidationResult;
  dirty: boolean;
  loading: boolean;
  saving: boolean;
  publishing: boolean;
  error: string | null;

  loadForm: (formId: string) => Promise<void>;
  updateDefinition: (updater: (definition: FormDefinition) => FormDefinition) => void;
  updateConfig: (patch: Partial<BuilderConfig>) => void;
  saveDraft: () => Promise<boolean>;
  publish: () => Promise<{ ok: boolean; validation?: ValidationResult }>;
  unpublish: () => Promise<boolean>;
  deleteForm: () => Promise<boolean>;
  reset: () => void;
}

const EMPTY_VALIDATION: ValidationResult = { errors: [], warnings: [] };

function applyDetail(detail: FormDetail) {
  const content = detail.draft ?? detail.published;
  return {
    formId: detail.id,
    name: detail.name,
    subsidiaryId: detail.subsidiaryId,
    projectCode: detail.projectCode,
    status: detail.status,
    definition: content?.definition ?? null,
    config: content?.config ?? null,
    validation: content ? validateFormDefinition(content.definition) : EMPTY_VALIDATION,
    dirty: false,
  };
}

export const useFormBuilderStore = create<FormBuilderState>((set, get) => ({
  formId: null,
  name: "",
  subsidiaryId: "",
  projectCode: null,
  status: "draft",
  definition: null,
  config: null,
  validation: EMPTY_VALIDATION,
  dirty: false,
  loading: false,
  saving: false,
  publishing: false,
  error: null,

  async loadForm(formId) {
    set({ loading: true, error: null });
    try {
      const detail = await getFormDetail(formId);
      set(applyDetail(detail));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load form" });
    } finally {
      set({ loading: false });
    }
  },

  updateDefinition(updater) {
    const current = get().definition;
    if (!current) return;
    const next = updater(current);
    set({ definition: next, validation: validateFormDefinition(next), dirty: true });
  },

  updateConfig(patch) {
    const current = get().config;
    if (!current) return;
    set({ config: { ...current, ...patch }, dirty: true });
  },

  async saveDraft() {
    const { formId, definition, config } = get();
    if (!formId || !definition || !config) return false;
    set({ saving: true, error: null });
    try {
      await apiUpdateDraft(formId, definition, config);
      set({ dirty: false });
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save draft" });
      return false;
    } finally {
      set({ saving: false });
    }
  },

  async publish() {
    const { formId, saveDraft } = get();
    if (!formId) return { ok: false };
    // Publish always operates on the persisted draft server-side, so save first
    // — otherwise an in-progress edit that was never saved would silently
    // publish stale content.
    const saved = await saveDraft();
    if (!saved) return { ok: false };

    set({ publishing: true, error: null });
    try {
      const { validation } = await apiPublishForm(formId);
      await get().loadForm(formId);
      return { ok: true, validation };
    } catch (err) {
      const validation = err instanceof FormInvalidError ? err.validation : undefined;
      set({ error: err instanceof Error ? err.message : "Failed to publish form", validation: validation ?? get().validation });
      return { ok: false, validation };
    } finally {
      set({ publishing: false });
    }
  },

  async unpublish() {
    const { formId } = get();
    if (!formId) return false;
    set({ error: null });
    try {
      await apiUnpublishForm(formId);
      await get().loadForm(formId);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to unpublish form" });
      return false;
    }
  },

  async deleteForm() {
    const { formId } = get();
    if (!formId) return false;
    try {
      await apiDeleteForm(formId);
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to delete form" });
      return false;
    }
  },

  reset() {
    set({
      formId: null,
      name: "",
      subsidiaryId: "",
      projectCode: null,
      status: "draft",
      definition: null,
      config: null,
      validation: EMPTY_VALIDATION,
      dirty: false,
      loading: false,
      saving: false,
      publishing: false,
      error: null,
    });
  },
}));
