import { describe, it, expect } from "vitest";
import { aiToolCallSchema, aiChatRequestSchema } from "@formbuilder/shared";

describe("aiToolCallSchema", () => {
  it("accepts a valid SEARCH_CAMPAIGNS call", () => {
    const result = aiToolCallSchema.safeParse({ tool: "SEARCH_CAMPAIGNS", args: { searchText: "survey" } });
    expect(result.success).toBe(true);
  });

  it("accepts a valid DELETE_QUESTION call", () => {
    const result = aiToolCallSchema.safeParse({ tool: "DELETE_QUESTION", args: { questionId: "Q1" } });
    expect(result.success).toBe(true);
  });

  it("accepts a valid ADD_QUESTION call with a full QuestionDefinition", () => {
    const result = aiToolCallSchema.safeParse({
      tool: "ADD_QUESTION",
      args: {
        question: {
          id: "Q1",
          order: 1,
          controlType: "radio",
          headingByLocale: { en_GB: "How satisfied are you?" },
          subheadingByLocale: {},
          required: true,
          answers: [{ id: "A1", order: 1, textByLocale: { en_GB: "Very satisfied" } }],
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown tool name", () => {
    const result = aiToolCallSchema.safeParse({ tool: "DROP_TABLE", args: {} });
    expect(result.success).toBe(false);
  });

  it("rejects a call whose args don't match its own tool", () => {
    const result = aiToolCallSchema.safeParse({ tool: "GET_CAMPAIGN", args: { searchText: "oops" } });
    expect(result.success).toBe(false);
  });

  it("rejects a GET_CAMPAIGN call with a non-uuid formId", () => {
    const result = aiToolCallSchema.safeParse({ tool: "GET_CAMPAIGN", args: { formId: "not-a-uuid" } });
    expect(result.success).toBe(false);
  });

  it("rejects a tool call missing its args entirely", () => {
    const result = aiToolCallSchema.safeParse({ tool: "DELETE_QUESTION" });
    expect(result.success).toBe(false);
  });
});

describe("aiChatRequestSchema", () => {
  it("accepts a minimal valid request", () => {
    expect(aiChatRequestSchema.safeParse({ message: "hello" }).success).toBe(true);
  });

  it("rejects an empty message", () => {
    expect(aiChatRequestSchema.safeParse({ message: "" }).success).toBe(false);
  });

  it("rejects a message over the 4000-char cap", () => {
    expect(aiChatRequestSchema.safeParse({ message: "a".repeat(4001) }).success).toBe(false);
  });

  it("rejects a non-uuid conversationId", () => {
    expect(aiChatRequestSchema.safeParse({ message: "hi", conversationId: "not-a-uuid" }).success).toBe(false);
  });
});
