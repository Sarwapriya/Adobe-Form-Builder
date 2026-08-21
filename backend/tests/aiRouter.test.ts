import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { fakeDataSource } from "./helpers/fakeDataSource";

vi.mock("../src/config/data-source", () => ({ AppDataSource: fakeDataSource }));

// Bypasses real JWT verification — the test drives req.auth directly via an
// `x-test-auth` header carrying the JSON-encoded AccessTokenPayload, so each
// test can exercise a different role/subsidiary/ownership combination
// without needing a real signed token.
vi.mock("../src/middleware/authJwt", () => ({
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const header = req.headers["x-test-auth"];
    (req as unknown as { auth?: unknown }).auth = typeof header === "string" ? JSON.parse(header) : undefined;
    next();
  },
  requireAdmin: [(req: express.Request, _res: express.Response, next: express.NextFunction) => next()],
  optionalAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

vi.mock("../src/services/fabrixSettingsService", () => ({
  getFabrixSettings: vi.fn(async () => ({
    baseUrl: "https://fabrix.example.com",
    modelIds: ["model-1"],
    clientHeader: "test-client-header",
    openApiToken: "test-openapi-token",
    userEmail: "",
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
  };
});

const createFormMock = vi.fn(async (input: { name: string; subsidiaryId: string; projectCode?: string | null; userId: string; origin?: string }) => ({
  id: "new-form-1",
  name: input.name,
  subsidiaryId: input.subsidiaryId,
  projectCode: input.projectCode ?? null,
  status: "draft" as const,
  createdByUserId: input.userId,
  createdAt: new Date(),
  updatedAt: new Date(),
  publishedVersionNumber: null,
  origin: (input.origin ?? "admin") as "admin" | "adhoc",
  pendingReview: false,
  submittedForReviewAt: null,
  reviewedAt: null,
  reviewNote: null,
}));
const getFormDetailMock = vi.fn(async () => ({
  id: "src-form-1",
  name: "Source campaign",
  subsidiaryId: "SUB_A",
  projectCode: null,
  status: "published" as const,
  createdByUserId: "u",
  createdAt: new Date(),
  updatedAt: new Date(),
  publishedVersionNumber: 1,
  origin: "admin" as const,
  pendingReview: false,
  submittedForReviewAt: null,
  reviewedAt: null,
  reviewNote: null,
  draft: null,
  published: {
    id: "v1",
    versionNumber: 1,
    definition: {
      meta: { subsidiary: "SUB_A", sourceFileName: "", defaultLocale: "en_GB" },
      locales: [],
      questions: [],
      fields: { submitButton: { labelByLocale: { en_GB: "Submit" } } },
      validationMessages: {},
      pageError: {},
      thankYou: {},
    },
    config: { variants: ["ff"] },
  },
}));
vi.mock("../src/services/formBuilderService", () => ({
  createForm: (...args: unknown[]) => createFormMock(...(args as [never])),
  getFormDetail: (...args: unknown[]) => getFormDetailMock(...(args as [never])),
}));

const { aiRouter } = await import("../src/routes/ai.router");
const { AIConversation } = await import("../src/entities/AIConversation");
const { AIAction } = await import("../src/entities/AIAction");
const { errorHandler } = await import("../src/middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/v1/ai", aiRouter);
app.use(errorHandler);

let server: Server;
let baseUrl: string;

function authHeader(payload: { sub: string; username: string; role: "admin" | "standard" | "superadmin"; subsidiaryId: string | null }): Record<string, string> {
  return { "x-test-auth": JSON.stringify(payload) };
}

beforeAll(() => {
  server = app.listen(0);
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(() => {
  server.close();
});

const standardUser = { sub: "user-1", username: "alice", role: "standard" as const, subsidiaryId: "SUB_A" };
const adminUser = { sub: "admin-1", username: "root", role: "admin" as const, subsidiaryId: null };

describe("POST /api/v1/ai/chat", () => {
  beforeEach(() => {
    fakeDataSource.reset();
    sendFabrixMessageMock.mockReset();
  });

  it("happy path: returns a reply with the FabriXAI call mocked", async () => {
    sendFabrixMessageMock.mockResolvedValueOnce({ ok: true, replyText: "Hi! What campaign are you working on?" });

    const res = await fetch(`${baseUrl}/api/v1/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader(standardUser) },
      body: JSON.stringify({ message: "hello" }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { message: string; conversationId: string; actions: unknown[] };
    expect(body.message).toBe("Hi! What campaign are you working on?");
    expect(body.conversationId).toBeTruthy();
    expect(body.actions).toEqual([]);
  });

  it("rejects an empty message with 400", async () => {
    const res = await fetch(`${baseUrl}/api/v1/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader(standardUser) },
      body: JSON.stringify({ message: "" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/ai/actions/:id/confirm", () => {
  beforeEach(() => {
    fakeDataSource.reset();
    createFormMock.mockClear();
    getFormDetailMock.mockClear();
  });

  async function seedConversationAndAction(overrides: { ownerId: string; actionType: string; requestJson: unknown; formId?: string | null }) {
    const conversationRepo = fakeDataSource.getRepository(AIConversation);
    const conversation = await conversationRepo.save(
      conversationRepo.create({ userId: overrides.ownerId, formId: null, title: "test", status: "active" }),
    );
    const actionRepo = fakeDataSource.getRepository(AIAction);
    const action = await actionRepo.save(
      actionRepo.create({
        conversationId: conversation.id,
        formId: overrides.formId ?? null,
        userId: overrides.ownerId,
        actionType: overrides.actionType,
        requestJson: JSON.stringify(overrides.requestJson),
        responseJson: null,
        confirmed: false,
        executed: false,
        executionResult: null,
      }),
    );
    return { conversation, action };
  }

  it("client-applied type: flips confirmed/executed and echoes the proposed data back, without touching Forms", async () => {
    const question = {
      id: "Q1",
      order: 1,
      controlType: "radio",
      headingByLocale: { en_GB: "How satisfied are you?" },
      subheadingByLocale: {},
      required: true,
      answers: [{ id: "A1", order: 1, textByLocale: { en_GB: "Very satisfied" } }],
    };
    const { action } = await seedConversationAndAction({ ownerId: standardUser.sub, actionType: "ADD_QUESTION", requestJson: { question } });

    const res = await fetch(`${baseUrl}/api/v1/ai/actions/${action.id}/confirm`, {
      method: "POST",
      headers: authHeader(standardUser),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { executed: boolean; actionType: string; data: unknown; formId?: string };
    expect(body.executed).toBe(true);
    expect(body.actionType).toBe("ADD_QUESTION");
    expect(body.data).toEqual({ question });
    expect(body.formId).toBeUndefined();
    expect(createFormMock).not.toHaveBeenCalled();
  });

  it("server-executed type (CLONE_CAMPAIGN): calls createForm and returns the new formId", async () => {
    const sourceFormId = "11111111-1111-4111-8111-111111111111";
    const args = { sourceFormId, name: "Cloned campaign", subsidiaryId: "SUB_A" };
    const { action } = await seedConversationAndAction({ ownerId: adminUser.sub, actionType: "CLONE_CAMPAIGN", requestJson: args });

    const res = await fetch(`${baseUrl}/api/v1/ai/actions/${action.id}/confirm`, {
      method: "POST",
      headers: authHeader(adminUser),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { executed: boolean; formId?: string };
    expect(body.executed).toBe(true);
    expect(body.formId).toBe("new-form-1");
    expect(createFormMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Cloned campaign", subsidiaryId: "SUB_A", copyFromFormId: sourceFormId }),
    );
  });

  it("404s for an action that doesn't exist", async () => {
    const res = await fetch(`${baseUrl}/api/v1/ai/actions/does-not-exist/confirm`, {
      method: "POST",
      headers: authHeader(standardUser),
    });
    expect(res.status).toBe(404);
  });

  it("404s (not 200) when a different, non-admin user tries to confirm someone else's action", async () => {
    const { action } = await seedConversationAndAction({
      ownerId: "owner-x",
      actionType: "DELETE_QUESTION",
      requestJson: { questionId: "Q1" },
    });

    const res = await fetch(`${baseUrl}/api/v1/ai/actions/${action.id}/confirm`, {
      method: "POST",
      headers: authHeader({ sub: "intruder-1", username: "eve", role: "standard", subsidiaryId: "SUB_B" }),
    });

    expect(res.status).toBe(404);
  });
});
