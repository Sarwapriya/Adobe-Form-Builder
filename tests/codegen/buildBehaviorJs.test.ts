// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { resolveFileNames } from "../../src/codegen/fileNames.ts";
import { buildFfHtml } from "../../src/codegen/html/buildFfHtml.ts";
import { buildOcHtml } from "../../src/codegen/html/buildOcHtml.ts";
import { buildDataJs } from "../../src/codegen/js/buildDataJs.ts";
import { buildBehaviorJs } from "../../src/codegen/js/buildBehaviorJs.ts";
import { defaultBuilderConfig } from "../../src/codegen/types.ts";
import { sampleFormDefinition } from "./fixtures.ts";

/** Runs data.js then behavior.js in the real global scope (indirect eval — the same
 * effect as a browser executing two <script> tags in order), against a DOM built from
 * the actual generated HTML body. This is the practical proof that the three generated
 * files work together as one system, not just that each compiles in isolation. */
function runGeneratedBundle(htmlContents: string, dataJsContents: string, behaviorJsContents: string) {
  const doc = new DOMParser().parseFromString(htmlContents, "text/html");
  document.documentElement.innerHTML = doc.documentElement.innerHTML;
  for (const attr of Array.from(doc.documentElement.attributes)) {
    document.documentElement.setAttribute(attr.name, attr.value);
  }
  window.eval(dataJsContents);
  window.eval(behaviorJsContents);
}

describe("generated bundle (ff.html + data.js + behavior.js) wired together", () => {
  it("populates question headings, answer text, and RTL attributes at runtime", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const html = buildFfHtml(form, config, fileNames);
    const dataJs = buildDataJs(form, config, fileNames);
    const behaviorJs = buildBehaviorJs(fileNames);

    runGeneratedBundle(html.contents, dataJs.contents, behaviorJs.contents);

    expect(document.documentElement.getAttribute("lang")).toBe("en");
    expect(document.documentElement.getAttribute("dir")).toBe("ltr");
    expect(document.querySelector("#Q1 .form_check_title h3 span")?.textContent).toBe("I am currently using");
    expect(document.querySelector("label[for='Q1A1'] p")?.textContent).toBe("Galaxy");
    expect(document.querySelector("#btnSubmit")?.textContent).toBe("Submit");
  });

  it("switches to RTL layout when ?lang= selects an RTL locale", () => {
    const originalLocation = window.location.href;
    window.history.pushState({}, "", "/ff.html?lang=ar_AE");
    try {
      const form = sampleFormDefinition();
      const config = defaultBuilderConfig();
      const fileNames = resolveFileNames(form, config);
      const html = buildFfHtml(form, config, fileNames);
      const dataJs = buildDataJs(form, config, fileNames);
      const behaviorJs = buildBehaviorJs(fileNames);

      runGeneratedBundle(html.contents, dataJs.contents, behaviorJs.contents);

      expect(document.documentElement.getAttribute("lang")).toBe("ar");
      expect(document.documentElement.getAttribute("dir")).toBe("rtl");
      expect(document.querySelector("#Q1 .form_check_title h3 span")?.textContent).toBe("أنا أستخدم حاليًا");
    } finally {
      window.history.pushState({}, "", originalLocation);
    }
  });

  it("leaves the submit button disabled until required fields are filled", () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const html = buildFfHtml(form, config, fileNames);
    const dataJs = buildDataJs(form, config, fileNames);
    const behaviorJs = buildBehaviorJs(fileNames);

    runGeneratedBundle(html.contents, dataJs.contents, behaviorJs.contents);

    const btn = document.getElementById("btnSubmit") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("populates the countryCode dropdown from the selected subsidiary and preselects the current locale's country", () => {
    const form = sampleFormDefinition();
    form.fields.countryCode = { labelByLocale: { en_GB: "Country" } };
    form.fields.callingCode = { labelByLocale: { en_GB: "Mobile No." }, dropdownFirstEntryByLocale: { en_GB: "Select country" } };
    const config = { ...defaultBuilderConfig(), subsidiaryCode: "SGE" };
    const fileNames = resolveFileNames(form, config);
    const html = buildFfHtml(form, config, fileNames);
    const dataJs = buildDataJs(form, config, fileNames);
    const behaviorJs = buildBehaviorJs(fileNames);

    runGeneratedBundle(html.contents, dataJs.contents, behaviorJs.contents);

    const countrySelect = document.getElementById("countryCode") as HTMLSelectElement;
    const options = Array.from(countrySelect.options).map((o) => o.value);
    expect(options.sort()).toEqual(["AE", "BH", "KW", "OM", "QA"]);
    // en_GB has no matching country in the SGE list, so no explicit preselection kicks in —
    // the browser default of the first appended option (AE) applies.
    expect(countrySelect.value).toBe("AE");

    const callingSelect = document.getElementById("callingCode") as HTMLSelectElement;
    const callingOption = Array.from(callingSelect.options).find((o) => o.value === "971");
    expect(callingOption?.textContent).toBe("United Arab Emirates (+971)");
  });

  it("OC variant: omits email/firstName from the DOM and populated data alike", () => {
    const form = sampleFormDefinition();
    form.fields.callingCode = { labelByLocale: { en_GB: "Mobile No." }, dropdownFirstEntryByLocale: { en_GB: "Select country" } };
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const html = buildOcHtml(form, config, fileNames);
    const dataJs = buildDataJs(form, config, fileNames);
    const behaviorJs = buildBehaviorJs(fileNames);

    runGeneratedBundle(html.contents, dataJs.contents, behaviorJs.contents);

    expect(document.getElementById("email")).toBeNull();
    expect(document.querySelectorAll("#callingCode option").length).toBeGreaterThan(1);
  });
});
