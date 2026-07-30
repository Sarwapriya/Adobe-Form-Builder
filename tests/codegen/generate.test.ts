// @vitest-environment node
import { describe, expect, it } from "vitest";
import { generateSolution } from "../../src/codegen/generate.ts";
import { defaultBuilderConfig } from "../../src/codegen/types.ts";
import { sampleFormDefinition } from "./fixtures.ts";

describe("generateSolution", () => {
  it("FF-only config produces exactly ff.html, data.js, behavior.js, style.css", () => {
    const files = generateSolution(sampleFormDefinition(), defaultBuilderConfig());
    expect(files.map((f) => f.path).sort()).toEqual(["behavior.js", "data.js", "ff.html", "style.css"]);
  });

  it("both-variants config produces exactly 5 files, no invented extras", () => {
    const files = generateSolution(sampleFormDefinition(), { ...defaultBuilderConfig(), variants: ["ff", "oc"] });
    expect(files.map((f) => f.path).sort()).toEqual(["behavior.js", "data.js", "ff.html", "oc.html", "style.css"]);
  });

  it("OC-only config produces exactly oc.html, data.js, behavior.js, style.css", () => {
    const files = generateSolution(sampleFormDefinition(), { ...defaultBuilderConfig(), variants: ["oc"] });
    expect(files.map((f) => f.path).sort()).toEqual(["behavior.js", "data.js", "oc.html", "style.css"]);
  });

  it("matches the reference fixture snapshot (ff.html)", () => {
    const files = generateSolution(sampleFormDefinition(), defaultBuilderConfig());
    const ff = files.find((f) => f.path === "ff.html")!;
    expect(ff.contents).toMatchSnapshot();
  });

  it("matches the reference fixture snapshot (data.js)", () => {
    const files = generateSolution(sampleFormDefinition(), defaultBuilderConfig());
    const dataJs = files.find((f) => f.path === "data.js")!;
    expect(dataJs.contents).toMatchSnapshot();
  });

  it("matches the reference fixture snapshot (style.css head/tail)", () => {
    const files = generateSolution(sampleFormDefinition(), defaultBuilderConfig());
    const css = files.find((f) => f.path === "style.css")!;
    expect(css.contents.slice(0, 200)).toMatchSnapshot();
    expect(css.contents.slice(-600)).toMatchSnapshot();
  });
});
