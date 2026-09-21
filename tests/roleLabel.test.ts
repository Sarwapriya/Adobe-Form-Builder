import { describe, expect, it } from "vitest";
import { roleLabel } from "../src/auth/roleLabel";

describe("roleLabel", () => {
  it("shows the stored \"standard\" role as Subsidiary", () => {
    expect(roleLabel("standard")).toBe("Subsidiary");
  });

  it("capitalizes the admin roles and tolerates missing or unknown roles", () => {
    expect(roleLabel("admin")).toBe("Admin");
    expect(roleLabel("superadmin")).toBe("Superadmin");
    expect(roleLabel(undefined)).toBe("");
    expect(roleLabel("auditor")).toBe("auditor");
  });
});
