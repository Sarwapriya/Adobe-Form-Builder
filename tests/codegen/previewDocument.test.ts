// @vitest-environment node
import { describe, expect, it } from "vitest";
import { defaultBuilderConfig, generateSolution, languageFileNames, resolveFileNames, type FormVariant } from "@formbuilder/shared";
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

  it("previews the page for the requested language: its own <html lang>/dir, and its own css + behavior JS inlined", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["ff"] as FormVariant[], projectCode: "F2H26" };
    const files = generateSolution(form, config);
    const fileNames = resolveFileNames(form, config);

    const arDoc = buildPreviewDocument(files, "ff", "ar_AE", fileNames);
    const ar = languageFileNames(fileNames, "ar_AE");
    expect(arDoc).toContain('<html lang="ar" dir="rtl">');
    expect(arDoc).toContain('param["fallbackLanguage"] = "ar_AE";');
    expect(arDoc).not.toContain(`href="${ar.css}"`);
    expect(arDoc).not.toContain(`src="${ar.ffJs}"`);
    expect(arDoc).not.toContain(`src="${fileNames.dataJs}"`);

    const enDoc = buildPreviewDocument(files, "ff", "en_GB", fileNames);
    expect(enDoc).toContain('<html lang="en" dir="ltr">');
    expect(enDoc).toContain('param["fallbackLanguage"] = "en_GB";');
    expect(enDoc).not.toContain('param["fallbackLanguage"] = "ar_AE";');
  });

  it("falls back to the default language's page for a locale the form doesn't have", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["ff"] as FormVariant[] };
    const files = generateSolution(form, config);
    const fileNames = resolveFileNames(form, config);
    expect(buildPreviewDocument(files, "ff", "xx_XX", fileNames)).toContain('<html lang="en" dir="ltr">');
  });

  it("throws a clear error when the requested variant wasn't generated", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["ff"] as FormVariant[] };
    const files = generateSolution(form, config);
    const fileNames = resolveFileNames(form, config);
    expect(() => buildPreviewDocument(files, "oc", "en_GB", fileNames)).toThrow(new RegExp(fileNames.ocHtml.replace(".", "\\.")));
  });

  it("fakes a recipient id for the OC preview, since the reference OC script shows an error screen instead of the form when ?id= is missing", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["ff", "oc"] as FormVariant[] };
    const files = generateSolution(form, config);
    const fileNames = resolveFileNames(form, config);

    const ocDoc = buildPreviewDocument(files, "oc", "en_GB", fileNames);
    expect(ocDoc).toContain('n==="id"&&I?I:g(n)');
    expect(ocDoc).toContain('var I="preview-recipient"');

    // FF never gates on ?id=, so it's left unfaked — no behavior change there.
    const ffDoc = buildPreviewDocument(files, "ff", "en_GB", fileNames);
    expect(ffDoc).toContain('var I=""');
  });

  it("only injects the dark-preview color-invert override when explicitly asked for", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["ff"] as FormVariant[] };
    const files = generateSolution(form, config);
    const fileNames = resolveFileNames(form, config);

    const lightDoc = buildPreviewDocument(files, "ff", "en_GB", fileNames);
    expect(lightDoc).not.toContain("invert(1) hue-rotate(180deg)");

    const darkDoc = buildPreviewDocument(files, "ff", "en_GB", fileNames, "dark");
    expect(darkDoc).toContain("invert(1) hue-rotate(180deg)");
  });
});
