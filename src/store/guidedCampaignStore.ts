import { create } from "zustand";
import { migrateDefaultLocale } from "@formbuilder/shared";
import type { AIFormProposal, AIFormProposalQuestion, ControlType, FormVariant } from "@formbuilder/shared";
import * as aiChatApi from "../api/aiChatApi";
import type { QuestionSearchResult } from "../api/aiChatApi";
import { getFormDetail, updateDraft } from "../api/formBuilderApi";
import { listSubsidiaryLocales } from "../api/subsidiaryLocalesApi";
import type { ProfileFieldKey } from "../components/formBuilder/ProfileFieldEditorPanel";

/** The AI chat panel's guided "create a new campaign" flow — every step here
 * is a plain REST lookup or a click (listSubsidiaries/listOpenProjectCodes/
 * searchQuestions/listSubsidiaryLocales), never an LLM call; the only
 * LLM-touching step is drafting a custom question when nothing in the
 * library search fits (POST /ai/questions/draft). Lives inside AIChatPanel
 * (see GuidedCampaignFlow.tsx), not a separate dialog — starts automatically
 * when the panel has nothing else going on (see AIChatPanel's own effect),
 * and is cancelled the moment the user sends a real chat message instead
 * (see aiChatStore.sendMessage).
 *
 * Always produces an admin-origin campaign — ai_proposal_service.
 * save_draft_form always creates origin="admin" when the caller is an admin,
 * with no override (the same pre-existing limitation the old server-executed
 * CREATE_CAMPAIGN tool had), so this is only meaningful for an admin user. */
export const GUIDED_STEPS = ["category", "subsidiary", "projectCode", "fields", "variant", "questions", "locales", "review"] as const;
export type GuidedStep = (typeof GUIDED_STEPS)[number];

export const PROFILE_FIELD_OPTIONS: { key: ProfileFieldKey; label: string }[] = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "mobileNumber", label: "Mobile Number" },
  { key: "privacyPolicy", label: "Privacy Policy" },
  { key: "marketingOptin", label: "Marketing Opt-in" },
  { key: "termsAndConditions", label: "Terms and Conditions" },
];

export interface WizardAnswer {
  text: string;
  keep: boolean;
  /** Preserved from a search result's own answer id so the final proposal
   * can cite it as a reused option (ProposalAnswer.sourceAnswerId) — null
   * for a freshly drafted question, which has no source to cite. */
  sourceAnswerId: string | null;
}

export interface WizardQuestion {
  heading: string;
  subheading: string | null;
  controlType: ControlType;
  required: boolean;
  answers: WizardAnswer[];
  reused: boolean;
  sourceFormId: string | null;
  sourceQuestionId: string | null;
}

function questionToWizard(q: AIFormProposalQuestion): WizardQuestion {
  return {
    heading: q.heading,
    subheading: q.subheading,
    controlType: q.controlType,
    required: q.required,
    answers: q.answers.map((text) => ({ text, keep: true, sourceAnswerId: null })),
    reused: q.reused,
    sourceFormId: q.sourceFormId,
    sourceQuestionId: q.sourceQuestionId,
  };
}

function searchResultToWizard(result: QuestionSearchResult): WizardQuestion {
  return {
    heading: result.heading,
    subheading: result.subheading,
    controlType: result.controlType ?? "text",
    required: result.required,
    answers: result.answers.map((a) => ({ text: a.text, keep: true, sourceAnswerId: a.id })),
    reused: true,
    sourceFormId: result.sourceFormId,
    sourceQuestionId: result.sourceQuestionId,
  };
}

interface GuidedCampaignState {
  active: boolean;
  stepIndex: number;
  name: string;
  category: string;
  subsidiaryId: string;
  projectCode: string | null;
  fields: ProfileFieldKey[];
  variants: FormVariant[];
  questions: WizardQuestion[];
  locales: string[];
  submitting: boolean;
  error: string | null;
  /** Set once the final step's submit() succeeds — the panel then hands off
   * to the existing ProposalCard for Approve & Save. */
  proposal: AIFormProposal | null;

  start: () => void;
  cancel: () => void;
  setName: (value: string) => void;
  setCategory: (value: string) => void;
  setSubsidiaryId: (value: string) => void;
  setProjectCode: (value: string | null) => void;
  toggleField: (key: ProfileFieldKey) => void;
  setVariants: (variants: FormVariant[]) => void;
  toggleLocale: (code: string) => void;
  addSearchResult: (result: QuestionSearchResult) => void;
  addDraftedQuestion: (question: AIFormProposalQuestion) => void;
  removeQuestion: (index: number) => void;
  updateQuestionHeading: (index: number, heading: string) => void;
  toggleAnswer: (questionIndex: number, answerIndex: number) => void;
  updateAnswerText: (questionIndex: number, answerIndex: number, text: string) => void;
  next: () => void;
  back: () => void;
  submit: () => Promise<boolean>;
  /** Applies the extras a proposal can't carry (profile fields, variant,
   * locales — see this file's own doc comment) onto the just-created draft,
   * via the same getFormDetail/updateDraft the builder itself uses. Awaited
   * by ProposalCard's onApproved before it navigates, so the builder opens
   * already showing them. Best-effort — the campaign is created either way;
   * these can still be set by hand in the builder if this fails. */
  finalizeAfterApprove: (formId: string) => Promise<void>;
  reset: () => void;
}

const initialState = {
  active: false,
  stepIndex: 0,
  name: "",
  category: "",
  subsidiaryId: "",
  projectCode: null as string | null,
  fields: [] as ProfileFieldKey[],
  variants: [] as FormVariant[],
  questions: [] as WizardQuestion[],
  locales: [] as string[],
  submitting: false,
  error: null as string | null,
  proposal: null as AIFormProposal | null,
};

export const useGuidedCampaignStore = create<GuidedCampaignState>((set, get) => ({
  ...initialState,

  start() {
    set({ ...initialState, active: true });
  },

  cancel() {
    set({ ...initialState });
  },

  setName(value) {
    set({ name: value });
  },

  setCategory(value) {
    set({ category: value });
  },

  setSubsidiaryId(value) {
    set({ subsidiaryId: value, projectCode: null });
  },

  setProjectCode(value) {
    set({ projectCode: value });
  },

  toggleField(key) {
    set((s) => ({ fields: s.fields.includes(key) ? s.fields.filter((k) => k !== key) : [...s.fields, key] }));
  },

  setVariants(variants) {
    set({ variants });
  },

  toggleLocale(code) {
    set((s) => ({ locales: s.locales.includes(code) ? s.locales.filter((c) => c !== code) : [...s.locales, code] }));
  },

  addSearchResult(result) {
    set((s) => ({ questions: [...s.questions, searchResultToWizard(result)] }));
  },

  addDraftedQuestion(question) {
    set((s) => ({ questions: [...s.questions, questionToWizard(question)] }));
  },

  removeQuestion(index) {
    set((s) => ({ questions: s.questions.filter((_, i) => i !== index) }));
  },

  updateQuestionHeading(index, heading) {
    set((s) => ({ questions: s.questions.map((q, i) => (i === index ? { ...q, heading } : q)) }));
  },

  toggleAnswer(questionIndex, answerIndex) {
    set((s) => ({
      questions: s.questions.map((q, i) =>
        i === questionIndex
          ? { ...q, answers: q.answers.map((a, j) => (j === answerIndex ? { ...a, keep: !a.keep } : a)) }
          : q,
      ),
    }));
  },

  updateAnswerText(questionIndex, answerIndex, text) {
    set((s) => ({
      questions: s.questions.map((q, i) =>
        i === questionIndex ? { ...q, answers: q.answers.map((a, j) => (j === answerIndex ? { ...a, text } : a)) } : q,
      ),
    }));
  },

  next() {
    set((s) => ({ stepIndex: Math.min(s.stepIndex + 1, GUIDED_STEPS.length - 1) }));
  },

  back() {
    set((s) => ({ stepIndex: Math.max(s.stepIndex - 1, 0) }));
  },

  async submit() {
    const { name, category, subsidiaryId, projectCode, questions } = get();
    set({ submitting: true, error: null });
    try {
      const result = await aiChatApi.createWizardProposal({
        name: name.trim() || category.trim() || "New campaign",
        projectCode: projectCode || undefined,
        subsidiary: subsidiaryId,
        baseFormId: null,
        questions: questions.map((q) => ({
          id: null,
          sourceFormId: q.sourceFormId,
          sourceQuestionId: q.sourceQuestionId,
          controlType: q.controlType,
          required: q.required,
          heading: q.heading,
          subheading: q.subheading,
          answers: q.answers
            .filter((a) => a.keep)
            .map((a) => ({ id: null, sourceAnswerId: a.sourceAnswerId, text: a.text })),
        })),
      });
      if (!result.valid) {
        const message = (result.errors ?? []).map((e) => e.message).join(" ") || "This campaign isn't valid yet";
        set({ submitting: false, error: message });
        return false;
      }
      const proposal: AIFormProposal = {
        id: result.id!,
        version: result.version!,
        name: result.name!,
        subsidiary: result.subsidiary!,
        projectCode: result.projectCode ?? null,
        baseFormId: result.baseFormId ?? null,
        questions: result.questions!,
        warnings: result.warnings ?? [],
        saved: result.saved ?? false,
        savedFormId: result.savedFormId ?? null,
      };
      set({ submitting: false, proposal });
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to create the proposal", submitting: false });
      return false;
    }
  },

  async finalizeAfterApprove(formId) {
    const { fields, variants, locales } = get();
    if (fields.length === 0 && variants.length === 0 && locales.length === 0) return;
    try {
      const detail = await getFormDetail(formId);
      const draft = detail.draft;
      if (!draft) return;
      let definition = draft.definition;
      let config = draft.config;

      if (locales.length > 0) {
        const master = await listSubsidiaryLocales(definition.meta.subsidiary);
        const selected = master.filter((m) => locales.includes(m.code));
        if (selected.length > 0) {
          definition = {
            ...definition,
            locales: selected.map((m) => ({ code: m.code, langSubtag: m.langSubtag, isRtl: m.isRtl, sourceColumn: "builder" as const, label: m.label })),
          };
          if (!locales.includes(definition.meta.defaultLocale)) {
            definition = migrateDefaultLocale(definition, selected[0].code);
          }
        }
      }

      if (fields.length > 0) {
        const defaultLocale = definition.meta.defaultLocale;
        const nextFields = { ...definition.fields };
        for (const key of fields) {
          if (key === "firstName") nextFields.firstName = { labelByLocale: { [defaultLocale]: "First Name" } };
          else if (key === "lastName") nextFields.lastName = { labelByLocale: { [defaultLocale]: "Last Name" } };
          else if (key === "email") nextFields.email = { labelByLocale: { [defaultLocale]: "Email" } };
          else if (key === "mobileNumber") nextFields.mobileNumber = { labelByLocale: { [defaultLocale]: "Mobile Number" }, dropdownFirstEntryByLocale: {}, countries: [] };
          else if (key === "privacyPolicy") nextFields.privacyPolicy = { textByLocale: { [defaultLocale]: "I agree to the" }, linkUrlByLocale: {}, linkTextByLocale: {} };
          else if (key === "marketingOptin") nextFields.marketingOptin = { labelByLocale: { [defaultLocale]: "Marketing Opt-in" } };
          else if (key === "termsAndConditions") nextFields.termsAndConditions = { textByLocale: {}, urlByLocale: {} };
        }
        definition = { ...definition, fields: nextFields };
      }

      if (variants.length > 0) {
        config = { ...config, variants };
      }

      await updateDraft(formId, definition, config);
    } catch {
      // Best-effort — see this method's own doc comment.
    }
  },

  reset() {
    set({ ...initialState });
  },
}));
