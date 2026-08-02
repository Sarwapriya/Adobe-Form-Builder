// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveFileNames } from "../../src/codegen/fileNames.ts";
import { buildFfHtml } from "../../src/codegen/html/buildFfHtml.ts";
import { buildOcHtml } from "../../src/codegen/html/buildOcHtml.ts";
import { buildDataJs } from "../../src/codegen/js/buildDataJs.ts";
import { buildFfJs } from "../../src/codegen/js/buildFfJs.ts";
import { buildOcJs } from "../../src/codegen/js/buildOcJs.ts";
import { defaultBuilderConfig, type BuilderConfig } from "../../src/codegen/types.ts";
import { sampleFormDefinition } from "./fixtures.ts";

// buildFfJs.ts/buildOcJs.ts return the byte-identical reference scripts (see
// Final_forms_format/SGE-EN_F2H26_FF.js/_OC.js) — jQuery/Parsley/libphonenumber-js are
// always loaded via CDN in the real generated HTML, so these tests load the same
// libraries' real dist bundles into jsdom (exactly like a browser executing the
// equivalent <script src> tags) before window.eval-ing the generated script, instead
// of stubbing them out. This proves the actual, unmodified reference script — not a
// reimplementation of it — works against the HTML/data this builder generates.
const JQUERY_SRC = readFileSync(resolve(process.cwd(), "node_modules/jquery/dist/jquery.js"), "utf-8");
const PARSLEY_SRC = readFileSync(resolve(process.cwd(), "node_modules/parsleyjs/dist/parsley.js"), "utf-8");
const LIBPHONENUMBER_SRC = readFileSync(
  resolve(process.cwd(), "node_modules/libphonenumber-js/bundle/libphonenumber-js.min.js"),
  "utf-8",
);

/** Runs the data file then the variant's (byte-identical reference) JS in the real
 * global scope (indirect eval — the same effect as a browser executing the CDN +
 * generated <script> tags in order), against a DOM built from the actual generated
 * HTML body. jQuery defers its "document already loaded" ready callback by one tick
 * (`window.setTimeout(jQuery.ready)`, even when `document.readyState === "complete"`),
 * so callers must await this before asserting on the populated DOM. */
async function runGeneratedBundle(htmlContents: string, dataJsContents: string, behaviorJsContents: string) {
  const doc = new DOMParser().parseFromString(htmlContents, "text/html");
  document.documentElement.innerHTML = doc.documentElement.innerHTML;
  for (const attr of Array.from(doc.documentElement.attributes)) {
    document.documentElement.setAttribute(attr.name, attr.value);
  }
  window.eval(JQUERY_SRC);
  window.eval(PARSLEY_SRC);
  window.eval(LIBPHONENUMBER_SRC);
  // The data file declares `const page_error/fields/questions/...` and the behavior
  // script reads them as bare globals — real browsers share one lexical/global scope
  // across separate <script> tags, so this works in the actual generated output, but
  // this jsdom+vitest harness's `window.eval()` does not carry `const`/`let` bindings
  // across *separate* eval calls the way it would across real <script> elements. Eval
  // them together in one call so the reference script can see the data file's consts,
  // same as it would in a real page.
  window.eval(`${dataJsContents}\n${behaviorJsContents}`);
  // jQuery's deferred ready callback runs synchronously once `$.isReady` flips true
  // (which itself is scheduled via `window.setTimeout`, even when the document was
  // already "complete"), so poll for that instead of assuming a fixed tick count.
  await vi.waitFor(() => expect((window as any).$.isReady).toBe(true));
}

describe("generated bundle (ff.html + data file + FF js) wired together", () => {
  it("populates question headings and answer text at runtime", async () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const html = buildFfHtml(form, config, fileNames);
    const dataJs = buildDataJs(form, config, fileNames);
    const ffJs = buildFfJs(fileNames);

    await runGeneratedBundle(html.contents, dataJs.contents, ffJs.contents);

    expect(document.documentElement.getAttribute("lang")).toBe("en");
    expect(document.querySelector("#Q1 .form_check_title h3")?.textContent).toContain("I am currently using");
    expect(document.querySelector("label[for='Q1A1'] p")?.textContent).toBe("Galaxy");
    expect(document.querySelector("#btnSubmit")?.textContent).toBe("Submit");
  });

  it("updates <html lang> from ?lang=, but leaves dir alone (the reference has no RTL handling at all)", async () => {
    const originalLocation = window.location.href;
    window.history.pushState({}, "", "/ff.html?lang=ar_AE");
    try {
      const form = sampleFormDefinition();
      const config = defaultBuilderConfig();
      const fileNames = resolveFileNames(form, config);
      const html = buildFfHtml(form, config, fileNames);
      const dataJs = buildDataJs(form, config, fileNames);
      const ffJs = buildFfJs(fileNames);

      await runGeneratedBundle(html.contents, dataJs.contents, ffJs.contents);

      expect(document.documentElement.getAttribute("lang")).toBe("ar");
      // dir was set once at generation time from the form's default locale (en_GB,
      // LTR) — the byte-identical reference script never touches it at runtime.
      expect(document.documentElement.getAttribute("dir")).toBe("ltr");
      expect(document.querySelector("#Q1 .form_check_title h3")?.textContent).toContain("أنا أستخدم حاليًا");
    } finally {
      window.history.pushState({}, "", originalLocation);
    }
  });

  it("leaves the submit button disabled until privacyPolicy + Q1's first answer are checked", async () => {
    const form = sampleFormDefinition();
    form.fields.privacyPolicy = { textByLocale: { en_GB: "I agree" }, linkUrlByLocale: { en_GB: "https://x" } };
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const html = buildFfHtml(form, config, fileNames);
    const dataJs = buildDataJs(form, config, fileNames);
    const ffJs = buildFfJs(fileNames);

    await runGeneratedBundle(html.contents, dataJs.contents, ffJs.contents);

    const btn = document.getElementById("btnSubmit") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);

    (document.getElementById("privacyPolicy") as HTMLInputElement).checked = true;
    (document.getElementById("Q1A1") as HTMLInputElement).checked = true;
    document.getElementById("privacyPolicy")!.dispatchEvent(new Event("change", { bubbles: true }));
    document.getElementById("Q1A1")!.dispatchEvent(new Event("change", { bubbles: true }));

    expect(btn.disabled).toBe(false);
  });

  it("populates the countryCode/callingCode dropdowns from the full country_subsidiary/subsidiary_detail tables, resolved from the active locale's country", async () => {
    const originalLocation = window.location.href;
    window.history.pushState({}, "", "/ff.html?lang=ar_AE");
    try {
      const form = sampleFormDefinition();
      form.fields.countryCode = { labelByLocale: { en_GB: "Country", ar_AE: "الدولة" } };
      form.fields.callingCode = {
        labelByLocale: { en_GB: "Mobile No.", ar_AE: "رقم الجوال" },
        dropdownFirstEntryByLocale: { en_GB: "Select country", ar_AE: "اختر" },
      };
      const config = defaultBuilderConfig();
      const fileNames = resolveFileNames(form, config);
      const html = buildFfHtml(form, config, fileNames);
      const dataJs = buildDataJs(form, config, fileNames);
      const ffJs = buildFfJs(fileNames);

      await runGeneratedBundle(html.contents, dataJs.contents, ffJs.contents);

      // "ar_AE" -> countryCode "AE" -> country_subsidiary["AE"] = "SGE" -> subsidiary_detail.SGE.
      const countrySelect = document.getElementById("countryCode") as HTMLSelectElement;
      const options = Array.from(countrySelect.options).map((o) => o.value);
      expect(options.sort()).toEqual(["AE", "BH", "KW", "OM", "QA"]);
      expect(countrySelect.value).toBe("AE");

      const callingSelect = document.getElementById("callingCode") as HTMLSelectElement;
      const callingOption = Array.from(callingSelect.options).find((o) => o.value === "971");
      expect(callingOption).toBeDefined();
    } finally {
      window.history.pushState({}, "", originalLocation);
    }
  });

  describe("submission payload", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchMock = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("builds the mapped API payload (project/channel/source/q01Answer) and posts it on submit", async () => {
      const form = sampleFormDefinition();
      form.fields.privacyPolicy = { textByLocale: { en_GB: "I agree" }, linkUrlByLocale: { en_GB: "https://x" } };
      const config: BuilderConfig = {
        ...defaultBuilderConfig(),
        apiEndpoint: "https://example.test/api",
        project: "PRJ1",
        channel: { fullForm: "COM", oneClick: "EMAIL" },
        channelDetail: { fullForm: "COMD", oneClick: "EMAILD" },
        source: { fullForm: "full_form", oneClick: "one_click" },
        voucherRequired: "Y",
      };
      const fileNames = resolveFileNames(form, config);
      const html = buildFfHtml(form, config, fileNames);
      const dataJs = buildDataJs(form, config, fileNames);
      const ffJs = buildFfJs(fileNames);

      await runGeneratedBundle(html.contents, dataJs.contents, ffJs.contents);

      (document.getElementById("email") as HTMLInputElement).value = "a@b.com";
      (document.getElementById("privacyPolicy") as HTMLInputElement).checked = true;
      (document.getElementById("Q1A1") as HTMLInputElement).checked = true;
      (document.getElementById("Q2A1") as HTMLInputElement).checked = true;

      // jsdom doesn't implement HTMLFormElement's native submit()/requestSubmit(), so
      // dispatch the "submit" DOM event directly — Parsley binds its own submit
      // interception to that same event, validates, and (once valid) internally
      // triggers "form:submit", which the reference script listens for.
      const dataForm = document.getElementById("dataForm") as HTMLFormElement;
      dataForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());

      const [endpoint, init] = fetchMock.mock.calls[0];
      expect(endpoint).toBe("https://example.test/api");
      const body = JSON.parse(init.body);
      expect(body.project).toBe("PRJ1");
      expect(body.channel).toBe("COM");
      expect(body.channel_detail).toBe("COMD");
      expect(body.source).toBe("full_form");
      expect(body.VoucherRequired).toBe("Y");
      expect(body.oneclickFlag).toBe("N");
      expect(body.q01Answer).toBe("A1");
      expect(body.q02Answer).toBe("A1");
      expect(body.q03Answer).toBe("");
      expect(body.email).toBe("a@b.com");
      expect(body.privacy_policy_yn).toBe("Y");
      expect(body.submitFlag).toBe("Y");
    });
  });
});

describe("generated bundle (oc.html + data file + OC js) wired together", () => {
  it("omits email/firstName from the DOM and populates the calling-code dropdown", async () => {
    const form = sampleFormDefinition();
    form.meta.defaultLocale = "en_GB";
    form.fields.callingCode = { labelByLocale: { en_GB: "Mobile No." }, dropdownFirstEntryByLocale: { en_GB: "Select country" } };
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const html = buildOcHtml(form, config, fileNames);
    const dataJs = buildDataJs(form, config, fileNames);
    const ocJs = buildOcJs(fileNames);

    const originalLocation = window.location.href;
    window.history.pushState({}, "", "/oc.html?id=recipient-1&lang=ar_AE");
    try {
      await runGeneratedBundle(html.contents, dataJs.contents, ocJs.contents);
      expect(document.getElementById("email")).toBeNull();
      expect(document.querySelectorAll("#callingCode option").length).toBeGreaterThan(1);
    } finally {
      window.history.pushState({}, "", originalLocation);
    }
  });

  it("preselects Q1's answer from ?q01=, matching the reference OC script's behavior", async () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const html = buildOcHtml(form, config, fileNames);
    const dataJs = buildDataJs(form, config, fileNames);
    const ocJs = buildOcJs(fileNames);

    const originalLocation = window.location.href;
    window.history.pushState({}, "", "/oc.html?id=recipient-1&q01=A1");
    try {
      await runGeneratedBundle(html.contents, dataJs.contents, ocJs.contents);
      expect((document.getElementById("Q1A1") as HTMLInputElement)?.checked).toBe(true);
    } finally {
      window.history.pushState({}, "", originalLocation);
    }
  });

  it("shows the error page when ?id= (recipientId) is missing, matching the reference OC script", async () => {
    const form = sampleFormDefinition();
    const config = defaultBuilderConfig();
    const fileNames = resolveFileNames(form, config);
    const html = buildOcHtml(form, config, fileNames);
    const dataJs = buildDataJs(form, config, fileNames);
    const ocJs = buildOcJs(fileNames);

    const originalLocation = window.location.href;
    window.history.pushState({}, "", "/oc.html");
    try {
      await runGeneratedBundle(html.contents, dataJs.contents, ocJs.contents);
      expect((document.getElementById("hrErr") as HTMLElement).style.display).toBe("block");
    } finally {
      window.history.pushState({}, "", originalLocation);
    }
  });
});
