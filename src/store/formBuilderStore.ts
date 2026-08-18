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
import {
  getMyAdHocFormDetail,
  submitAdHocFormForReview as apiSubmitAdHocFormForReview,
  updateMyAdHocFormDraft as apiUpdateMyAdHocFormDraft,
} from "../api/subsidiaryFormsApi";

/** "admin" (Form Initiator, the default) or "adhoc" (a subsidiary user's own My
 * Forms builder session) — set once by loadForm's own `mode` argument and read by
 * saveDraft/publish-equivalent actions to decide which API base to call. Every
 * builder panel (BuilderCanvas, QuestionEditorPanel, etc.) is unaffected — they
 * only ever touch `definition`/`config`, never the network layer directly. */
export type FormBuilderMode = "admin" | "adhoc";

interface FormBuilderState {
  formId: string | null;
  mode: FormBuilderMode;
  name: string;
  subsidiaryId: string;
  projectCode: string | null;
  status: FormStatus;
  pendingReview: boolean;
  submittedForReviewAt: string | null;
  reviewNote: string | null;
  /** Which locale's text every builder panel (QuestionEditorPanel,
   * ProfileFieldEditorPanel, ConsentEditorPanel) currently reads/writes —
   * defaults to the form's own default locale on every load. Only the ad-hoc
   * builder's SubsidiaryLocalePicker exposes a switcher for this today; admin's
   * own LocaleManagerPanel doesn't, so admin's editing experience is unchanged
   * (activeLocale simply never moves off defaultLocale there). */
  activeLocale: string;
  definition: FormDefinition | null;
  config: BuilderConfig | null;
  validation: ValidationResult;
  dirty: boolean;
  loading: boolean;
  saving: boolean;
  publishing: boolean;
  error: string | null;

  loadForm: (formId: string, mode?: FormBuilderMode) => Promise<void>;
  setActiveLocale: (locale: string) => void;
  updateDefinition: (updater: (definition: FormDefinition) => FormDefinition) => void;
  updateConfig: (patch: Partial<BuilderConfig>) => void;
  saveDraft: () => Promise<boolean>;
  publish: () => Promise<{ ok: boolean; validation?: ValidationResult }>;
  unpublish: () => Promise<boolean>;
  deleteForm: () => Promise<boolean>;
  /** adhoc mode only — saves the draft, then submits it for admin review (see
   * formBuilderService.submitAdHocFormForReview). Mirrors publish()'s own
   * save-first shape, but there's no validation gate here (unlike publish) —
   * validation only happens later, when the reviewing admin approves. */
  submitForReview: () => Promise<boolean>;
  reset: () => void;
}

const EMPTY_VALIDATION: ValidationResult = { errors: [], warnings: [] };

function applyDetail(detail: FormDetail, mode: FormBuilderMode) {
  const content = detail.draft ?? detail.published;
  return {
    formId: detail.id,
    mode,
    name: detail.name,
    subsidiaryId: detail.subsidiaryId,
    projectCode: detail.projectCode,
    status: detail.status,
    pendingReview: detail.pendingReview,
    submittedForReviewAt: detail.submittedForReviewAt,
    reviewNote: detail.reviewNote,
    activeLocale: content?.definition.meta.defaultLocale ?? "en_GB",
    definition: content?.definition ?? null,
    config: content?.config ?? null,
    validation: content ? validateFormDefinition(content.definition) : EMPTY_VALIDATION,
    dirty: false,
  };
}

export const useFormBuilderStore = create<FormBuilderState>((set, get) => ({
  formId: null,
  mode: "admin",
  name: "",
  subsidiaryId: "",
  projectCode: null,
  status: "draft",
  pendingReview: false,
  submittedForReviewAt: null,
  reviewNote: null,
  activeLocale: "en_GB",
  definition: null,
  config: null,
  validation: EMPTY_VALIDATION,
  dirty: false,
  loading: false,
  saving: false,
  publishing: false,
  error: null,

  async loadForm(formId, mode = "admin") {
    set({ loading: true, error: null });
    try {
      const detail = mode === "adhoc" ? await getMyAdHocFormDetail(formId) : await getFormDetail(formId);
      set(applyDetail(detail, mode));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load form" });
    } finally {
      set({ loading: false });
    }
  },

  setActiveLocale(locale) {
    set({ activeLocale: locale });
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
    const { formId, mode, definition, config } = get();
    if (!formId || !definition || !config) return false;
    set({ saving: true, error: null });
    try {
      if (mode === "adhoc") {
        await apiUpdateMyAdHocFormDraft(formId, definition, config);
      } else {
        await apiUpdateDraft(formId, definition, config);
      }
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

  async submitForReview() {
    const { formId, saveDraft } = get();
    if (!formId) return false;
    // Same reasoning as publish() — the server submits whatever's persisted, so
    // save first or an unsaved edit would silently go up for review stale.
    const saved = await saveDraft();
    if (!saved) return false;

    set({ publishing: true, error: null });
    try {
      await apiSubmitAdHocFormForReview(formId);
      await get().loadForm(formId, "adhoc");
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to submit for review" });
      return false;
    } finally {
      set({ publishing: false });
    }
  },

  reset() {
    set({
      formId: null,
      mode: "admin",
      name: "",
      subsidiaryId: "",
      projectCode: null,
      status: "draft",
      pendingReview: false,
      submittedForReviewAt: null,
      reviewNote: null,
      activeLocale: "en_GB",
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
