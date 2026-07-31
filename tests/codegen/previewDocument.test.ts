// @vitest-environment node
import { describe, expect, it } from "vitest";
import { resolveFileNames } from "../../src/codegen/fileNames.ts";
import { generateSolution } from "../../src/codegen/generate.ts";
import { buildPreviewDocument } from "../../src/codegen/previewDocument.ts";
import { defaultBuilderConfig, type FormVariant } from "../../src/codegen/types.ts";
import { sampleFormDefinition } from "./fixtures.ts";

describe("buildPreviewDocument", () => {
  it("inlines the CSS/data-JS/behavior-JS and drops the external references", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["ff", "oc"] as FormVariant[] };
    const files = generateSolution(form, config);
    const fileNames = resolveFileNames(form, config);
    const doc = buildPreviewDocument(files, "ff", "en_GB", fileNames);
    expect(doc).not.toContain(`href="${fileNames.css}"`);
    expect(doc).not.toContain(`src="${fileNames.dataJs}"`);
    expect(doc).not.toContain(`src="${fileNames.behaviorJs}"`);
    expect(doc).toContain("<style>");
    expect(doc).toContain("var FORM_DATA");
    expect(doc).toContain("FORM_DATA.param");
  });

  it("injects a __PREVIEW_LANG__ override instead of relying on a blob: URL query string", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["ff"] as FormVariant[] };
    const files = generateSolution(form, config);
    const doc = buildPreviewDocument(files, "ff", "ar_AE", resolveFileNames(form, config));
    expect(doc).toContain('window.__PREVIEW_LANG__ = "ar_AE"');
  });

  it("throws a clear error when the requested variant wasn't generated", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["ff"] as FormVariant[] };
    const files = generateSolution(form, config);
    const fileNames = resolveFileNames(form, config);
    expect(() => buildPreviewDocument(files, "oc", "en_GB", fileNames)).toThrow(new RegExp(fileNames.ocHtml.replace(".", "\\.")));
  });
});
