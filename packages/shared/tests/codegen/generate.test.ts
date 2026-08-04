// @vitest-environment node
import { describe, expect, it } from "vitest";
import { resolveFileNames } from "../../src/codegen/fileNames";
import { generateSolution } from "../../src/codegen/generate";
import { defaultBuilderConfig, type FormVariant } from "../../src/codegen/types";
import { sampleFormDefinition } from "./fixtures";

describe("generateSolution", () => {
  it("FF-only config produces exactly the FF html, FF js, data.js, style.css", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    expect(files.map((f) => f.path).sort()).toEqual([fileNames.css, fileNames.dataJs, fileNames.ffJs, fileNames.ffHtml].sort());
  });

  it("both-variants config produces exactly 6 files, no invented extras", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["ff", "oc"] as FormVariant[] };
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    expect(files.map((f) => f.path).sort()).toEqual(
      [fileNames.css, fileNames.dataJs, fileNames.ffJs, fileNames.ocJs, fileNames.ffHtml, fileNames.ocHtml].sort(),
    );
  });

  it("OC-only config produces exactly the OC html, OC js, data.js, style.css", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["oc"] as FormVariant[] };
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    expect(files.map((f) => f.path).sort()).toEqual([fileNames.css, fileNames.dataJs, fileNames.ocJs, fileNames.ocHtml].sort());
  });

  it("matches the reference fixture snapshot (ff.html)", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    const ff = files.find((f) => f.path === fileNames.ffHtml)!;
    expect(ff.contents).toMatchSnapshot();
  });

  it("matches the reference fixture snapshot (data.js)", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    const dataJs = files.find((f) => f.path === fileNames.dataJs)!;
    expect(dataJs.contents).toMatchSnapshot();
  });

  it("matches the reference fixture snapshot (style.css head/tail)", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    const css = files.find((f) => f.path === fileNames.css)!;
    expect(css.contents.slice(0, 200)).toMatchSnapshot();
    expect(css.contents.slice(-600)).toMatchSnapshot();
  });
});
