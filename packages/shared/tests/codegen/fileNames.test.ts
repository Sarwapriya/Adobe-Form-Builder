// @vitest-environment node
import { describe, expect, it } from "vitest";
import { languageFileNames, resolveFileNames } from "../../src/codegen/fileNames";
import { generateSolution } from "../../src/codegen/generate";
import { defaultBuilderConfig, type FormVariant } from "../../src/codegen/types";
import { sampleFormDefinition } from "./fixtures";

/**
 * Pins the file-naming convention:
 *   HTML / behavior JS:  <Sub>-<lang>_<projectCode>_<FF|OC>.html / .js   (per language, per variant)
 *   main data JS:        <Sub>_<projectCode>.js                            (per subsidiary + project code)
 *   CSS:                 <lang>-<projectCode>.css                          (per language + project code)
 * with the project-code segment omitted while the form has no project code.
 */
describe("resolveFileNames", () => {
  const withCode = () => ({ ...defaultBuilderConfig(), projectCode: "F2H26", variants: ["ff", "oc"] as FormVariant[] });

  it("names every file per the convention when the form has a project code", () => {
    const form = sampleFormDefinition(); // subsidiary "TEST", languages en_GB + ar_AE
    const names = resolveFileNames(form, withCode());

    expect(names.dataJs).toBe("TEST_F2H26.js");
    expect(names.languages).toEqual([
      {
        locale: "en_GB",
        lang: "EN",
        css: "EN-F2H26.css",
        ffHtml: "TEST-EN_F2H26_FF.html",
        ocHtml: "TEST-EN_F2H26_OC.html",
        ffJs: "TEST-EN_F2H26_FF.js",
        ocJs: "TEST-EN_F2H26_OC.js",
      },
      {
        locale: "ar_AE",
        lang: "AR",
        css: "AR-F2H26.css",
        ffHtml: "TEST-AR_F2H26_FF.html",
        ocHtml: "TEST-AR_F2H26_OC.html",
        ffJs: "TEST-AR_F2H26_FF.js",
        ocJs: "TEST-AR_F2H26_OC.js",
      },
    ]);
  });

  it("generates exactly those file names", () => {
    const form = sampleFormDefinition();
    const files = generateSolution(form, withCode());
    expect(files.map((f) => f.path).sort()).toEqual(
      [
        "TEST_F2H26.js",
        "EN-F2H26.css",
        "AR-F2H26.css",
        "TEST-EN_F2H26_FF.html",
        "TEST-AR_F2H26_FF.html",
        "TEST-EN_F2H26_OC.html",
        "TEST-AR_F2H26_OC.html",
        "TEST-EN_F2H26_FF.js",
        "TEST-AR_F2H26_FF.js",
        "TEST-EN_F2H26_OC.js",
        "TEST-AR_F2H26_OC.js",
      ].sort(),
    );
  });

  it("omits the project-code segment while the form has none", () => {
    const form = sampleFormDefinition();
    const names = resolveFileNames(form, { ...defaultBuilderConfig(), variants: ["ff", "oc"] });
    expect(names.dataJs).toBe("TEST.js");
    expect(names.languages.map((l) => l.css)).toEqual(["EN.css", "AR.css"]);
    expect(names.languages.map((l) => l.ffHtml)).toEqual(["TEST-EN_FF.html", "TEST-AR_FF.html"]);
    expect(names.languages.map((l) => l.ocJs)).toEqual(["TEST-EN_OC.js", "TEST-AR_OC.js"]);
  });

  it("treats a blank / whitespace-only project code as absent", () => {
    const form = sampleFormDefinition();
    expect(resolveFileNames(form, { ...defaultBuilderConfig(), projectCode: "   " }).dataJs).toBe("TEST.js");
  });

  it("the top-level css/html/js names are the default locale's set", () => {
    const form = sampleFormDefinition();
    const names = resolveFileNames(form, withCode());
    expect(names.locale).toBe("en_GB");
    expect(names.ffHtml).toBe("TEST-EN_F2H26_FF.html");
    expect(names.css).toBe("EN-F2H26.css");
    expect(names.ffHtml).toBe(languageFileNames(names, "en_GB").ffHtml);
  });

  it("the default set follows meta.defaultLocale, not the locale order", () => {
    const form = sampleFormDefinition();
    form.meta.defaultLocale = "ar_AE";
    const names = resolveFileNames(form, withCode());
    expect(names.locale).toBe("ar_AE");
    expect(names.ffHtml).toBe("TEST-AR_F2H26_FF.html");
  });

  it("languageFileNames picks a locale's set, falling back to the default's for an unknown locale", () => {
    const form = sampleFormDefinition();
    const names = resolveFileNames(form, withCode());
    expect(languageFileNames(names, "ar_AE").ffHtml).toBe("TEST-AR_F2H26_FF.html");
    expect(languageFileNames(names, "xx_XX").ffHtml).toBe("TEST-EN_F2H26_FF.html");
    expect(languageFileNames(names).ffHtml).toBe("TEST-EN_F2H26_FF.html");
  });

  it("sanitizes unsafe characters in the project code and subsidiary", () => {
    const form = sampleFormDefinition();
    form.meta.subsidiary = "SE SAR/1";
    const names = resolveFileNames(form, { ...defaultBuilderConfig(), projectCode: "F2H 26/x" });
    expect(names.dataJs).toBe("SE-SAR-1_F2H-26-x.js");
    expect(names.ffHtml).toBe("SE-SAR-1-EN_F2H-26-x_FF.html");
    expect(names.css).toBe("EN-F2H-26-x.css");
  });

  it("fileNamePrefix overrides only the <Sub> part", () => {
    const form = sampleFormDefinition();
    const names = resolveFileNames(form, { ...defaultBuilderConfig(), fileNamePrefix: "SESAR", projectCode: "F2H26" });
    expect(names.dataJs).toBe("SESAR_F2H26.js");
    expect(names.ffHtml).toBe("SESAR-EN_F2H26_FF.html");
    expect(names.css).toBe("EN-F2H26.css");
  });

  it("drops the <Sub> segment when there is no subsidiary at all", () => {
    const form = sampleFormDefinition();
    form.meta.subsidiary = "";
    expect(resolveFileNames(form, { ...defaultBuilderConfig(), projectCode: "F2H26" }).ffHtml).toBe("EN_F2H26_FF.html");
    expect(resolveFileNames(form, { ...defaultBuilderConfig(), projectCode: "F2H26" }).dataJs).toBe("F2H26.js");
    expect(resolveFileNames(form, defaultBuilderConfig()).dataJs).toBe("data.js");
  });

  it("disambiguates two locales of the same language with the full country code", () => {
    const form = sampleFormDefinition();
    form.locales = [
      { code: "en_GB", langSubtag: "en", isRtl: false, sourceColumn: "en_GB", label: "English (UK)" },
      { code: "en_US", langSubtag: "en", isRtl: false, sourceColumn: "builder", label: "English (US)" },
      { code: "ar_AE", langSubtag: "ar", isRtl: true, sourceColumn: "C", label: "Arabic" },
    ];
    const names = resolveFileNames(form, { ...defaultBuilderConfig(), projectCode: "F2H26" });
    expect(names.languages.map((l) => l.lang)).toEqual(["EN-GB", "EN-US", "AR"]);
    expect(names.languages.map((l) => l.ffHtml)).toEqual([
      "TEST-EN-GB_F2H26_FF.html",
      "TEST-EN-US_F2H26_FF.html",
      "TEST-AR_F2H26_FF.html",
    ]);
    expect(names.languages.map((l) => l.css)).toEqual(["EN-GB-F2H26.css", "EN-US-F2H26.css", "AR-F2H26.css"]);
    expect(new Set(names.languages.map((l) => l.ffHtml)).size).toBe(3);
  });
});
