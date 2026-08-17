// @vitest-environment node
import { describe, expect, it } from "vitest";
import { resolveFileNames } from "../../src/codegen/fileNames";
import { buildDataJs } from "../../src/codegen/js/buildDataJs";
import { defaultBuilderConfig, type BuilderConfig } from "../../src/codegen/types";
import { sampleFormDefinition } from "./fixtures";

function buildFile(config: BuilderConfig = defaultBuilderConfig()) {
  const form = sampleFormDefinition();
  return buildDataJs(form, config, resolveFileNames(form, config));
}

/** Evaluates the generated bare `const`s (page_error/fields/questions/answers/
 * validation_messages/country_subsidiary/subsidiary_detail/param — the same names the
 * byte-identical reference FF.js/OC.js read) and returns them as one object, so tests
 * can assert on them without re-declaring the reference's exact variable list inline. */
function evalData(contents: string) {
  // eslint-disable-next-line no-new-func
  return new Function(
    `${contents}\nreturn { page_error, fields, questions, answers, validation_messages, country_subsidiary, subsidiary_detail, param };`,
  )();
}

describe("buildDataJs", () => {
  it("produces a data file whose body is valid, safely-embeddable JS declaring the reference's bare const names", () => {
    const file = buildFile();
    expect(file.path).toBe("TEST-EN.js");
    expect(file.contents).toContain("const page_error = ");
    expect(file.contents).toContain("const fields = ");
    expect(file.contents).toContain("const questions = ");
    expect(file.contents).toContain("const answers = ");
    expect(file.contents).toContain("const validation_messages = ");
    expect(file.contents).toContain("const country_subsidiary = ");
    expect(file.contents).toContain("const subsidiary_detail = ");
    expect(file.contents).toContain("const param = ");

    const data = evalData(file.contents);
    expect(data.questions.en_GB.Q1.heading).toBe("I am currently using");
    expect(data.questions.ar_AE.Q1.heading).toBe("أنا أستخدم حاليًا");
    expect(data.answers.en_GB.Q1.A1).toBe("Galaxy");
  });

  it("never emits a raw </script> sequence that could break out of the enclosing tag", () => {
    const file = buildFile();
    expect(file.contents.toLowerCase()).not.toContain("</script>alert");
  });

  it("preserves XSS-payload text losslessly once safely evaluated back out", () => {
    const file = buildFile();
    const data = evalData(file.contents);
    expect(data.questions.en_GB.Q2.heading).toBe("Which do you like? <script>alert(1)</script>");
    expect(data.answers.en_GB.Q2.A1).toBe('"; maliciousCode(); //');
  });

  it("falls back to the default locale for any text missing in a locale (e.g. Q2/Q3 have no Arabic)", () => {
    const file = buildFile();
    const data = evalData(file.contents);
    expect(data.questions.ar_AE.Q2.heading).toBe("Which do you like? <script>alert(1)</script>");
    expect(data.fields.ar_AE.submitButton).toBe("إرسال");
  });

  it("omits profile fields that were never present in the source (firstName/lastName absent)", () => {
    const file = buildFile();
    const data = evalData(file.contents);
    expect(data.fields.en_GB.label.email).toBe("E-mail");
    expect(data.fields.en_GB.label.firstName).toBe("");
  });

  it("leaves apiEndpoint blank and analytics disabled by default (no hardcoded Samsung endpoint)", () => {
    const file = buildFile();
    const data = evalData(file.contents);
    expect(data.param.apiEndpoint).toBe("");
    expect(data.param.analytics.enabled).toBe(false);
  });

  it("embeds the full country_subsidiary/subsidiary_detail tables (not filtered to one subsidiary)", () => {
    const file = buildFile();
    const data = evalData(file.contents);
    expect(data.country_subsidiary.AE).toBe("SGE");
    expect(Array.isArray(data.subsidiary_detail.SGE)).toBe(true);
    expect(data.subsidiary_detail.SGE.some((c: { countryCode: string }) => c.countryCode === "AE")).toBe(true);
  });

  it("projects termsAndConditions text/url per locale, and leaves both blank when unset", () => {
    const emptyFile = buildFile();
    const emptyData = evalData(emptyFile.contents);
    expect(emptyData.fields.en_GB.termsAndConditions).toBe("");
    expect(emptyData.fields.en_GB.termsAndConditionsLink.url).toBe("");

    const form = sampleFormDefinition();
    form.fields.termsAndConditions = {
      textByLocale: { en_GB: "* Terms and conditions apply." },
      urlByLocale: { en_GB: "https://example.com/terms.pdf" },
    };
    const config = defaultBuilderConfig();
    const file = buildDataJs(form, config, resolveFileNames(form, config));
    const data = evalData(file.contents);
    expect(data.fields.en_GB.termsAndConditions).toBe("* Terms and conditions apply.");
    expect(data.fields.en_GB.termsAndConditionsLink.url).toBe("https://example.com/terms.pdf");
    // Falls back to the default locale, same as every other localized field.
    expect(data.fields.ar_AE.termsAndConditions).toBe("* Terms and conditions apply.");
  });

  it("threads project/channel/channelDetail/source/voucherRequired from BuilderConfig into param", () => {
    const config: BuilderConfig = {
      ...defaultBuilderConfig(),
      project: "F2H26",
      channel: { fullForm: "COM", oneClick: "EMAIL" },
      channelDetail: { fullForm: "COMD", oneClick: "EMAILD" },
      source: { fullForm: "full_form", oneClick: "one_click" },
      voucherRequired: "Y",
    };
    const file = buildFile(config);
    const data = evalData(file.contents);
    expect(data.param.project).toBe("F2H26");
    expect(data.param.channel).toEqual({ fullForm: "COM", oneClick: "EMAIL" });
    expect(data.param.channelDetail).toEqual({ fullForm: "COMD", oneClick: "EMAILD" });
    expect(data.param.source).toEqual({ fullForm: "full_form", oneClick: "one_click" });
    expect(data.param.voucherRequired).toBe("Y");
  });
});
