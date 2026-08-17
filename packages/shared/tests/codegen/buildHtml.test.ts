// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { resolveFileNames } from "../../src/codegen/fileNames";
import { buildFfHtml } from "../../src/codegen/html/buildFfHtml";
import { buildOcHtml } from "../../src/codegen/html/buildOcHtml";
import { defaultBuilderConfig, type BuilderConfig } from "../../src/codegen/types";
import { sampleFormDefinition } from "./fixtures";

describe("buildFfHtml", () => {
  it("produces a parseable document with the expected structure and RTL attributes", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const file = buildFfHtml(form, config, resolveFileNames(form, config));
    expect(file.path).toBe("TEST-EN_FF.html");

    const doc = new DOMParser().parseFromString(file.contents, "text/html");
    expect(doc.documentElement.getAttribute("lang")).toBe("en");
    expect(doc.documentElement.getAttribute("dir")).toBe("ltr");

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

    // Every submittable element is marked data-pt-api="y" (read by the reference
    // FF.js/OC.js scripts' data-pt-api scan to build the submission payload).
    expect(doc.querySelector("#email")?.getAttribute("data-pt-api")).toBe("y");
    expect(doc.querySelector("#Q1A1")?.getAttribute("data-pt-api")).toBe("y");
    expect(doc.querySelector("#Q3 textarea")?.getAttribute("data-pt-api")).toBe("y");

    // No Parsley/required attributes on question inputs — the reference gates
    // questions purely through its own hardcoded enableDisableSubmit(), not Parsley.
    expect(doc.querySelector("#Q1A1")?.hasAttribute("data-parsley-required")).toBe(false);
    expect(doc.querySelector("#Q1A1")?.hasAttribute("required")).toBe(false);
    expect(doc.querySelector("#Q2A1")?.hasAttribute("data-parsley-multiple")).toBe(false);

    // No privacy checkbox rendered since the fixture has no privacyPolicy field.
    expect(doc.querySelector("#privacyPolicy")).toBeNull();

    // No Terms and Conditions link rendered since the fixture has no
    // termsAndConditions field — absent means not rendered, same as every
    // other optional field, not a fallback to some hardcoded default link.
    expect(doc.querySelector("#termsAndConditionsLink")).toBeNull();

    // All text nodes stay empty — text is injected at runtime by the reference script.
    expect(doc.querySelector("#Q1 h3 span")?.textContent).toBe("");
  });

  it("references the resolved data/behavior/style file names in <head>/<script> tags", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const file = buildFfHtml(form, config, fileNames);
    expect(file.contents).toContain(`href="${fileNames.css}"`);
    expect(file.contents).toContain(`src="${fileNames.dataJs}"`);
    expect(file.contents).toContain(`src="${fileNames.ffJs}"`);
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

  it("always includes the reference's exact static head/skeleton (title, favicon, fonts)", () => {
    const form = sampleFormDefinition();
    const file = buildFfHtml(form, defaultBuilderConfig(), resolveFileNames(form, defaultBuilderConfig()));
    expect(file.contents).toContain("<title>Samsung</title>");
    expect(file.contents).toContain("https://res6.mena2p.crm.samsung.com/res/tracking/Favicon.png");
    expect(file.contents).toContain("samsungSS_fonts_2026.css");
  });

  it("renders an empty-text-node Terms and Conditions link, in both variants, only when configured", () => {
    const form = sampleFormDefinition();
    form.fields.termsAndConditions = {
      textByLocale: { en_GB: "* Terms and conditions apply." },
      urlByLocale: { en_GB: "https://example.com/terms.pdf" },
    };
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);

    const ffDoc = new DOMParser().parseFromString(buildFfHtml(form, config, fileNames).contents, "text/html");
    const ffLink = ffDoc.querySelector("#termsAndConditionsLink");
    expect(ffLink).not.toBeNull();
    expect(ffLink?.getAttribute("href")).toBe("#"); // populated at runtime, not baked in
    expect(ffLink?.textContent).toBe(""); // text injected at runtime by the reference script

    const ocDoc = new DOMParser().parseFromString(buildOcHtml(form, config, fileNames).contents, "text/html");
    expect(ocDoc.querySelector("#termsAndConditionsLink")).not.toBeNull();
  });

  it("only includes the Adobe Launch tag when analytics is explicitly enabled — it's Samsung's live production tag and actively rewrites/clears the page outside Samsung's own site", () => {
    const form = sampleFormDefinition();
    const withoutAnalytics = buildFfHtml(form, defaultBuilderConfig(), resolveFileNames(form, defaultBuilderConfig()));
    expect(withoutAnalytics.contents).not.toContain("assets.adobedtm.com");

    const withAnalyticsConfig: BuilderConfig = {
      ...defaultBuilderConfig(),
      analytics: { enabled: true, reportSuiteID: "rs", imsOrgID: "org", datastreamID: "ds" },
    };
    const withAnalytics = buildFfHtml(form, withAnalyticsConfig, resolveFileNames(form, withAnalyticsConfig));
    expect(withAnalytics.contents).toContain("assets.adobedtm.com");
  });
});

describe("per-question variant visibility (visibleInVariants)", () => {
  it("filters question modules independently per variant, and renders both when unset (Excel-sourced-form back-compat)", () => {
    const form = sampleFormDefinition();
    // Fixture ships 3 questions (Q1/Q2/Q3), unset visibleInVariants by default.
    form.questions[0].visibleInVariants = ["ff"];
    form.questions[1].visibleInVariants = ["oc"];
    // Q3 stays unset — must still appear in both variants.
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);

    const ffDoc = new DOMParser().parseFromString(buildFfHtml(form, config, fileNames).contents, "text/html");
    expect(ffDoc.querySelector("#Q1")).not.toBeNull();
    expect(ffDoc.querySelector("#Q2")).toBeNull();
    expect(ffDoc.querySelector("#Q3")).not.toBeNull();

    const ocDoc = new DOMParser().parseFromString(buildOcHtml(form, config, fileNames).contents, "text/html");
    expect(ocDoc.querySelector("#Q1")).toBeNull();
    expect(ocDoc.querySelector("#Q2")).not.toBeNull();
    expect(ocDoc.querySelector("#Q3")).not.toBeNull();
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

    expect(doc.querySelector("#email")).toBeNull();
    expect(doc.querySelector("#firstName")).toBeNull();
    expect(doc.querySelector("#callingCode")).not.toBeNull();
    expect(doc.querySelector("#privacyPolicy")).toBeNull();
    expect(doc.querySelector(".form_bottom_bar#formBottomBar")).not.toBeNull();
    expect(doc.querySelector(".form_bottom_group")).toBeNull();
    expect(doc.querySelector(".container_oc")).not.toBeNull();
    // OC-only heading the reference's setPageContent()/setFieldData() write into.
    expect(doc.querySelector(".top_cont h2 span")).not.toBeNull();
  });
});
