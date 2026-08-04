// @vitest-environment node
import { describe, expect, it } from "vitest";
import { defaultBuilderConfig, generateSolution, resolveFileNames, type FormVariant } from "@formbuilder/shared";
import { buildPreviewDocument } from "../../src/codegen/previewDocument.ts";
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
    expect(doc).not.toContain(`src="${fileNames.ffJs}"`);
    expect(doc).toContain("<style>");
    expect(doc).toContain("const fields = ");
    expect(doc).toContain("const param = ");
  });

  it("throws a clear error when the requested variant wasn't generated", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["ff"] as FormVariant[] };
    const files = generateSolution(form, config);
    const fileNames = resolveFileNames(form, config);
    expect(() => buildPreviewDocument(files, "oc", "en_GB", fileNames)).toThrow(new RegExp(fileNames.ocHtml.replace(".", "\\.")));
  });
});
