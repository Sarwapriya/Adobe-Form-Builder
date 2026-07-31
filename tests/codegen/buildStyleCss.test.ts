// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildStyleCss } from "../../src/codegen/css/buildStyleCss.ts";
import { resolveFileNames } from "../../src/codegen/fileNames.ts";
import { defaultBuilderConfig } from "../../src/codegen/types.ts";
import { sampleFormDefinition } from "./fixtures.ts";

function buildFile() {
  const form = sampleFormDefinition();
  const config = defaultBuilderConfig();
  return buildStyleCss(resolveFileNames(form, config));
}

describe("buildStyleCss", () => {
  it("produces a stylesheet with the reference's core class names intact", () => {
    const file = buildFile();
    expect(file.path).toBe("TEST-EN.css");
    for (const cls of [
      ".form_top_group",
      ".form_text_bx",
      ".form_check_group",
      ".form_check_module",
      ".radio_group",
      ".radio_wrap",
      ".form_check_list_wrap",
      ".form_check_list",
      ".star",
      ".form_bottom_group",
      ".form_bottom_bar",
      "#overlay",
      ".loader",
      ".popup",
      ".popup--alert",
      ".cta",
    ]) {
      expect(file.contents).toContain(cls);
    }
  });

  it("contains no dangling asset references (AEM absolute paths or bare png files)", () => {
    const file = buildFile();
    expect(file.contents).not.toContain("etc.clientlibs");
    expect(file.contents).not.toContain("cancel.png");
    expect(file.contents).not.toContain("checked.png");
  });

  it("adds real RTL support the reference never had", () => {
    const file = buildFile();
    expect(file.contents).toContain('[dir="rtl"]');
  });

  it("has balanced braces (a sanity check that the copy + patch didn't corrupt the file)", () => {
    const file = buildFile();
    const opens = (file.contents.match(/{/g) || []).length;
    const closes = (file.contents.match(/}/g) || []).length;
    expect(opens).toBe(closes);
    expect(opens).toBeGreaterThan(100);
  });
});
