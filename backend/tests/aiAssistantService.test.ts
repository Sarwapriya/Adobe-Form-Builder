import { describe, it, expect, vi, beforeEach } from "vitest";
import { fakeDataSource } from "./helpers/fakeDataSource";

vi.mock("../src/config/data-source", () => ({ AppDataSource: fakeDataSource }));

vi.mock("../src/services/fabrixSettingsService", () => ({
  getFabrixSettings: vi.fn(async () => ({
    baseUrl: "https://fabrix.example.com",
    apiKey: "test-key",
    agentId: "agent-1",
    enabled: true,
    timeoutSeconds: 30,
    maxRetries: 2,
  })),
}));

const sendFabrixMessageMock = vi.fn();
vi.mock("../src/services/fabrixAIService", () => ({
  sendMessage: (...args: unknown[]) => sendFabrixMessageMock(...args),
}));

vi.mock("../src/services/aiCampaignTools", async () => {
  const actual = await vi.importActual<typeof import("../src/services/aiCampaignTools")>("../src/services/aiCampaignTools");
  return {
    ...actual,
    getCampaign: vi.fn(async () => null),
    getCallerFormDetail: vi.fn(async () => null),
    searchCampaigns: vi.fn(async () => []),
    buildCampaignReferences: vi.fn(async () => []),
  };
});

import { sendChatMessage } from "../src/services/aiAssistantService";
import type { AccessTokenPayload } from "../src/services/authService";

const auth: AccessTokenPayload = { sub: "user-1", username: "alice", role: "standard", subsidiaryId: "sub-1" };

describe("aiAssistantService.sendChatMessage — tool-dispatch logic", () => {
  beforeEach(() => {
    fakeDataSource.reset();
    sendFabrixMessageMock.mockReset();
  });

  it("returns a plain-text reply and never produces an action when the model doesn't call a tool", async () => {
    sendFabrixMessageMock.mockResolvedValueOnce({ ok: true, replyText: "Hello! How can I help?" });
    const response = await sendChatMessage(auth, { message: "hi there" });
    expect(response.message).toBe("Hello! How can I help?");
    expect(response.actions).toEqual([]);
    expect(sendFabrixMessageMock).toHaveBeenCalledTimes(1);
  });

  it("stages a pending AIAction for a mutating tool call instead of executing it", async () => {
    sendFabrixMessageMock.mockResolvedValueOnce({
      ok: true,
      replyText: '```json\n{"tool":"DELETE_QUESTION","args":{"questionId":"Q1"}}\n```',
    });
    const response = await sendChatMessage(auth, { message: "delete question 1" });
    expect(response.actions).toHaveLength(1);
    expect(response.actions[0].actionType).toBe("DELETE_QUESTION");
    expect(response.actions[0].requiresConfirmation).toBe(true);
    expect(response.actions[0].data).toEqual({ questionId: "Q1" });
    // A mutating tool call is only ever proposed, never round-tripped for a
    // second completion — the model's accompanying text (or a default) is
    // the whole reply.
    expect(sendFabrixMessageMock).toHaveBeenCalledTimes(1);
  });

  it("marks a non-destructive mutating tool call as not requiring extra confirmation", async () => {
    sendFabrixMessageMock.mockResolvedValueOnce({
      ok: true,
      replyText: '```json\n{"tool":"REORDER_QUESTIONS","args":{"orderedQuestionIds":["Q2","Q1"]}}\n```',
    });
    const response = await sendChatMessage(auth, { message: "swap the question order" });
    expect(response.actions[0].actionType).toBe("REORDER_QUESTIONS");
    expect(response.actions[0].requiresConfirmation).toBe(false);
  });

  it("round-trips a read-only tool call and returns the model's follow-up reply, not the tool call itself", async () => {
    sendFabrixMessageMock
      .mockResolvedValueOnce({
        ok: true,
        replyText: '```json\n{"tool":"SEARCH_CAMPAIGNS","args":{"searchText":"survey"}}\n```',
      })
      .mockResolvedValueOnce({ ok: true, replyText: "I found no matching campaigns." });

    const response = await sendChatMessage(auth, { message: "find survey campaigns" });

    expect(sendFabrixMessageMock).toHaveBeenCalledTimes(2);
    expect(response.message).toBe("I found no matching campaigns.");
    expect(response.actions).toEqual([]);
  });

  it("treats malformed tool-call JSON as plain text instead of throwing", async () => {
    sendFabrixMessageMock.mockResolvedValueOnce({
      ok: true,
      replyText: '```json\n{"tool": "DELETE_QUESTION", "args": {}}\n```', // missing required questionId
    });
    const response = await sendChatMessage(auth, { message: "delete something" });
    expect(response.actions).toEqual([]);
    expect(response.message).toContain("tool");
  });

  it("falls back gracefully instead of throwing when FabriXAI errors", async () => {
    sendFabrixMessageMock.mockResolvedValueOnce({ ok: false, error: "boom" });
    const response = await sendChatMessage(auth, { message: "hi" });
    expect(response.message).toMatch(/temporarily unavailable/i);
    expect(response.actions).toEqual([]);
  });

  it("persists the user message and the assistant's reply to the conversation", async () => {
    sendFabrixMessageMock.mockResolvedValueOnce({ ok: true, replyText: "Sure thing." });
    const response = await sendChatMessage(auth, { message: "hello" });

    const { AIConversationMessage } = await import("../src/entities/AIConversationMessage");
    const messages = await fakeDataSource.getRepository(AIConversationMessage).find({ where: { conversationId: response.conversationId } });
    expect(messages.map((m) => m.role).sort()).toEqual(["assistant", "user"]);
  });
});
