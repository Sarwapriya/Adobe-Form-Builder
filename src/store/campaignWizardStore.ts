import { create } from "zustand";
import type { AIFormProposal, AIFormProposalQuestion, ControlType } from "@formbuilder/shared";
import * as aiChatApi from "../api/aiChatApi";
import type { QuestionSearchResult } from "../api/aiChatApi";

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

/** This wizard always produces an admin-origin campaign (same as
 * HrFormInitiatorListPage's "New Form"/"Copy") — the AI proposal save path
 * (ai_proposal_service.save_draft_form) always creates origin="admin" when
 * the caller is an admin, with no override, same pre-existing limitation the
 * old server-executed CREATE_CAMPAIGN tool had. Offering this from Ad-hoc
 * Forms would silently produce an HR-origin campaign instead of an ad-hoc
 * one — the same bug class already fixed for that page's own Copy action —
 * so for now this is only reachable from HR Form Initiator. */
export const WIZARD_STEPS = ["category", "subsidiary", "projectCode", "questions", "review"] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

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

interface CampaignWizardState {
  open: boolean;
  stepIndex: number;
  name: string;
  category: string;
  subsidiaryId: string;
  projectCode: string | null;
  questions: WizardQuestion[];
  submitting: boolean;
  error: string | null;
  /** Set once the final step's submit() succeeds — the wizard then hands off
   * to the existing ProposalCard for Approve & Save, exactly like the chat flow. */
  proposal: AIFormProposal | null;

  openWizard: () => void;
  close: () => void;
  setName: (value: string) => void;
  setCategory: (value: string) => void;
  setSubsidiaryId: (value: string) => void;
  setProjectCode: (value: string | null) => void;
  addSearchResult: (result: QuestionSearchResult) => void;
  addDraftedQuestion: (question: AIFormProposalQuestion) => void;
  removeQuestion: (index: number) => void;
  updateQuestionHeading: (index: number, heading: string) => void;
  toggleAnswer: (questionIndex: number, answerIndex: number) => void;
  updateAnswerText: (questionIndex: number, answerIndex: number, text: string) => void;
  next: () => void;
  back: () => void;
  submit: () => Promise<boolean>;
  reset: () => void;
}

const initialState = {
  open: false,
  stepIndex: 0,
  name: "",
  category: "",
  subsidiaryId: "",
  projectCode: null as string | null,
  questions: [] as WizardQuestion[],
  submitting: false,
  error: null as string | null,
  proposal: null as AIFormProposal | null,
};

export const useCampaignWizardStore = create<CampaignWizardState>((set, get) => ({
  ...initialState,

  openWizard() {
    set({ ...initialState, open: true });
  },

  close() {
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
    set((s) => ({ stepIndex: Math.min(s.stepIndex + 1, WIZARD_STEPS.length - 1) }));
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

  reset() {
    set({ ...initialState });
  },
}));
