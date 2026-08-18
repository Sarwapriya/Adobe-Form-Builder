import { create } from "zustand";
import {
  resolveLocalizedText,
  validateContribution,
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
  submitContribution as apiSubmitContribution,
  type ContributionSummary,
} from "../api/subsidiaryFormsApi";

const EMPTY_VALIDATION: ValidationResult = { errors: [], warnings: [] };

/** Stable string key for a TranslationTarget, used as the working-edits map key
 * (see `translations` below) — collision-free by construction since it encodes
 * every discriminant field. */
export function targetKey(target: TranslationTarget): string {
  switch (target.kind) {
    case "profileLabel":
      return `profileLabel:${target.field}`;
    case "privacyPolicyText":
      return "privacyPolicyText";
    case "privacyPolicyLink":
      return "privacyPolicyLink";
    case "termsAndConditionsText":
      return "termsAndConditionsText";
    case "termsAndConditionsUrl":
      return "termsAndConditionsUrl";
    case "consentText":
      return `consentText:${target.consentId}`;
    case "consentLink":
      return `consentLink:${target.consentId}`;
    case "questionHeading":
      return `questionHeading:${target.questionId}`;
    case "questionSubheading":
      return `questionSubheading:${target.questionId}`;
    case "answerText":
      return `answerText:${target.questionId}:${target.answerId}`;
  }
}

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
  note: string;
  validation: ValidationResult;
  loading: boolean;
  submitting: boolean;
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

  loadForm: (formId: string) => Promise<void>;
  setLocale: (locale: string) => void;
  setTranslation: (target: TranslationTarget, value: string) => void;
  addQuestion: (question: QuestionDefinition) => void;
  removeQuestion: (localId: string) => void;
  addConsent: (consent: ConsentDefinition) => void;
  removeConsent: (localId: string) => void;
  setAutoPopulateToggle: (questionId: string, enabled: boolean) => void;
  setNote: (note: string) => void;
  submit: () => Promise<boolean>;
  /** Called whenever this user's own contributions for the current form are
   * (re)fetched — locks editing while the latest one is still "pending" (showing
   * its submitted content instead of the editable working copy), or, if the
   * latest is "rejected", unlocks editing and prefills the working copy from it
   * once so the user can correct and resubmit rather than starting over. */
  syncOwnContributions: (contributions: ContributionSummary[]) => void;
  reset: () => void;
}

function buildContent(state: FormContributionState): ContributionContent {
  return {
    translations: Array.from(state.translations.values()).filter((t) => t.value.trim() !== ""),
    newQuestions: state.newQuestions,
    newConsents: state.newConsents,
    autoPopulateToggles: Array.from(state.autoPopulateToggles, ([questionId, enabled]) => ({ questionId, enabled })),
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
  note: "",
  validation: EMPTY_VALIDATION,
  loading: false,
  submitting: false,
  error: null,
  ownContributions: [],
  locked: false,
  lockedContribution: null,
  prefilledFromContributionId: null,
  projectLocked: false,
  autoPopulateToggles: new Map(),

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
        note: "",
        loading: false,
        projectLocked: detail.projectCodeLocked ?? false,
        autoPopulateToggles: autoPopulateTogglesFromQuestions(detail.published.definition.questions),
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
    set({ translations: next });
  },

  addQuestion(question) {
    set((s) => ({ newQuestions: [...s.newQuestions, question] }));
  },

  removeQuestion(localId) {
    set((s) => ({ newQuestions: s.newQuestions.filter((q) => q.id !== localId) }));
  },

  addConsent(consent) {
    set((s) => ({ newConsents: [...s.newConsents, consent] }));
  },

  removeConsent(localId) {
    set((s) => ({ newConsents: s.newConsents.filter((c) => c.id !== localId) }));
  },

  setAutoPopulateToggle(questionId, enabled) {
    set((s) => {
      const next = new Map(s.autoPopulateToggles);
      next.set(questionId, enabled);
      return { autoPopulateToggles: next };
    });
  },

  setNote(note) {
    set({ note });
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
      set({ note: "" });
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
        autoPopulateToggles: mergeAutoPopulateToggles(s.autoPopulateToggles, latest.content.autoPopulateToggles),
      }));
      return;
    }

    set({ locked: false, lockedContribution: null });

    if (latest?.status === "rejected" && get().prefilledFromContributionId !== latest.id) {
      set((s) => ({
        prefilledFromContributionId: latest.id,
        translations: contentTranslationsToMap(latest.content.translations),
        newQuestions: latest.content.newQuestions,
        newConsents: latest.content.newConsents,
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
      note: "",
      validation: EMPTY_VALIDATION,
      loading: false,
      submitting: false,
      error: null,
      ownContributions: [],
      locked: false,
      lockedContribution: null,
      prefilledFromContributionId: null,
      projectLocked: false,
      autoPopulateToggles: new Map(),
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
