// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveFileNames } from "../../src/codegen/fileNames";
import { buildFfHtml } from "../../src/codegen/html/buildFfHtml";
import { buildOcHtml } from "../../src/codegen/html/buildOcHtml";
import { buildDataJs } from "../../src/codegen/js/buildDataJs";
import { buildFfJs } from "../../src/codegen/js/buildFfJs";
import { buildOcJs } from "../../src/codegen/js/buildOcJs";
import { defaultBuilderConfig, type BuilderConfig } from "../../src/codegen/types";
import { sampleFormDefinition } from "./fixtures";

// buildFfJs.ts/buildOcJs.ts return the byte-identical reference scripts (see
// Final_forms_format/SGE-EN_F2H26_FF.js/_OC.js) — jQuery/Parsley/libphonenumber-js are
// always loaded via CDN in the real generated HTML, so these tests load the same
// libraries' real dist bundles into jsdom (exactly like a browser executing the
// equivalent <script src> tags) before window.eval-ing the generated script, instead
// of stubbing them out. This proves the actual, unmodified reference script — not a
// reimplementation of it — works against the HTML/data this builder generates.
// Resolved via Node's own module algorithm (walks up node_modules from this file's
// location, so this keeps working regardless of which directory `vitest` is invoked
// from — e.g. `npm run test` scoped to this workspace, where cwd is packages/shared,
// not the repo root) rather than a process.cwd()-relative path. `require.resolve()`
// on the *file* subpath directly would work for a package with no "exports" map, but
// several of these packages' package.json "exports" don't list the dist/bundle path
// we need (only their main entry point) even though the file exists on disk — so this
// resolves each package's root directory (via its main-entry resolution, which is
// exports-map-compliant) and manually joins the on-disk subpath onto that root,
// mirroring what the old process.cwd()-relative path did, just cwd-independent.
const require = createRequire(import.meta.url);
function resolvePackageFile(packageName: string, relativeFile: string): string {
  const entryPoint = require.resolve(packageName);
  const marker = `node_modules${path.sep}${packageName}`;
  const packageRootEnd = entryPoint.lastIndexOf(marker) + marker.length;
  return path.join(entryPoint.slice(0, packageRootEnd), relativeFile);
}
const JQUERY_SRC = readFileSync(resolvePackageFile("jquery", "dist/jquery.js"), "utf-8");
const PARSLEY_SRC = readFileSync(resolvePackageFile("parsleyjs", "dist/parsley.js"), "utf-8");
const LIBPHONENUMBER_SRC = readFileSync(
  resolvePackageFile("libphonenumber-js", "bundle/libphonenumber-js.min.js"),
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

  it("updates <html lang> AND <html dir> at runtime from ?lang=, based on the reference's own hardcoded RTL-language list", async () => {
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
      // The reference script re-derives dir at runtime from the *viewed* locale's
      // language subtag (against its own hardcoded rtlLangs list), overriding
      // whatever pageTemplate.ts set at generation time from the form's default
      // locale — so a multi-locale form viewed with ?lang=ar_AE renders RTL even
      // when its default locale is LTR.
      expect(document.documentElement.getAttribute("dir")).toBe("rtl");
      expect(document.querySelector("#Q1 .form_check_title h3")?.textContent).toContain("أنا أستخدم حاليًا");
    } finally {
      window.history.pushState({}, "", originalLocation);
    }
  });

  it("leaves the submit button disabled until privacyPolicy + every required question (Q1 AND Q2 — see fixtures.ts) has an answer", async () => {
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

    // Q2 is also required but still unanswered — Submit must stay disabled
    // (this is exactly the gap that used to ship: only Q1 actually gated
    // Submit, regardless of what else was starred as required).
    expect(btn.disabled).toBe(true);

    (document.getElementById("Q2A1") as HTMLInputElement).checked = true;
    document.getElementById("Q2A1")!.dispatchEvent(new Event("change", { bubbles: true }));

    // Every required question (Q1, Q2) plus privacy are now satisfied — Q3
    // is optional (required: false), so it's irrelevant to this gate.
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

    it("renders, populates, and submits admin-added consent checkboxes generically (additionalConsents in the payload)", async () => {
      const form = sampleFormDefinition();
      form.fields.privacyPolicy = { textByLocale: { en_GB: "I agree" }, linkUrlByLocale: { en_GB: "https://x" } };
      form.fields.additionalConsents = [
        { id: "consentExtra1", order: 1, textByLocale: { en_GB: "I agree to the survey terms" }, linkUrlByLocale: { en_GB: "https://survey-terms" } },
        { id: "consentExtra2", order: 2, textByLocale: { en_GB: "Send me updates" } },
      ];
      const config: BuilderConfig = { ...defaultBuilderConfig(), apiEndpoint: "https://example.test/api" };
      const fileNames = resolveFileNames(form, config);
      const html = buildFfHtml(form, config, fileNames);
      const dataJs = buildDataJs(form, config, fileNames);
      const ffJs = buildFfJs(fileNames);

      await runGeneratedBundle(html.contents, dataJs.contents, ffJs.contents);

      // Text/link population is fully generic in the reference script (no changes
      // needed there) — confirm it actually reached both new checkboxes' labels.
      expect(document.querySelector("label[for='consentExtra1']")?.textContent).toContain("I agree to the survey terms");
      expect(document.querySelector("label[for='consentExtra1'] a")?.getAttribute("href")).toBe("https://survey-terms");
      expect(document.querySelector("label[for='consentExtra2']")?.textContent).toContain("Send me updates");
      expect(document.querySelector("label[for='consentExtra2'] a")).toBeNull();

      (document.getElementById("email") as HTMLInputElement).value = "a@b.com";
      (document.getElementById("privacyPolicy") as HTMLInputElement).checked = true;
      (document.getElementById("Q1A1") as HTMLInputElement).checked = true;
      (document.getElementById("Q2A1") as HTMLInputElement).checked = true;
      (document.getElementById("consentExtra1") as HTMLInputElement).checked = true;
      // consentExtra2 left unchecked on purpose.

      const dataForm = document.getElementById("dataForm") as HTMLFormElement;
      dataForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.additionalConsents).toEqual({ consentExtra1: "Y", consentExtra2: "N" });
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

  it("renders a required Privacy Policy consent when opted into One-Click, gates Submit on it, and reports its real checked state in the payload — previously impossible (the reference's own OC markup has consent permanently commented out)", async () => {
    const form = sampleFormDefinition();
    form.fields.privacyPolicy = {
      textByLocale: { en_GB: "I agree" },
      linkUrlByLocale: { en_GB: "https://x" },
      required: true,
      visibleInVariants: ["oc"],
    };
    const config: BuilderConfig = { ...defaultBuilderConfig(), apiEndpoint: "https://example.test/api" };
    const fileNames = resolveFileNames(form, config);
    const html = buildOcHtml(form, config, fileNames);
    const dataJs = buildDataJs(form, config, fileNames);
    const ocJs = buildOcJs(fileNames);

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const originalLocation = window.location.href;
    window.history.pushState({}, "", "/oc.html?id=recipient-1");
    try {
      await runGeneratedBundle(html.contents, dataJs.contents, ocJs.contents);

      expect(document.getElementById("privacyPolicy")).not.toBeNull();
      expect(document.querySelector("label[for='privacyPolicy'] .star")).not.toBeNull();

      (document.getElementById("Q1A1") as HTMLInputElement).checked = true;
      document.getElementById("Q1A1")!.dispatchEvent(new Event("change", { bubbles: true }));
      (document.getElementById("Q2A1") as HTMLInputElement).checked = true;
      document.getElementById("Q2A1")!.dispatchEvent(new Event("change", { bubbles: true }));

      // Every required question is answered but the required consent isn't checked
      // yet — Submit must stay disabled (the whole point of making it required).
      const btn = document.getElementById("btnSubmit") as HTMLButtonElement;
      expect(btn.disabled).toBe(true);

      (document.getElementById("privacyPolicy") as HTMLInputElement).checked = true;
      document.getElementById("privacyPolicy")!.dispatchEvent(new Event("change", { bubbles: true }));
      expect(btn.disabled).toBe(false);

      // OC also fires a background "register recipient" API call on page load
      // (processFormData(false), pre-existing/unrelated to this change) before any
      // user interaction, so the actual click-submit call isn't necessarily calls[0]
      // — find the one whose payload reflects a real click (submitFlag "Y").
      const dataForm = document.getElementById("dataForm") as HTMLFormElement;
      dataForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await vi.waitFor(() => {
        const submitCall = fetchMock.mock.calls.find((call) => JSON.parse(call[1].body).submitFlag === "Y");
        expect(submitCall).toBeDefined();
      });

      const submitCall = fetchMock.mock.calls.find((call) => JSON.parse(call[1].body).submitFlag === "Y")!;
      const body = JSON.parse(submitCall[1].body);
      expect(body.privacy_policy_yn).toBe("Y");
    } finally {
      window.history.pushState({}, "", originalLocation);
      vi.unstubAllGlobals();
    }
  });

  it("keeps the existing privacy_policy_yn/subscribe_yn=\"Y\" default when no consent is configured for One-Click (zero regression for forms that don't use this)", async () => {
    const form = sampleFormDefinition();
    // No privacyPolicy/marketingOptin at all — the pre-existing, default One-Click shape.
    const config: BuilderConfig = { ...defaultBuilderConfig(), apiEndpoint: "https://example.test/api" };
    const fileNames = resolveFileNames(form, config);
    const html = buildOcHtml(form, config, fileNames);
    const dataJs = buildDataJs(form, config, fileNames);
    const ocJs = buildOcJs(fileNames);

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const originalLocation = window.location.href;
    window.history.pushState({}, "", "/oc.html?id=recipient-1");
    try {
      await runGeneratedBundle(html.contents, dataJs.contents, ocJs.contents);
      expect(document.getElementById("privacyPolicy")).toBeNull();

      (document.getElementById("Q1A1") as HTMLInputElement).checked = true;
      document.getElementById("Q1A1")!.dispatchEvent(new Event("change", { bubbles: true }));
      (document.getElementById("Q2A1") as HTMLInputElement).checked = true;
      document.getElementById("Q2A1")!.dispatchEvent(new Event("change", { bubbles: true }));

      const dataForm = document.getElementById("dataForm") as HTMLFormElement;
      dataForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await vi.waitFor(() => {
        const submitCall = fetchMock.mock.calls.find((call) => JSON.parse(call[1].body).submitFlag === "Y");
        expect(submitCall).toBeDefined();
      });

      const submitCall = fetchMock.mock.calls.find((call) => JSON.parse(call[1].body).submitFlag === "Y")!;
      const body = JSON.parse(submitCall[1].body);
      expect(body.privacy_policy_yn).toBe("Y");
      expect(body.subscribe_yn).toBe("Y");
    } finally {
      window.history.pushState({}, "", originalLocation);
      vi.unstubAllGlobals();
    }
  });
});
