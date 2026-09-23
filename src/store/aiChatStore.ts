import { create } from "zustand";
import {
  isServerExecutedAiTool,
  type AICampaignReference,
  type AIActionSummary,
  type AIConfirmActionResponse,
  type AIFormProposal,
  type AIToolName,
  type AddQuestionArgs,
  type UpdateQuestionArgs,
  type DeleteQuestionArgs,
  type ReorderQuestionsArgs,
} from "@formbuilder/shared";
import * as aiChatApi from "../api/aiChatApi";
import { useFormBuilderStore } from "./formBuilderStore";
import { renumberQuestions } from "../components/formBuilder/formBuilderHelpers";

/** Mirrors AppLayout.tsx's sidebarCollapsed convention exactly: the
 * localStorage value records whether the panel is *collapsed* (a plain
 * "true"/"false" string), while the store itself exposes the more natural
 * `open` boolean — so the persisted key name and the in-memory field name
 * intentionally read as opposites of each other, same as the sidebar. */
const OPEN_STORAGE_KEY = "aiChatCollapsed";

/** `crypto.randomUUID()` only exists in a "secure context" (HTTPS or
 * localhost) — on a plain-HTTP deployment it's `undefined`, so calling it
 * throws `TypeError: crypto.randomUUID is not a function` and aborts
 * `sendMessage` before any request goes out. `crypto.getRandomValues` has no
 * such restriction, so it's used here to build a v4 UUID by hand instead;
 * these ids are only ever used as client-local React list keys, never sent
 * to the backend or relied on for anything security-sensitive. */
function generateMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Client-local chat turn shape for rendering — deliberately simpler than the
 * backend's AIConversationMessageView (no need to mirror role: "system"|"tool"
 * turns, which the UI never renders directly). `references` is populated on
 * an assistant turn when the reply carried AICampaignReference search hits,
 * for AIChatPanel to render as CampaignReferenceCards under that message. */
export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  references?: AICampaignReference[];
}

interface AiChatState {
  open: boolean;
  formId: string | null;
  conversationId: string | null;
  messages: AiChatMessage[];
  pendingActions: AIActionSummary[];
  /** The latest validated new-form proposal of this conversation (each change
   * the user asks for replaces it with a new version). Saved only through
   * approveAndSaveProposal — the user's explicit "Approve & Save" click. */
  proposal: AIFormProposal | null;
  /** True while an Approve & Save request is in flight. */
  savingProposal: boolean;
  loading: boolean;
  error: string | null;

  toggleOpen: () => void;
  /** Resets the conversation whenever the open editor's form actually changes
   * (not on every call — re-setting the same id is a no-op) so switching
   * between two forms' editors doesn't carry over the previous form's chat
   * history or pending actions. */
  setFormId: (formId: string | null) => void;
  sendMessage: (text: string) => Promise<void>;
  /**
   * Confirms a pending action via the backend, then — for a client-applied
   * tool type — applies its payload to the open form through
   * useFormBuilderStore.getState().updateDefinition, the exact same store
   * action every manual edit already goes through. For a server-executed
   * type (CREATE_CAMPAIGN/CLONE_CAMPAIGN) nothing is applied locally; the
   * caller reads `formId` off the returned response to navigate. Returns
   * null if the confirm request itself failed.
   */
  confirmAction: (actionId: string) => Promise<AIConfirmActionResponse | null>;
  rejectAction: (actionId: string) => Promise<void>;
  /** Approves exactly the shown proposal version (one-time token from the
   * backend) and saves it as a new draft form. Returns the new draft's editor
   * route, or null if the backend refused (e.g. a newer version exists). */
  approveAndSaveProposal: (proposalId: string) => Promise<{ formId: string; route: string } | null>;
  /** Clears every per-user field (conversation/messages/pending actions/
   * error) — called from authStore on logout and after a successful login,
   * so a chat transcript can never survive a user switch in the same browser
   * tab. Deliberately leaves `open` untouched, since that's a UI preference,
   * not user-specific data. */
  reset: () => void;
}

/** The one integration point between aiChatStore and formBuilderStore —
 * applies a confirmed, client-applied action's payload using the exact same
 * question-array manipulations BuilderCanvas.tsx's handleAddQuestion/
 * handleDeleteQuestion and QuestionEditorPanel.tsx's patchQuestion already
 * use, so an AI-proposed edit is indistinguishable from a manual one to the
 * rest of the app. Nothing here persists anything — the user's own existing
 * "Save Draft"/"Publish" click still does that, exactly as with any other
 * edit. */
function applyClientAction(actionType: AIToolName, data: unknown): void {
  const { updateDefinition } = useFormBuilderStore.getState();

  switch (actionType) {
    case "ADD_QUESTION": {
      const { question } = data as AddQuestionArgs;
      updateDefinition((d) => ({ ...d, questions: renumberQuestions([...d.questions, question]) }));
      break;
    }
    case "UPDATE_QUESTION": {
      const { questionId, patch } = data as UpdateQuestionArgs;
      updateDefinition((d) => ({
        ...d,
        questions: d.questions.map((q) => (q.id === questionId ? { ...q, ...patch } : q)),
      }));
      break;
    }
    case "DELETE_QUESTION": {
      const { questionId } = data as DeleteQuestionArgs;
      updateDefinition((d) => ({
        ...d,
        questions: renumberQuestions(d.questions.filter((q) => q.id !== questionId)),
      }));
      break;
    }
    case "REORDER_QUESTIONS": {
      const { orderedQuestionIds } = data as ReorderQuestionsArgs;
      updateDefinition((d) => {
        const byId = new Map(d.questions.map((q) => [q.id, q]));
        const reordered = orderedQuestionIds
          .map((id) => byId.get(id))
          .filter((q): q is (typeof d.questions)[number] => q !== undefined);
        const remaining = d.questions.filter((q) => !orderedQuestionIds.includes(q.id));
        return { ...d, questions: renumberQuestions([...reordered, ...remaining]) };
      });
      break;
    }
    default:
      // SUGGEST_QUESTIONS/TRANSLATE_QUESTIONS materialize as individual
      // per-question ADD_QUESTION/UPDATE_QUESTION pending actions (see
      // QuestionSuggestionCard.tsx's own doc comment) — nothing else should
      // ever reach here as a client-applied type. CREATE_CAMPAIGN/
      // CLONE_CAMPAIGN are server-executed and filtered out before this
      // function is called at all.
      console.warn(`aiChatStore: no client-applied transform for action type "${actionType}"`);
  }
}

export const useAiChatStore = create<AiChatState>((set, get) => ({
  // Defaults to minimized (unset localStorage → false) so a first-time visit
  // shows the pulsing AIChatButton bubble rather than the panel already
  // taking up screen space — only an explicit prior "left it open" ("false"
  // in the collapsed key) reopens it automatically.
  open: localStorage.getItem(OPEN_STORAGE_KEY) === "false",
  formId: null,
  conversationId: null,
  messages: [],
  pendingActions: [],
  proposal: null,
  savingProposal: false,
  loading: false,
  error: null,

  toggleOpen() {
    set((s) => {
      const next = !s.open;
      localStorage.setItem(OPEN_STORAGE_KEY, String(!next));
      return { open: next };
    });
  },

  setFormId(formId) {
    if (get().formId === formId) return;
    set({ formId, conversationId: null, messages: [], pendingActions: [], proposal: null, error: null });
  },

  async sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const { formId, conversationId } = get();
    const userMessage: AiChatMessage = { id: generateMessageId(), role: "user", text: trimmed };
    set((s) => ({ messages: [...s.messages, userMessage], loading: true, error: null }));

    try {
      const response = await aiChatApi.sendChatMessage({
        conversationId: conversationId ?? undefined,
        formId: formId ?? undefined,
        message: trimmed,
      });
      const assistantMessage: AiChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        text: response.message,
        references: response.references.length > 0 ? response.references : undefined,
      };
      set((s) => ({
        conversationId: response.conversationId,
        messages: [...s.messages, assistantMessage],
        pendingActions: [...s.pendingActions, ...response.actions],
        // A new version replaces the previous one — only the latest can be approved.
        proposal: response.proposal ?? s.proposal,
        loading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to send message", loading: false });
    }
  },

  async confirmAction(actionId) {
    const action = get().pendingActions.find((a) => a.id === actionId);
    set({ error: null });
    try {
      const response = await aiChatApi.confirmAction(actionId);
      set((s) => ({ pendingActions: s.pendingActions.filter((a) => a.id !== actionId) }));
      if (action && !isServerExecutedAiTool(action.actionType)) {
        applyClientAction(action.actionType, response.data);
      }
      return response;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to confirm action" });
      return null;
    }
  },

  async rejectAction(actionId) {
    set((s) => ({ pendingActions: s.pendingActions.filter((a) => a.id !== actionId) }));
    try {
      await aiChatApi.rejectAction(actionId);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to reject action" });
    }
  },

  async approveAndSaveProposal(proposalId) {
    set({ error: null, savingProposal: true });
    try {
      // Two explicit steps on one click: the backend binds the token to this
      // exact proposal version, and refuses the save if anything changed.
      const { approvalToken } = await aiChatApi.approveProposal(proposalId);
      const saved = await aiChatApi.saveProposal(proposalId, approvalToken);
      set((s) => ({
        savingProposal: false,
        proposal: s.proposal && s.proposal.id === proposalId ? { ...s.proposal, saved: true, savedFormId: saved.formId } : s.proposal,
      }));
      return { formId: saved.formId, route: saved.route };
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to save the proposal", savingProposal: false });
      return null;
    }
  },

  reset() {
    set({ formId: null, conversationId: null, messages: [], pendingActions: [], proposal: null, savingProposal: false, loading: false, error: null });
  },
}));
