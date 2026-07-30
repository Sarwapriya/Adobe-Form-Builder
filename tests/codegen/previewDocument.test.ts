// @vitest-environment node
import { describe, expect, it } from "vitest";
import { generateSolution } from "../../src/codegen/generate.ts";
import { buildPreviewDocument } from "../../src/codegen/previewDocument.ts";
import { defaultBuilderConfig } from "../../src/codegen/types.ts";
import { sampleFormDefinition } from "./fixtures.ts";

describe("buildPreviewDocument", () => {
  it("inlines style.css/data.js/behavior.js and drops the external references", () => {
    const files = generateSolution(sampleFormDefinition(), { ...defaultBuilderConfig(), variants: ["ff", "oc"] });
    const doc = buildPreviewDocument(files, "ff", "en_GB");
    expect(doc).not.toContain('href="style.css"');
    expect(doc).not.toContain('src="data.js"');
    expect(doc).not.toContain('src="behavior.js"');
    expect(doc).toContain("<style>");
    expect(doc).toContain("var FORM_DATA");
    expect(doc).toContain("FORM_DATA.param");
  });

  it("injects a __PREVIEW_LANG__ override instead of relying on a blob: URL query string", () => {
    const files = generateSolution(sampleFormDefinition(), { ...defaultBuilderConfig(), variants: ["ff"] });
    const doc = buildPreviewDocument(files, "ff", "ar_AE");
    expect(doc).toContain('window.__PREVIEW_LANG__ = "ar_AE"');
  });

  it("throws a clear error when the requested variant wasn't generated", () => {
    const files = generateSolution(sampleFormDefinition(), { ...defaultBuilderConfig(), variants: ["ff"] });
    expect(() => buildPreviewDocument(files, "oc", "en_GB")).toThrow(/oc\.html/);
  });
});
