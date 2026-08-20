// @vitest-environment node
import { describe, expect, it } from "vitest";
import { resolveFileNames } from "../../src/codegen/fileNames";
import { generateSolution } from "../../src/codegen/generate";
import { defaultBuilderConfig, type FormVariant } from "../../src/codegen/types";
import { sampleFormDefinition } from "./fixtures";

describe("generateSolution", () => {
  it("FF-only config produces exactly the FF html, FF js, data.js, style.css, plus one FF pair per extra locale", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    const localeExtras = fileNames.localeVariants.flatMap((v) => [v.ffHtml, v.ffJs]);
    expect(files.map((f) => f.path).sort()).toEqual(
      [fileNames.css, fileNames.dataJs, fileNames.ffJs, fileNames.ffHtml, ...localeExtras].sort(),
    );
  });

  it("both-variants config produces exactly 6 files, plus one FF+OC pair per extra locale, no other invented extras", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["ff", "oc"] as FormVariant[] };
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    const localeExtras = fileNames.localeVariants.flatMap((v) => [v.ffHtml, v.ffJs, v.ocHtml, v.ocJs]);
    expect(files.map((f) => f.path).sort()).toEqual(
      [fileNames.css, fileNames.dataJs, fileNames.ffJs, fileNames.ocJs, fileNames.ffHtml, fileNames.ocHtml, ...localeExtras].sort(),
    );
  });

  it("OC-only config produces exactly the OC html, OC js, data.js, style.css, plus one OC pair per extra locale", () => {
    const form = sampleFormDefinition();
    const config = { ...defaultBuilderConfig(), variants: ["oc"] as FormVariant[] };
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    const localeExtras = fileNames.localeVariants.flatMap((v) => [v.ocHtml, v.ocJs]);
    expect(files.map((f) => f.path).sort()).toEqual([fileNames.css, fileNames.dataJs, fileNames.ocJs, fileNames.ocHtml, ...localeExtras].sort());
  });

  it("the extra locale variant's HTML sets its own <html lang>/dir while sharing the same data.js/style.css as the default locale", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const files = generateSolution(form, config);
    const arVariant = fileNames.localeVariants.find((v) => v.locale === "ar_AE")!;
    const arHtml = files.find((f) => f.path === arVariant.ffHtml)!;
    expect(arHtml.contents).toContain('<html lang="ar" dir="rtl">');
    expect(arHtml.contents).toContain(`<link rel="stylesheet" href="${fileNames.css}">`);
    expect(arHtml.contents).toContain(`<script src="${fileNames.dataJs}"></script>`);
    expect(arHtml.contents).toContain(`<script src="${arVariant.ffJs}"></script>`);

    const arJs = files.find((f) => f.path === arVariant.ffJs)!;
    const enJs = files.find((f) => f.path === fileNames.ffJs)!;
    expect(arJs.contents).toBe(enJs.contents);
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
