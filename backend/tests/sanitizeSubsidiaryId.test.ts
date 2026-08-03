import { describe, it, expect } from "vitest";
import { sanitizeSubsidiaryId } from "../src/utils/sanitizeSubsidiaryId";

describe("sanitizeSubsidiaryId", () => {
  it("passes through a normal subsidiary code unchanged", () => {
    expect(sanitizeSubsidiaryId("SGE")).toBe("SGE");
    expect(sanitizeSubsidiaryId("SE-IL_1")).toBe("SE-IL_1");
  });

  it("strips path-traversal and separator characters", () => {
    expect(sanitizeSubsidiaryId("../../etc")).toBe("etc");
    expect(sanitizeSubsidiaryId("a/b\\c")).toBe("abc");
  });

  it("throws when nothing safe remains", () => {
    expect(() => sanitizeSubsidiaryId("../..")).toThrow(/Invalid subsidiaryId/);
    expect(() => sanitizeSubsidiaryId("")).toThrow(/Invalid subsidiaryId/);
  });
});
