// @vitest-environment node
import { describe, expect, it } from "vitest";
import { resolveFileNames } from "../../src/codegen/fileNames.ts";
import { generateSolution } from "../../src/codegen/generate.ts";
import { defaultBuilderConfig, type FormVariant } from "../../src/codegen/types.ts";
import { sampleFormDefinition } from "./fixtures.ts";

describe("generateSolution", () => {
  it("FF-only config produces exactly the FF html, data.js, behavior.js, style.css", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    expect(files.map((f) => f.path).sort()).toEqual([fileNames.css, fileNames.dataJs, fileNames.behaviorJs, fileNames.ffHtml].sort());
  });

  it("both-variants config produces exactly 5 files, no invented extras", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["ff", "oc"] as FormVariant[] };
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    expect(files.map((f) => f.path).sort()).toEqual(
      [fileNames.css, fileNames.dataJs, fileNames.behaviorJs, fileNames.ffHtml, fileNames.ocHtml].sort(),
    );
  });

  it("OC-only config produces exactly the OC html, data.js, behavior.js, style.css", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["oc"] as FormVariant[] };
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    expect(files.map((f) => f.path).sort()).toEqual([fileNames.css, fileNames.dataJs, fileNames.behaviorJs, fileNames.ocHtml].sort());
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
