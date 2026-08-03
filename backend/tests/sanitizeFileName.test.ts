import { describe, it, expect } from "vitest";
import { sanitizeFileName } from "../src/utils/sanitizeFileName";

describe("sanitizeFileName", () => {
  it("keeps a normal name unchanged", () => {
    expect(sanitizeFileName("translations.xlsx")).toBe("translations.xlsx");
  });

  it("strips path traversal and directory components", () => {
    expect(sanitizeFileName("../../etc/passwd.xlsx")).toBe("passwd.xlsx");
  });

  it("replaces unsafe characters in the stem but preserves the extension", () => {
    expect(sanitizeFileName("my file (v2)!.xlsx")).toBe("my_file__v2__.xlsx");
  });

  it("replaces every unsafe character in a stem made entirely of them", () => {
    expect(sanitizeFileName("***.xlsx")).toBe("___.xlsx");
  });

  it("falls back to a placeholder stem when the stem is empty", () => {
    expect(sanitizeFileName("")).toBe("file");
  });
});
