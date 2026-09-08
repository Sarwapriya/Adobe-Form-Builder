import { create } from "zustand";
import {
  resolveLocalizedText,
  targetKey,
  validateContribution,
  type AnswerDefinition,
  type BuilderConfig,
  type ConsentDefinition,
  type ContributionContent,
  type FormDefinition,
  type QuestionDefinition,
  type TranslationTarget,
  type ValidationResult,
} from "@formbuilder/shared";
import {
  ContributionInvalidError,
  getMyFormDetail,
  saveContributionDraft as apiSaveContributionDraft,
  submitContribution as apiSubmitContribution,
  type ContributionSummary,
} from "../api/subsidiaryFormsApi";

const EMPTY_VALIDATION: ValidationResult = { errors: [], warnings: [] };

// Re-exported so existing importers (e.g. TranslatableField.tsx) don't need to
// switch their import path — the implementation itself now lives in
// @formbuilder/shared's contribution.ts, shared with the admin-side pending-
// contribution hint lookup (pendingTranslationHint.tsx).
export { targetKey };

/** Builds the same `translations` Map shape `setTranslation` produces, from a
 * previously-submitted contribution's own content — used to make a pending or
 * rejected submission's text show up in the editing fields instead of falling
 * back to the base form's (untranslated) existing text. */
function contentTranslationsToMap(
  entries: ContributionSummary["content"]["translations"],
): Map<string, { target: TranslationTarget; locale: string; value: string }> {
  const map = new Map<string, { target: TranslationTarget; locale: string; value: string }>();
  for (const entry of entries) {
    map.set(`${targetKey(entry.target)}::${entry.locale}`, entry);
  }
  return map;
}

interface FormContributionState {
  formId: string | null;
  formName: string;
  baseDefinition: FormDefinition | null;
  /** The published version's own BuilderConfig (variants, favicon, etc.) — a
   * subsidiary user never edits this, but a live preview of their in-progress
   * contribution needs it to call generateSolution the same way admin's own
   * preview/publish does. */
  baseConfig: BuilderConfig | null;
  /** Every locale the form has, including its default — a subsidiary user can
   * translate/edit any of them, the default locale's own text included (see
   * contribution.ts's own doc comment). */
  translatableLocales: string[];
  locale: string;
  /** Keyed by `${targetKey(target)}::${locale}` — the map holds only what this
   * session has edited/is editing, not a full projection of the base form's
   * existing text (each field component pre-fills its own initial value from
   * `baseDefinition` and only starts writing here once the user actually types). */
  translations: Map<string, { target: TranslationTarget; locale: string; value: string }>;
  newQuestions: QuestionDefinition[];
  newConsents: ConsentDefinition[];
  /** Ids of existing (base-form) questions this session proposes deleting —
   * never includes a question the base form marks lockedFromSubsidiary (the
   * mutator below refuses to add one). */
  deletedQuestionIds: Set<string>;
  /** New answer options proposed for an EXISTING question — a question added
   * via newQuestions above carries its own answers and never appears here.
   * `localId` is a session-only React key, discarded on submit (server
   * reassigns real ids the same way newQuestions' ids are). */
  newAnswersForExisting: { localId: string; questionId: string; answer: AnswerDefinition }[];
  /** Existing answers (on an EXISTING question) this session proposes
   * removing — keyed `${questionId}::${answerId}`. Applies regardless of the
   * question's own lockedFromSubsidiary state. */
  deletedAnswerIds: Set<string>;
  note: string;
  validation: ValidationResult;
  loading: boolean;
  submitting: boolean;
  /** True while a Save Draft request (Ctrl+S or the button) is in flight — distinct
   * from `submitting`, since the two actions can't ever race (the button pair is
   * mutually enabled) but do need their own separate "Saving..."/"Submitting..."
   * label. */
  savingDraft: boolean;
  error: string | null;
  ownContributions: ContributionSummary[];
  /** True while this user has a "pending" contribution outstanding for this form —
   * editing is blocked (see MyFormTranslatePage) until an admin reviews it, so
   * a user can't submit several conflicting concurrent contributions for the same
   * form. Derived by `syncOwnContributions`, not settable directly. */
  locked: boolean;
  /** The pending contribution driving `locked`, if any — its own content is what's
   * shown in the (now read-only) fields, so "still showing English right after
   * submitting" can't happen: the fields reflect what was actually submitted,
   * not a reset-to-blank working copy. */
  lockedContribution: ContributionSummary | null;
  /** Guards the rejected-contribution prefill (below) so it only happens once per
   * rejection, not on every refetch — otherwise it would keep clobbering
   * corrections the user has already started typing. */
  prefilledFromContributionId: string | null;
  /** Per-question desired auto-populate enabled state, keyed by questionId — only
   * ever holds entries for questions the base form marks autoPopulateEligible.
   * Seeded from the base form's own autoPopulateEnabled in loadForm, and
   * re-seeded from a pending/rejected contribution's own toggles in
   * syncOwnContributions, same treatment as newQuestions/newConsents. */
  autoPopulateToggles: Map<string, boolean>;
  /** True when this form's own project code is currently locked by an admin — set
   * from `loadForm`'s own response, purely for proactively disabling
   * editing/submission with a clear message (see MyFormTranslatePage). The actual
   * enforcement is server-side (submit() below surfaces the 409 either way), so this
   * is UX only, never the source of truth. Independent of `locked` above (a pending
   * own-contribution) — both can be true at once. */
  projectLocked: boolean;
  /** True once this session has changed something since the last successful Save
   * Draft/Submit (or since load) — drives the Ctrl+S shortcut's enabled state and
   * the Save Draft button's unsaved-changes blink, same convention as
   * formBuilderStore's own `dirty`. */
  dirty: boolean;

  loadForm: (formId: string) => Promise<void>;
  setLocale: (locale: string) => void;
  setTranslation: (target: TranslationTarget, value: string) => void;
  addQuestion: (question: QuestionDefinition) => void;
  removeQuestion: (localId: string) => void;
  addConsent: (consent: ConsentDefinition) => void;
  removeConsent: (localId: string) => void;
  /** Toggles whether an EXISTING question is proposed for deletion. A no-op
   * (defense in depth — the UI already hides the control) when the base
   * form marks that question lockedFromSubsidiary. */
  toggleQuestionDeleted: (questionId: string) => void;
  addAnswerToQuestion: (questionId: string, answer: AnswerDefinition) => void;
  removeNewAnswer: (localId: string) => void;
  /** Toggles whether an EXISTING answer on an EXISTING question is proposed
   * for removal — allowed on every question, locked or not. */
  toggleAnswerDeleted: (questionId: string, answerId: string) => void;
  setAutoPopulateToggle: (questionId: string, enabled: boolean) => void;
  setNote: (note: string) => void;
  /** Persists the current working copy as this user's one draft row for the form —
   * never queues it for admin review (see saveContributionDraft in
   * subsidiaryFormsApi.ts), and unlike submit runs no validation, since the point
   * is being able to save incomplete work. */
  saveDraft: () => Promise<boolean>;
  submit: () => Promise<boolean>;
  /** Called whenever this user's own contributions for the current form are
   * (re)fetched — locks editing while the latest one is still "pending" (showing
   * its submitted content instead of the editable working copy); if the latest is
   * a saved "draft", unlocks editing and resumes it (so reopening the page later
   * continues where Save Draft left off); if "rejected", unlocks editing and
   * prefills the working copy from it once so the user can correct and resubmit
   * rather than starting over. */
  syncOwnContributions: (contributions: ContributionSummary[]) => void;
  reset: () => void;
}

function buildContent(state: FormContributionState): ContributionContent {
  return {
    translations: Array.from(state.translations.values()).filter((t) => t.value.trim() !== ""),
    newQuestions: state.newQuestions,
    newConsents: state.newConsents,
    autoPopulateToggles: Array.from(state.autoPopulateToggles, ([questionId, enabled]) => ({ questionId, enabled })),
    deletedQuestionIds: Array.from(state.deletedQuestionIds),
    newAnswers: state.newAnswersForExisting.map(({ questionId, answer }) => ({ questionId, answer })),
    deletedAnswerIds: Array.from(state.deletedAnswerIds, (key) => {
      const [questionId, answerId] = key.split("::");
      return { questionId, answerId };
    }),
  };
}

/** Seeds the autoPopulateToggles map from a FormDefinition's own eligible questions
 * — used both for the base form (loadForm) and for re-seeding from a previously
 * submitted contribution's own content (syncOwnContributions). */
function autoPopulateTogglesFromQuestions(questions: FormDefinition["questions"]): Map<string, boolean> {
  const map = new Map<string, boolean>();
  for (const q of questions) {
    if (q.autoPopulateEligible) {
      map.set(q.id, !!q.autoPopulateEnabled);
    }
  }
  return map;
}

/** Rebuilds the local (localId-carrying) newAnswersForExisting shape from a
 * previously-submitted contribution's own newAnswers — same reasoning as
 * contentTranslationsToMap: a pending/draft/rejected contribution's own
 * submitted state should be what's shown, not reset to empty. */
function newAnswersForExistingFromContent(
  entries: ContributionSummary["content"]["newAnswers"],
): { localId: string; questionId: string; answer: AnswerDefinition }[] {
  return entries.map((entry, i) => ({ localId: `saved-a-${i}`, questionId: entry.questionId, answer: entry.answer }));
}

/** Overlays a previously-submitted contribution's own auto-populate toggles onto
 * the current eligible-question seed map — same reasoning as
 * contentTranslationsToMap: a pending/rejected contribution's own submitted state
 * should be what's shown, not silently reset back to the base form's values. */
function mergeAutoPopulateToggles(
  base: Map<string, boolean>,
  entries: ContributionSummary["content"]["autoPopulateToggles"],
): Map<string, boolean> {
  const next = new Map(base);
  for (const entry of entries) {
    if (next.has(entry.questionId)) {
      next.set(entry.questionId, entry.enabled);
    }
  }
  return next;
}

export const useFormContributionStore = create<FormContributionState>((set, get) => ({
  formId: null,
  formName: "",
  baseDefinition: null,
  baseConfig: null,
  translatableLocales: [],
  locale: "",
  translations: new Map(),
  newQuestions: [],
  newConsents: [],
  deletedQuestionIds: new Set(),
  newAnswersForExisting: [],
  deletedAnswerIds: new Set(),
  note: "",
  validation: EMPTY_VALIDATION,
  loading: false,
  submitting: false,
  savingDraft: false,
  error: null,
  ownContributions: [],
  locked: false,
  lockedContribution: null,
  prefilledFromContributionId: null,
  projectLocked: false,
  autoPopulateToggles: new Map(),
  dirty: false,

  async loadForm(formId) {
    set({ loading: true, error: null });
    try {
      const detail = await getMyFormDetail(formId);
      if (!detail.published) {
        set({ loading: false, error: "This form has no published content yet." });
        return;
      }
      const translatableLocales = detail.published.definition.locales.map((l) => l.code);
      set({
        formId,
        formName: detail.name,
        baseDefinition: detail.published.definition,
        baseConfig: detail.published.config,
        translatableLocales,
        locale: translatableLocales[0] ?? "",
        translations: new Map(),
        newQuestions: [],
        newConsents: [],
        deletedQuestionIds: new Set(),
        newAnswersForExisting: [],
        deletedAnswerIds: new Set(),
        note: "",
        loading: false,
        projectLocked: detail.projectCodeLocked ?? false,
        autoPopulateToggles: autoPopulateTogglesFromQuestions(detail.published.definition.questions),
        dirty: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load form", loading: false });
    }
  },

  setLocale(locale) {
    set({ locale });
  },

  setTranslation(target, value) {
    const { locale, translations } = get();
    if (!locale) return;
    const key = `${targetKey(target)}::${locale}`;
    const next = new Map(translations);
    next.set(key, { target, locale, value });
    set({ translations: next, dirty: true });
  },

  addQuestion(question) {
    set((s) => ({ newQuestions: [...s.newQuestions, question], dirty: true }));
  },

  removeQuestion(localId) {
    set((s) => ({ newQuestions: s.newQuestions.filter((q) => q.id !== localId), dirty: true }));
  },

  addConsent(consent) {
    set((s) => ({ newConsents: [...s.newConsents, consent], dirty: true }));
  },

  removeConsent(localId) {
    set((s) => ({ newConsents: s.newConsents.filter((c) => c.id !== localId), dirty: true }));
  },

  toggleQuestionDeleted(questionId) {
    const question = get().baseDefinition?.questions.find((q) => q.id === questionId);
    if (question?.lockedFromSubsidiary) return;
    set((s) => {
      const next = new Set(s.deletedQuestionIds);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return { deletedQuestionIds: next, dirty: true };
    });
  },

  addAnswerToQuestion(questionId, answer) {
    set((s) => ({
      newAnswersForExisting: [...s.newAnswersForExisting, { localId: `new-a-${Date.now()}-${Math.random()}`, questionId, answer }],
      dirty: true,
    }));
  },

  removeNewAnswer(localId) {
    set((s) => ({ newAnswersForExisting: s.newAnswersForExisting.filter((a) => a.localId !== localId), dirty: true }));
  },

  toggleAnswerDeleted(questionId, answerId) {
    const key = `${questionId}::${answerId}`;
    set((s) => {
      const next = new Set(s.deletedAnswerIds);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { deletedAnswerIds: next, dirty: true };
    });
  },

  setAutoPopulateToggle(questionId, enabled) {
    set((s) => {
      const next = new Map(s.autoPopulateToggles);
      next.set(questionId, enabled);
      return { autoPopulateToggles: next, dirty: true };
    });
  },

  setNote(note) {
    set({ note, dirty: true });
  },

  async saveDraft() {
    const state = get();
    if (!state.formId) return false;
    const content = buildContent(state);

    set({ savingDraft: true, error: null });
    try {
      await apiSaveContributionDraft(state.formId, content, state.note || undefined);
      set({ dirty: false });
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save draft" });
      return false;
    } finally {
      set({ savingDraft: false });
    }
  },

  async submit() {
    const state = get();
    if (!state.formId || !state.baseDefinition) return false;
    const content = buildContent(state);
    const validation = validateContribution(state.baseDefinition, content);
    set({ validation });
    if (validation.errors.length > 0) return false;

    set({ submitting: true, error: null });
    try {
      await apiSubmitContribution(state.formId, content, state.note || undefined);
      // Deliberately not clearing translations/newQuestions/newConsents here — the
      // caller refetches ownContributions right after a successful submit, and
      // syncOwnContributions (below) will lock the form and re-derive these same
      // fields from the now-pending contribution. Clearing them here first would
      // cause a visible flash back to the (English) base text in between.
      set({ note: "", dirty: false });
      return true;
    } catch (err) {
      if (err instanceof ContributionInvalidError) {
        set({ validation: err.validation, error: "Contribution is not valid — see the errors above." });
      } else {
        set({ error: err instanceof Error ? err.message : "Failed to submit contribution" });
      }
      return false;
    } finally {
      set({ submitting: false });
    }
  },

  syncOwnContributions(contributions) {
    const latest = contributions[0] ?? null; // listOwnContributions orders DESC by submittedAt
    set({ ownContributions: contributions });

    if (latest?.status === "pending") {
      set((s) => ({
        locked: true,
        lockedContribution: latest,
        translations: contentTranslationsToMap(latest.content.translations),
        newQuestions: latest.content.newQuestions,
        newConsents: latest.content.newConsents,
        deletedQuestionIds: new Set(latest.content.deletedQuestionIds),
        newAnswersForExisting: newAnswersForExistingFromContent(latest.content.newAnswers),
        deletedAnswerIds: new Set(latest.content.deletedAnswerIds.map((e) => `${e.questionId}::${e.answerId}`)),
        autoPopulateToggles: mergeAutoPopulateToggles(s.autoPopulateToggles, latest.content.autoPopulateToggles),
      }));
      return;
    }

    set({ locked: false, lockedContribution: null });

    if (latest?.status === "draft" && get().prefilledFromContributionId !== latest.id) {
      set((s) => ({
        prefilledFromContributionId: latest.id,
        note: latest.note ?? "",
        translations: contentTranslationsToMap(latest.content.translations),
        newQuestions: latest.content.newQuestions,
        newConsents: latest.content.newConsents,
        deletedQuestionIds: new Set(latest.content.deletedQuestionIds),
        newAnswersForExisting: newAnswersForExistingFromContent(latest.content.newAnswers),
        deletedAnswerIds: new Set(latest.content.deletedAnswerIds.map((e) => `${e.questionId}::${e.answerId}`)),
        autoPopulateToggles: mergeAutoPopulateToggles(s.autoPopulateToggles, latest.content.autoPopulateToggles),
        dirty: false,
      }));
      return;
    }

    if (latest?.status === "rejected" && get().prefilledFromContributionId !== latest.id) {
      set((s) => ({
        prefilledFromContributionId: latest.id,
        translations: contentTranslationsToMap(latest.content.translations),
        newQuestions: latest.content.newQuestions,
        newConsents: latest.content.newConsents,
        deletedQuestionIds: new Set(latest.content.deletedQuestionIds),
        newAnswersForExisting: newAnswersForExistingFromContent(latest.content.newAnswers),
        deletedAnswerIds: new Set(latest.content.deletedAnswerIds.map((e) => `${e.questionId}::${e.answerId}`)),
        autoPopulateToggles: mergeAutoPopulateToggles(s.autoPopulateToggles, latest.content.autoPopulateToggles),
      }));
    }
  },

  reset() {
    set({
      formId: null,
      formName: "",
      baseDefinition: null,
      baseConfig: null,
      translatableLocales: [],
      locale: "",
      translations: new Map(),
      newQuestions: [],
      newConsents: [],
      deletedQuestionIds: new Set(),
      newAnswersForExisting: [],
      deletedAnswerIds: new Set(),
      note: "",
      validation: EMPTY_VALIDATION,
      loading: false,
      submitting: false,
      savingDraft: false,
      error: null,
      ownContributions: [],
      locked: false,
      lockedContribution: null,
      prefilledFromContributionId: null,
      projectLocked: false,
      autoPopulateToggles: new Map(),
      dirty: false,
    });
  },
}));

/** Convenience read helper for a text field component: what to show as the
 * current value — the user's own in-progress edit if any, else the existing text
 * already on the base form for this locale (which may itself be blank). */
export function resolveTranslationValue(
  translations: Map<string, { target: TranslationTarget; locale: string; value: string }>,
  target: TranslationTarget,
  locale: string,
  existingValue: string,
): string {
  const key = `${targetKey(target)}::${locale}`;
  return translations.get(key)?.value ?? existingValue;
}

export { resolveLocalizedText };
