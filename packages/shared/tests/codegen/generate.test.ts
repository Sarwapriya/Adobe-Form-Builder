// @vitest-environment node
import { describe, expect, it } from "vitest";
import { languageFileNames, resolveFileNames } from "../../src/codegen/fileNames";
import { generateSolution } from "../../src/codegen/generate";
import { defaultBuilderConfig, type FormVariant } from "../../src/codegen/types";
import { sampleFormDefinition } from "./fixtures";

// The sample form has two languages (English default + Arabic), so every count below is
// `2·languages·variants + languages + 1` (one HTML + one behavior JS per language per
// variant, one stylesheet per language, one shared data file).
describe("generateSolution", () => {
  it("FF-only config produces, per language, the FF html + FF js + css, plus the one shared data file", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    expect(files).toHaveLength(7);
    expect(files.map((f) => f.path).sort()).toEqual(
      [fileNames.dataJs, ...fileNames.languages.flatMap((l) => [l.css, l.ffJs, l.ffHtml])].sort(),
    );
  });

  it("both-variants config produces exactly 11 files: per-language html/js for each variant, per-language css, one data file", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["ff", "oc"] as FormVariant[] };
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    expect(files).toHaveLength(11);
    expect(new Set(files.map((f) => f.path)).size).toBe(11);
    expect(files.map((f) => f.path).sort()).toEqual(
      [fileNames.dataJs, ...fileNames.languages.flatMap((l) => [l.css, l.ffJs, l.ocJs, l.ffHtml, l.ocHtml])].sort(),
    );
  });

  it("OC-only config produces, per language, the OC html + OC js + css, plus the one shared data file", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["oc"] as FormVariant[] };
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    expect(files).toHaveLength(7);
    expect(files.map((f) => f.path).sort()).toEqual(
      [fileNames.dataJs, ...fileNames.languages.flatMap((l) => [l.css, l.ocJs, l.ocHtml])].sort(),
    );
  });

  it("a single-language form produces 4 files (FF only): html, js, data, css", () => {
    const form = sampleFormDefinition();
    form.locales = form.locales.filter((l) => l.code === "en_GB");
    const files = generateSolution(form, defaultBuilderConfig());
    expect(files.map((f) => f.path).sort()).toEqual(["EN.css", "TEST-EN_FF.html", "TEST-EN_FF.js", "TEST.js"].sort());
  });

  it("data.js keys every locale-dependent block by locale — the one shared data file serves every language's page", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    const dataJs = files.find((f) => f.path === fileNames.dataJs)!.contents;
    expect(dataJs).toContain('"en_GB"');
    expect(dataJs).toContain('"ar_AE"');
    // ...and every language's HTML links that same data file.
    for (const lang of fileNames.languages) {
      const html = files.find((f) => f.path === lang.ffHtml)!.contents;
      expect(html).toContain(`<script src="${fileNames.dataJs}"></script>`);
    }
  });

  it("each language's HTML seeds its own <html lang>/dir and links its own css + behavior js", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);

    const en = languageFileNames(fileNames, "en_GB");
    const enHtml = files.find((f) => f.path === en.ffHtml)!.contents;
    expect(enHtml).toContain('<html lang="en" dir="ltr">');
    expect(enHtml).toContain(`<link rel="stylesheet" href="${en.css}">`);
    expect(enHtml).toContain(`<script src="${en.ffJs}"></script>`);

    const ar = languageFileNames(fileNames, "ar_AE");
    const arHtml = files.find((f) => f.path === ar.ffHtml)!.contents;
    expect(arHtml).toContain('<html lang="ar" dir="rtl">');
    expect(arHtml).toContain(`<link rel="stylesheet" href="${ar.css}">`);
    expect(arHtml).toContain(`<script src="${ar.ffJs}"></script>`);
    expect(arHtml).not.toContain(en.css);
    expect(arHtml).not.toContain(en.ffJs);
  });

  it("each language's behavior JS pins that language as the default, and still reads ?lang= (the reference script, unchanged, follows the pin)", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);

    for (const lang of fileNames.languages) {
      const ffJs = files.find((f) => f.path === lang.ffJs)!.contents;
      expect(ffJs).toContain(`param["fallbackLanguage"] = "${lang.locale}";`);
      expect(ffJs).toContain('frameUrlParam.get("lang")');
      expect(ffJs).toContain("fields[language]");
    }
  });

  it("every language's stylesheet carries the same full stylesheet", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    const [first, second] = fileNames.languages.map((l) => files.find((f) => f.path === l.css)!.contents);
    expect(first).toBe(second);
    expect(first).toContain('[dir="rtl"]');
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
