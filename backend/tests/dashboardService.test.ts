import { describe, it, expect } from "vitest";
import { bucketForm, subsidiaryBucket, type BucketableForm } from "../src/services/dashboardService";

/**
 * Unit tests for the pure status-bucketing rules dashboardService.ts's own
 * doc comment describes — Form.status and FormContribution.status are two
 * independent lifecycles that can coexist, so these functions are what keep
 * every dashboard stat card and its donut chart summing to the same total.
 * No database involved (see dashboardService.ts's own doc comment for why
 * these two functions are exported as plain, pure helpers).
 */

function form(overrides: Partial<BucketableForm> = {}): BucketableForm {
  return { id: "f1", origin: "admin", pendingReview: false, status: "draft", subsidiaryId: "SUB_A", ...overrides };
}

describe("bucketForm (admin dashboard)", () => {
  it("puts a pending ad-hoc review ahead of everything else", () => {
    const f = form({ origin: "adhoc", pendingReview: true, status: "published" });
    expect(bucketForm(f, new Set(), new Set())).toBe("pendingReview");
  });

  it("puts a form with a pending contribution ahead of an approved one", () => {
    const f = form({ status: "published" });
    expect(bucketForm(f, new Set([f.id]), new Set([f.id]))).toBe("pendingReview");
  });

  it("puts an approved-but-unpublished contribution ahead of the form's own published status", () => {
    const f = form({ status: "published" });
    expect(bucketForm(f, new Set(), new Set([f.id]))).toBe("approved");
  });

  it("falls back to the form's own published status with no contribution signals", () => {
    const f = form({ status: "published" });
    expect(bucketForm(f, new Set(), new Set())).toBe("published");
  });

  it("buckets a plain draft with nothing else going on as draft", () => {
    const f = form({ status: "draft" });
    expect(bucketForm(f, new Set(), new Set())).toBe("draft");
  });

  it("folds an unpublished form into draft (no separate bucket)", () => {
    const f = form({ status: "unpublished" });
    expect(bucketForm(f, new Set(), new Set())).toBe("draft");
  });
});

describe("subsidiaryBucket (subsidiary dashboard — ad-hoc forms only)", () => {
  it("is pendingReview whenever pendingReview is true, regardless of status/reviewNote", () => {
    expect(subsidiaryBucket({ pendingReview: true, status: "draft", reviewNote: null })).toBe("pendingReview");
    expect(subsidiaryBucket({ pendingReview: true, status: "published", reviewNote: null })).toBe("pendingReview");
  });

  it("is published once the form has actually gone live", () => {
    expect(subsidiaryBucket({ pendingReview: false, status: "published", reviewNote: null })).toBe("published");
  });

  it("is changesRequested for a rejected form still sitting in draft with unaddressed feedback", () => {
    expect(subsidiaryBucket({ pendingReview: false, status: "draft", reviewNote: "Fix the Arabic translation" })).toBe("changesRequested");
  });

  it("is plain draft once reviewNote has been cleared (e.g. after resubmission)", () => {
    expect(subsidiaryBucket({ pendingReview: false, status: "draft", reviewNote: null })).toBe("draft");
  });
});
