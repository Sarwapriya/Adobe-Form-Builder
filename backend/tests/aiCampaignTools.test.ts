import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tenant-scoping test for aiCampaignTools.searchCampaigns — the AI
 * assistant's SEARCH_CAMPAIGNS tool must apply the exact same subsidiary
 * scoping a human hitting GET /api/v1/admin/forms (admin) vs.
 * GET /api/v1/forms (subsidiary-scoped standard user) already gets, since
 * this tool is reachable both through chat and directly via
 * GET /api/v1/ai/campaigns/search. formBuilderService/formAccessService are
 * mocked so this exercises only aiCampaignTools' own role-branching logic,
 * not a real database.
 */

const listFormsMock = vi.fn(async () => ({
  items: [
    {
      id: "f1",
      name: "Admin-visible form",
      subsidiaryId: "SUB_A",
      projectCode: null,
      status: "draft" as const,
      createdByUserId: "u",
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedVersionNumber: null,
      origin: "admin" as const,
      pendingReview: false,
      submittedForReviewAt: null,
      reviewedAt: null,
      reviewNote: null,
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
}));

vi.mock("../src/services/formBuilderService", () => ({
  listForms: (...args: unknown[]) => listFormsMock(...args),
  getFormDetail: vi.fn(async () => null),
}));

const listAccessibleFormsMock = vi.fn(async (subsidiaryId: string) => [
  {
    id: "f2",
    name: "Subsidiary-visible form",
    subsidiaryId,
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
  },
]);

vi.mock("../src/services/formAccessService", () => ({
  listAccessibleForms: (...args: unknown[]) => listAccessibleFormsMock(...(args as [string])),
  getAccessibleFormDetail: vi.fn(async () => null),
}));

import { searchCampaigns } from "../src/services/aiCampaignTools";

describe("aiCampaignTools.searchCampaigns tenant scoping", () => {
  beforeEach(() => {
    listFormsMock.mockClear();
    listAccessibleFormsMock.mockClear();
  });

  it("lets an admin search across every subsidiary via listForms, not listAccessibleForms", async () => {
    const results = await searchCampaigns({ userId: "admin-1", role: "admin", subsidiaryId: null }, {});
    expect(results.map((r) => r.formId)).toEqual(["f1"]);
    expect(listFormsMock).toHaveBeenCalled();
    expect(listAccessibleFormsMock).not.toHaveBeenCalled();
  });

  it("scopes a standard subsidiary user to only their own subsidiary's forms via listAccessibleForms", async () => {
    const results = await searchCampaigns({ userId: "user-1", role: "standard", subsidiaryId: "SUB_B" }, {});
    expect(results.map((r) => r.formId)).toEqual(["f2"]);
    expect(listAccessibleFormsMock).toHaveBeenCalledWith("SUB_B", "user-1");
    expect(listFormsMock).not.toHaveBeenCalled();
  });

  it("never falls back to the admin listing for a standard user with no subsidiary assigned", async () => {
    const results = await searchCampaigns({ userId: "user-2", role: "standard", subsidiaryId: null }, {});
    expect(results).toEqual([]);
    expect(listFormsMock).not.toHaveBeenCalled();
    expect(listAccessibleFormsMock).not.toHaveBeenCalled();
  });

  it("a superadmin gets the same admin-wide access as admin", async () => {
    await searchCampaigns({ userId: "super-1", role: "superadmin", subsidiaryId: null }, {});
    expect(listFormsMock).toHaveBeenCalled();
  });
});
