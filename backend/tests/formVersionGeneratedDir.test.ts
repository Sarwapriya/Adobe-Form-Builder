import { describe, it, expect } from "vitest";
import path from "node:path";
import { formVersionGeneratedDir } from "../src/services/fileService";

describe("formVersionGeneratedDir", () => {
  it("nests under a 'forms' segment, keyed by the form version's own id", () => {
    expect(formVersionGeneratedDir("SGE", "11111111-1111-1111-1111-111111111111")).toBe(
      path.join("SGE", "forms", "11111111-1111-1111-1111-111111111111", "generated"),
    );
  });

  it("sanitizes the subsidiaryId the same way uploadGeneratedDir does", () => {
    expect(formVersionGeneratedDir("../../etc", "v1")).toBe(path.join("etc", "forms", "v1", "generated"));
  });
});
