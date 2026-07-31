// @vitest-environment node
import { describe, expect, it } from "vitest";
import { resolveFileNames } from "../../src/codegen/fileNames.ts";
import { buildDataJs } from "../../src/codegen/js/buildDataJs.ts";
import { defaultBuilderConfig, type BuilderConfig } from "../../src/codegen/types.ts";
import { sampleFormDefinition } from "./fixtures.ts";

function buildFile(config: BuilderConfig = defaultBuilderConfig()) {
  const form = sampleFormDefinition();
  return buildDataJs(form, config, resolveFileNames(form, config));
}

describe("buildDataJs", () => {
  it("produces a data.js file whose body is valid, safely-embeddable JS", () => {
    const file = buildFile();
    expect(file.path).toBe("TEST-EN.js");
    expect(file.contents.startsWith("var FORM_DATA = ")).toBe(true);

    // eslint-disable-next-line no-new-func
    const FORM_DATA = new Function(`${file.contents}\nreturn FORM_DATA;`)();
    expect(FORM_DATA.questions.en_GB.Q1.heading).toBe("I am currently using");
    expect(FORM_DATA.questions.ar_AE.Q1.heading).toBe("أنا أستخدم حاليًا");
    expect(FORM_DATA.answers.en_GB.Q1.A1).toBe("Galaxy");
  });

  it("never emits a raw </script> sequence that could break out of the enclosing tag", () => {
    const file = buildFile();
    expect(file.contents.toLowerCase()).not.toContain("</script>alert");
  });

  it("preserves XSS-payload text losslessly once safely evaluated back out", () => {
    const file = buildFile();
    // eslint-disable-next-line no-new-func
    const FORM_DATA = new Function(`${file.contents}\nreturn FORM_DATA;`)();
    expect(FORM_DATA.questions.en_GB.Q2.heading).toBe("Which do you like? <script>alert(1)</script>");
    expect(FORM_DATA.answers.en_GB.Q2.A1).toBe('"; maliciousCode(); //');
  });

  it("falls back to the default locale for any text missing in a locale (e.g. Q2/Q3 have no Arabic)", () => {
    const file = buildFile();
    // eslint-disable-next-line no-new-func
    const FORM_DATA = new Function(`${file.contents}\nreturn FORM_DATA;`)();
    expect(FORM_DATA.questions.ar_AE.Q2.heading).toBe("Which do you like? <script>alert(1)</script>");
    expect(FORM_DATA.fields.ar_AE.submitButton).toBe("إرسال");
  });

  it("omits profile fields that were never present in the source (firstName/lastName absent)", () => {
    const file = buildFile();
    // eslint-disable-next-line no-new-func
    const FORM_DATA = new Function(`${file.contents}\nreturn FORM_DATA;`)();
    expect(FORM_DATA.fields.en_GB.label.email).toBe("E-mail");
    expect(FORM_DATA.fields.en_GB.label.firstName).toBeUndefined();
  });

  it("leaves apiEndpoint blank and analytics disabled by default (no hardcoded Samsung endpoint)", () => {
    const file = buildFile();
    // eslint-disable-next-line no-new-func
    const FORM_DATA = new Function(`${file.contents}\nreturn FORM_DATA;`)();
    expect(FORM_DATA.param.apiEndpoint).toBe("");
    expect(FORM_DATA.param.analytics.enabled).toBe(false);
  });

  it("includes a generic calling_codes table, not Samsung's subsidiary-routing table", () => {
    const file = buildFile();
    // eslint-disable-next-line no-new-func
    const FORM_DATA = new Function(`${file.contents}\nreturn FORM_DATA;`)();
    expect(Array.isArray(FORM_DATA.calling_codes)).toBe(true);
    expect(FORM_DATA.calling_codes.some((c: { countryCode: string }) => c.countryCode === "AE")).toBe(true);
  });
});
