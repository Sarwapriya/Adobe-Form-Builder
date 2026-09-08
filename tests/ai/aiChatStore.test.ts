import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIActionSummary, AIChatResponse, AIConfirmActionResponse } from "@formbuilder/shared";
import { sampleFormDefinition } from "../codegen/fixtures.ts";

// aiChatStore.ts imports `* as aiChatApi from "../api/aiChatApi"` and calls its
// named exports directly (aiChatApi.sendChatMessage(...), etc.) — mocking the
// whole module lets each test control exactly what the "server" returns
// without a real apiClient/fetch round-trip.
const sendChatMessageMock = vi.fn();
const confirmActionMock = vi.fn();
const rejectActionMock = vi.fn();

vi.mock("../../src/api/aiChatApi.ts", () => ({
  sendChatMessage: (...args: unknown[]) => sendChatMessageMock(...args),
  confirmAction: (...args: unknown[]) => confirmActionMock(...args),
  rejectAction: (...args: unknown[]) => rejectActionMock(...args),
  listConversations: vi.fn(),
  getConversation: vi.fn(),
  searchCampaigns: vi.fn(),
  getCampaign: vi.fn(),
}));

const { useAiChatStore } = await import("../../src/store/aiChatStore.ts");
const { useFormBuilderStore } = await import("../../src/store/formBuilderStore.ts");

describe("aiChatStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAiChatStore.setState({
      formId: null,
      conversationId: null,
      messages: [],
      pendingActions: [],
      loading: false,
      error: null,
    });
    useFormBuilderStore.getState().reset();
  });

  it("sendMessage pushes the user turn, calls the API, and appends the assistant reply + any actions", async () => {
    const response: AIChatResponse = {
      conversationId: "conv-1",
      message: "Sure, here is a suggestion.",
      actions: [
        {
          id: "action-1",
          actionType: "ADD_QUESTION",
          requiresConfirmation: false,
          data: { question: sampleFormDefinition().questions[0] },
        },
      ],
      references: [],
    };
    sendChatMessageMock.mockResolvedValue(response);

    await useAiChatStore.getState().sendMessage("Suggest a question");

    expect(sendChatMessageMock).toHaveBeenCalledWith({
      conversationId: undefined,
      formId: undefined,
      message: "Suggest a question",
    });

    const state = useAiChatStore.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.messages[0]).toMatchObject({ role: "user", text: "Suggest a question" });
    expect(state.messages[1]).toMatchObject({ role: "assistant", text: response.message });
    expect(state.conversationId).toBe("conv-1");
    expect(state.pendingActions).toHaveLength(1);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("sendMessage surfaces a failure as `error` instead of throwing", async () => {
    sendChatMessageMock.mockRejectedValue(new Error("network down"));

    await useAiChatStore.getState().sendMessage("hello");

    const state = useAiChatStore.getState();
    expect(state.error).toBe("network down");
    expect(state.loading).toBe(false);
    // The optimistic user message still stays in the list even though the
    // reply never arrived.
    expect(state.messages).toHaveLength(1);
  });

  it("confirmAction applies a client-applied action's payload via formBuilderStore.updateDefinition", async () => {
    const form = sampleFormDefinition();
    useFormBuilderStore.setState({ formId: "form-1", definition: form });

    const newQuestion = {
      id: "Q-ai",
      order: 99,
      controlType: "shortText" as const,
      headingByLocale: { en_GB: "New AI question" },
      subheadingByLocale: {},
      required: true,
      answers: [],
    };
    const pendingAction: AIActionSummary = {
      id: "action-2",
      actionType: "ADD_QUESTION",
      requiresConfirmation: false,
      data: { question: newQuestion },
    };
    useAiChatStore.setState({ pendingActions: [pendingAction] });

    const confirmResponse: AIConfirmActionResponse = {
      actionId: "action-2",
      actionType: "ADD_QUESTION",
      executed: true,
      data: { question: newQuestion },
    };
    confirmActionMock.mockResolvedValue(confirmResponse);

    const result = await useAiChatStore.getState().confirmAction("action-2");

    expect(confirmActionMock).toHaveBeenCalledWith("action-2");
    expect(result).toEqual(confirmResponse);
    expect(useAiChatStore.getState().pendingActions).toHaveLength(0);

    const questions = useFormBuilderStore.getState().definition?.questions ?? [];
    expect(questions.some((q) => q.headingByLocale.en_GB === "New AI question")).toBe(true);
    // updateDefinition also re-runs validation and marks the draft dirty,
    // exactly as a manual edit through QuestionEditorPanel would.
    expect(useFormBuilderStore.getState().dirty).toBe(true);
  });

  it("confirmAction for a server-executed type never touches formBuilderStore, and hands the response back for the caller to navigate with", async () => {
    const form = sampleFormDefinition();
    useFormBuilderStore.setState({ definition: form });
    const originalQuestionCount = form.questions.length;

    const pendingAction: AIActionSummary = {
      id: "action-3",
      actionType: "CREATE_CAMPAIGN",
      requiresConfirmation: false,
      data: { name: "New Campaign", subsidiaryId: "sub-1" },
    };
    useAiChatStore.setState({ pendingActions: [pendingAction] });

    const confirmResponse: AIConfirmActionResponse = {
      actionId: "action-3",
      actionType: "CREATE_CAMPAIGN",
      executed: true,
      formId: "new-form-id",
    };
    confirmActionMock.mockResolvedValue(confirmResponse);

    const result = await useAiChatStore.getState().confirmAction("action-3");

    expect(result).toEqual(confirmResponse);
    expect(result?.formId).toBe("new-form-id");
    // No client-side mutation happened — CREATE_CAMPAIGN/CLONE_CAMPAIGN are
    // executed entirely server-side (see isServerExecutedAiTool).
    expect(useFormBuilderStore.getState().definition?.questions).toHaveLength(originalQuestionCount);
    expect(useFormBuilderStore.getState().dirty).toBe(false);
    expect(useAiChatStore.getState().pendingActions).toHaveLength(0);
  });

  it("rejectAction removes the pending action locally and calls the API", async () => {
    const pendingAction: AIActionSummary = {
      id: "action-4",
      actionType: "DELETE_QUESTION",
      requiresConfirmation: true,
      data: { questionId: "Q1" },
    };
    useAiChatStore.setState({ pendingActions: [pendingAction] });
    rejectActionMock.mockResolvedValue(undefined);

    await useAiChatStore.getState().rejectAction("action-4");

    expect(rejectActionMock).toHaveBeenCalledWith("action-4");
    expect(useAiChatStore.getState().pendingActions).toHaveLength(0);
  });

  it("setFormId resets the conversation only when the form actually changes", () => {
    useAiChatStore.setState({
      formId: "form-1",
      conversationId: "conv-1",
      messages: [{ id: "m1", role: "user", text: "hi" }],
      pendingActions: [{ id: "a1", actionType: "ADD_QUESTION", requiresConfirmation: false, data: {} }],
    });

    useAiChatStore.getState().setFormId("form-1");
    expect(useAiChatStore.getState().conversationId).toBe("conv-1");
    expect(useAiChatStore.getState().messages).toHaveLength(1);

    useAiChatStore.getState().setFormId("form-2");
    expect(useAiChatStore.getState().conversationId).toBeNull();
    expect(useAiChatStore.getState().messages).toHaveLength(0);
    expect(useAiChatStore.getState().pendingActions).toHaveLength(0);
    expect(useAiChatStore.getState().formId).toBe("form-2");
  });
});
