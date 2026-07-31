// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { resolveFileNames } from "../../src/codegen/fileNames.ts";
import { buildFfHtml } from "../../src/codegen/html/buildFfHtml.ts";
import { buildOcHtml } from "../../src/codegen/html/buildOcHtml.ts";
import { defaultBuilderConfig, type BuilderConfig } from "../../src/codegen/types.ts";
import { sampleFormDefinition } from "./fixtures.ts";

describe("buildFfHtml", () => {
  it("produces a parseable document with the expected structure and RTL attributes", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const file = buildFfHtml(form, config, resolveFileNames(form, config));
    expect(file.path).toBe("TEST-EN_FF.html");

    const doc = new DOMParser().parseFromString(file.contents, "text/html");
    expect(doc.documentElement.getAttribute("lang")).toBe("en");
    expect(doc.documentElement.getAttribute("dir")).toBe("ltr");
    expect(doc.body.getAttribute("data-variant")).toBe("ff");

    // Profile fields present per fixture (email + submitButton only; no firstName/lastName/callingCode).
    expect(doc.querySelector("#email")).not.toBeNull();
    expect(doc.querySelector("#firstName")).toBeNull();
    expect(doc.querySelector("#callingCode")).toBeNull();

    // 3 questions, one per control type.
    const modules = doc.querySelectorAll(".form_check_module");
    expect(modules.length).toBe(3);
    expect(doc.querySelector("#Q1 .radio_group")).not.toBeNull();
    expect(doc.querySelector("#Q2 .form_check_list_wrap")).not.toBeNull();
    expect(doc.querySelector("#Q3 textarea")).not.toBeNull();

    // Answer DOM ids/values use sequential order (A1, A2), not source gaps.
    expect(doc.querySelector("#Q1A1")).not.toBeNull();
    expect(doc.querySelector("#Q1A1")?.getAttribute("value")).toBe("A1");

    // No privacy checkbox rendered since the fixture has no privacyPolicy field.
    expect(doc.querySelector("#privacyPolicy")).toBeNull();

    // All text nodes stay empty — text is injected at runtime by behavior.js.
    expect(doc.querySelector("#Q1 h3 span")?.textContent).toBe("");
  });

  it("references the resolved data/behavior/style file names in <head>/<script> tags", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const file = buildFfHtml(form, config, fileNames);
    expect(file.contents).toContain(`href="${fileNames.css}"`);
    expect(file.contents).toContain(`src="${fileNames.dataJs}"`);
    expect(file.contents).toContain(`src="${fileNames.behaviorJs}"`);
  });

  it("never leaks raw HTML-special characters from question/answer text into markup (text stays empty)", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const file = buildFfHtml(form, config, resolveFileNames(form, config));
    expect(file.contents).not.toContain("<script>alert(1)</script>");
    expect(file.contents).not.toContain("maliciousCode");
  });

  it("sets dir=rtl and lang from the default locale when the source's default is RTL", () => {
    const form = sampleFormDefinition();
    form.meta.defaultLocale = "ar_AE";
    const config = defaultBuilderConfig();
    const file = buildFfHtml(form, config, resolveFileNames(form, config));
    const doc = new DOMParser().parseFromString(file.contents, "text/html");
    expect(doc.documentElement.getAttribute("lang")).toBe("ar");
    expect(doc.documentElement.getAttribute("dir")).toBe("rtl");
  });

  it("includes the Adobe Launch script only when analytics is enabled", () => {
    const form = sampleFormDefinition();
    const withoutAnalyticsConfig = defaultBuilderConfig();
    const withoutAnalytics = buildFfHtml(form, withoutAnalyticsConfig, resolveFileNames(form, withoutAnalyticsConfig));
    expect(withoutAnalytics.contents).not.toContain("assets.adobedtm.com");

    const withAnalyticsConfig: BuilderConfig = {
      variants: ["ff"],
      apiEndpoint: "",
      analytics: { enabled: true, reportSuiteID: "rs", imsOrgID: "org", datastreamID: "ds" },
    };
    const withAnalytics = buildFfHtml(form, withAnalyticsConfig, resolveFileNames(form, withAnalyticsConfig));
    expect(withAnalytics.contents).toContain("assets.adobedtm.com");
  });

  it("includes favicon and custom-fonts <link> tags only when configured", () => {
    const form = sampleFormDefinition();
    const bare = buildFfHtml(form, defaultBuilderConfig(), resolveFileNames(form, defaultBuilderConfig()));
    expect(bare.contents).not.toContain("shortcut icon");

    const withAssetsConfig: BuilderConfig = {
      variants: ["ff"],
      faviconUrl: "https://example.com/favicon.png",
      customFontsHref: "https://example.com/fonts.css",
    };
    const withAssets = buildFfHtml(form, withAssetsConfig, resolveFileNames(form, withAssetsConfig));
    expect(withAssets.contents).toContain('<link rel="shortcut icon" href="https://example.com/favicon.png">');
    expect(withAssets.contents).toContain('<link rel="stylesheet" href="https://example.com/fonts.css">');
  });
});

describe("buildOcHtml", () => {
  it("omits name/email fields and privacy checkboxes, uses a floating submit bar", () => {
    const form = sampleFormDefinition();
    form.fields.callingCode = { labelByLocale: { en_GB: "Mobile No." }, dropdownFirstEntryByLocale: {} };
    form.fields.privacyPolicy = { textByLocale: { en_GB: "..." }, linkUrlByLocale: { en_GB: "https://x" } };
    const config = defaultBuilderConfig();
    const file = buildOcHtml(form, config, resolveFileNames(form, config));
    expect(file.path).toBe("TEST-EN_OC.html");
    const doc = new DOMParser().parseFromString(file.contents, "text/html");

    expect(doc.body.getAttribute("data-variant")).toBe("oc");
    expect(doc.querySelector("#email")).toBeNull();
    expect(doc.querySelector("#firstName")).toBeNull();
    expect(doc.querySelector("#callingCode")).not.toBeNull();
    expect(doc.querySelector("#privacyPolicy")).toBeNull();
    expect(doc.querySelector(".form_bottom_bar#formBottomBar")).not.toBeNull();
    expect(doc.querySelector(".form_bottom_group")).toBeNull();
    expect(doc.querySelector(".container_oc")).not.toBeNull();
  });
});
