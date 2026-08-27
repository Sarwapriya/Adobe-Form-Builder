// @vitest-environment node
import { describe, expect, it } from "vitest";
import { resolveFileNames } from "../../src/codegen/fileNames";
import { generateSolution } from "../../src/codegen/generate";
import { defaultBuilderConfig, type FormVariant } from "../../src/codegen/types";
import { sampleFormDefinition } from "./fixtures";

describe("generateSolution", () => {
  it("FF-only config produces exactly the FF html, FF js, data.js, style.css — one set regardless of locale count", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    expect(files.map((f) => f.path).sort()).toEqual([fileNames.css, fileNames.dataJs, fileNames.ffJs, fileNames.ffHtml].sort());
  });

  it("both-variants config produces exactly 6 files, no per-locale extras", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["ff", "oc"] as FormVariant[] };
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    expect(files.map((f) => f.path).sort()).toEqual(
      [fileNames.css, fileNames.dataJs, fileNames.ffJs, fileNames.ocJs, fileNames.ffHtml, fileNames.ocHtml].sort(),
    );
  });

  it("OC-only config produces exactly the OC html, OC js, data.js, style.css — one set regardless of locale count", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["oc"] as FormVariant[] };
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    expect(files.map((f) => f.path).sort()).toEqual([fileNames.css, fileNames.dataJs, fileNames.ocJs, fileNames.ocHtml].sort());
  });

  it("data.js keys every locale-dependent block by locale, so the one shared HTML/JS pair can render any of them via ?lang=", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    const dataJs = files.find((f) => f.path === fileNames.dataJs)!.contents;
    expect(dataJs).toContain('"en_GB"');
    expect(dataJs).toContain('"ar_AE"');
  });

  it("the shared HTML seeds <html lang>/dir from the form's default locale; the behavior JS re-resolves dir at runtime from ?lang=", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    const ffHtml = files.find((f) => f.path === fileNames.ffHtml)!;
    expect(ffHtml.contents).toContain('<html lang="en" dir="ltr">');
    expect(ffHtml.contents).toContain(`<link rel="stylesheet" href="${fileNames.css}">`);
    expect(ffHtml.contents).toContain(`<script src="${fileNames.dataJs}"></script>`);
    expect(ffHtml.contents).toContain(`<script src="${fileNames.ffJs}"></script>`);

    const ffJs = files.find((f) => f.path === fileNames.ffJs)!.contents;
    expect(ffJs).toContain('frameUrlParam.get("lang")');
    expect(ffJs).toContain('fields[language]');
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
