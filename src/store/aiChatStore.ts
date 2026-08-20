import { create } from "zustand";
import {
  isServerExecutedAiTool,
  type AICampaignReference,
  type AIActionSummary,
  type AIConfirmActionResponse,
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
  open: localStorage.getItem(OPEN_STORAGE_KEY) !== "true",
  formId: null,
  conversationId: null,
  messages: [],
  pendingActions: [],
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
    set({ formId, conversationId: null, messages: [], pendingActions: [], error: null });
  },

  async sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const { formId, conversationId } = get();
    const userMessage: AiChatMessage = { id: crypto.randomUUID(), role: "user", text: trimmed };
    set((s) => ({ messages: [...s.messages, userMessage], loading: true, error: null }));

    try {
      const response = await aiChatApi.sendChatMessage({
        conversationId: conversationId ?? undefined,
        formId: formId ?? undefined,
        message: trimmed,
      });
      const assistantMessage: AiChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: response.message,
        references: response.references.length > 0 ? response.references : undefined,
      };
      set((s) => ({
        conversationId: response.conversationId,
        messages: [...s.messages, assistantMessage],
        pendingActions: [...s.pendingActions, ...response.actions],
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
}));
