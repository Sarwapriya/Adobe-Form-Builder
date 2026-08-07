import type { Page } from "playwright";
import type { QaCheckResult } from "./types";

/**
 * Generic, DOM-driven Playwright checks against one already-loaded generated
 * form page. Nothing here is hand-written per uploaded form — every check
 * enumerates whatever fields/questions actually exist in the page (via the
 * embedded data.js globals and the reference codegen's own DOM-id/attribute
 * conventions — see packages/shared/src/codegen/domIds.ts, html/fragments/,
 * and the reference FF/OC scripts, which this file's assertions are grounded
 * in directly, not guessed) so the same suite runs unmodified against any
 * upload's generated output.
 *
 * Known, intentional facts about the generated forms this file relies on:
 *  - Profile fields (email/firstName/lastName/mobileNumber/callingCode) are
 *    the only Parsley-validated inputs — attributes read directly off the
 *    DOM (`data-parsley-required`, `data-parsley-type`, `data-parsley-pattern`)
 *    rather than hardcoded per field name.
 *  - Question/answer inputs (Q<n>/Q<n>A<n>) carry NO Parsley validation at
 *    all, regardless of the question's "required" star marker — the
 *    reference's own `enableDisableSubmit()` only ever gates the Submit
 *    button on Q1's first three answers (plus #privacyPolicy on the FF
 *    variant only; the OC variant has no privacy checkbox at all). A
 *    required-starred question with no enforcement is flagged as its own
 *    failed check (see checkRequiredEnforcement) — a real, verifiable defect
 *    in what ships, not a false positive.
 *  - Parsley toggles a `parsley-error` class directly on the field element
 *    itself on failed validation (core Parsley behavior, unaffected by the
 *    reference script's own custom repositioning of the *message* element) —
 *    that class is what every field-validation check below reads, rather
 *    than hunting for the message text's DOM position.
 */

export interface FormManifest {
  /** `param.fallbackLanguage` from the embedded data.js — the locale the
   * `questions`/`answers` globals are keyed under. Undefined if the data.js
   * globals couldn't be read at all (treated as a structural failure). */
  locale: string | undefined;
  questionIds: string[];
  answersByQuestion: Record<string, string[]>;
}

const PROFILE_FIELD_IDS = ["email", "firstName", "lastName", "mobileNumber", "callingCode"];

function pass(category: QaCheckResult["category"], name: string, fieldId?: string | null): QaCheckResult {
  return { category, name, status: "passed", fieldId: fieldId ?? null, message: null };
}

function fail(category: QaCheckResult["category"], name: string, message: string, fieldId?: string | null): QaCheckResult {
  return { category, name, status: "failed", fieldId: fieldId ?? null, message };
}

/**
 * Toggles a checkbox/radio input to the desired checked state by clicking
 * its associated `<label for="...">` rather than the input itself. This
 * design system visually hides every native checkbox/radio input behind a
 * styled label (a standard pattern — see renderQuestionModule.ts, which
 * emits a `<label for="{inputId}">` alongside every answer input, and
 * pageTemplate.ts's #privacyPolicy/#subscribe), so the input never has a
 * real bounding box for Playwright's actionability checks — even
 * `{ force: true }` can't bypass that, since it still requires *some*
 * layout box to click. Clicking the (genuinely visible) label instead relies
 * on plain native HTML label-click-toggles-control behavior, unrelated to
 * the input's own CSS visibility, and still dispatches the real `change`
 * event the reference JS's own listeners depend on.
 */
async function setCheckedViaLabel(page: Page, id: string, desired: boolean): Promise<void> {
  const input = page.locator(`#${id}`);
  if ((await input.isChecked()) === desired) return;
  // force:true as a defensive fallback only — the label itself is expected
  // to be genuinely visible/stable, but this avoids a hard failure if a
  // particular form's CSS styles it in some unusual way.
  await page.locator(`label[for="${id}"]`).click({ force: true });
}

/** Waits for jQuery + ParsleyJS (loaded from CDN — see pageTemplate.ts's
 * CDN_SCRIPTS) to actually finish loading, rather than a fixed delay. Every
 * later check depends on both being present, so a false result here should
 * short-circuit the rest of the run instead of producing misleading
 * downstream failures. */
export async function waitForClientLibraries(page: Page, timeoutMs = 20_000): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => typeof (window as unknown as { jQuery?: { fn?: { parsley?: unknown } } }).jQuery?.fn?.parsley !== "undefined",
      undefined,
      { timeout: timeoutMs },
    );
    return true;
  } catch {
    return false;
  }
}

// Ambient-only declarations (erased entirely at compile time — `declare`
// emits no JS) for the page's own embedded data.js top-level `const`s (see
// buildDataJs.ts). These are genuinely NOT `window` properties: a classic
// `<script>` tag's top-level `const`/`let` lives in the realm's script
// scope, not as a global-object property — so `getFormManifest`'s bare
// identifier references below are what actually resolves them at runtime
// inside the page; this just satisfies TypeScript at compile time.
declare const param: { fallbackLanguage?: string } | undefined;
declare const questions: Record<string, Record<string, unknown>> | undefined;
declare const answers: Record<string, Record<string, Record<string, unknown>>> | undefined;

/** Reads the question/answer manifest straight out of the page's own
 * embedded data.js globals (`param`, `questions`, `answers` — see
 * buildDataJs.ts) rather than re-parsing HTML, so question order/ids always
 * match exactly what the running page itself uses for lookups. */
export async function getFormManifest(page: Page): Promise<FormManifest> {
  return page.evaluate(() => {
    const locale = typeof param !== "undefined" ? param!.fallbackLanguage : undefined;
    const questionsForLocale = locale && typeof questions !== "undefined" ? questions![locale] : undefined;
    const answersForLocale = locale && typeof answers !== "undefined" ? answers![locale] : undefined;
    const questionIds = questionsForLocale ? Object.keys(questionsForLocale) : [];
    const answersByQuestion: Record<string, string[]> = {};
    for (const qId of questionIds) {
      const answerMap = answersForLocale?.[qId] as Record<string, unknown> | undefined;
      answersByQuestion[qId] = answerMap ? Object.keys(answerMap) : [];
    }
    return { locale, questionIds, answersByQuestion };
  });
}

/** Page-level structural checks: does it load cleanly, is the skeleton
 * (form, submit button, every question module) actually present. */
export async function checkStructure(page: Page, manifest: FormManifest, consoleErrors: string[]): Promise<QaCheckResult[]> {
  const results: QaCheckResult[] = [];

  results.push(
    consoleErrors.length === 0
      ? pass("structure", "Page loads without a JavaScript console error")
      : fail("structure", "Page loads without a JavaScript console error", consoleErrors.join("\n").slice(0, 1900)),
  );

  const title = await page.title();
  results.push(
    title.trim().length > 0
      ? pass("structure", "Page has a non-empty <title>")
      : fail("structure", "Page has a non-empty <title>", "Document title is empty"),
  );

  const formCount = await page.locator("#dataForm").count();
  results.push(
    formCount > 0 ? pass("structure", "Form element (#dataForm) is present") : fail("structure", "Form element (#dataForm) is present", "No #dataForm element found"),
  );

  const submitCount = await page.locator("#btnSubmit").count();
  results.push(
    submitCount > 0
      ? pass("structure", "Submit button (#btnSubmit) is present")
      : fail("structure", "Submit button (#btnSubmit) is present", "No #btnSubmit element found"),
  );

  if (submitCount > 0) {
    const initiallyDisabled = await page.locator("#btnSubmit").isDisabled();
    results.push(
      initiallyDisabled
        ? pass("structure", "Submit button starts disabled until required selections are made")
        : fail(
            "structure",
            "Submit button starts disabled until required selections are made",
            "#btnSubmit was not disabled on initial load",
          ),
    );
  }

  if (!manifest.locale || manifest.questionIds.length === 0) {
    results.push(
      fail(
        "structure",
        "Question/answer data (data.js globals) is readable",
        "Could not read `param`/`questions` globals from the generated data.js — either the file failed to load or this form has no questions at all",
      ),
    );
    return results;
  }
  results.push(pass("structure", "Question/answer data (data.js globals) is readable"));

  for (const questionId of manifest.questionIds) {
    const moduleCount = await page.locator(`.form_check_module#${questionId}`).count();
    results.push(
      moduleCount > 0
        ? pass("structure", `Question ${questionId} is rendered on the page`, questionId)
        : fail("structure", `Question ${questionId} is rendered on the page`, `No .form_check_module#${questionId} found`, questionId),
    );
  }

  return results;
}

/** Reads a profile field's own Parsley attributes off the DOM (never
 * hardcoded per field name), so this works unmodified whichever subset of
 * email/firstName/lastName/mobileNumber/callingCode a given upload actually
 * rendered (FF renders all five if the workbook defines them; OC only
 * renders callingCode). */
async function readParsleyAttrs(page: Page, id: string) {
  const locator = page.locator(`#${id}`);
  const [required, type, pattern, tag] = await Promise.all([
    locator.getAttribute("data-parsley-required"),
    locator.getAttribute("data-parsley-type"),
    locator.getAttribute("data-parsley-pattern"),
    locator.evaluate((el) => el.tagName.toLowerCase()),
  ]);
  return { required: required === "true", type, pattern, tag };
}

function pickValidSample(type: string | null): string {
  if (type === "email") return "qa.tester@example.com";
  if (type === "digits") return "5551234";
  return "QaTest";
}

function pickInvalidSample(type: string | null, pattern: string | null): string {
  if (type === "email") return "not-an-email";
  if (type === "digits") return "abcde";
  if (pattern) return "123!@#";
  return "###";
}

/** Triggers Parsley's real validation API for one field (not a simulated
 * blur — this is Parsley's own documented programmatic entry point, so it
 * behaves identically to what the reference script's blur-triggered
 * validation would do) and reports whether the field ends up flagged
 * `.parsley-error` — the class Parsley always toggles on the element itself
 * regardless of the reference script's own custom error-message
 * repositioning (see the module doc comment above). */
async function validateFieldViaParsley(page: Page, id: string): Promise<boolean> {
  await page.evaluate((fieldId) => {
    const $ = (window as unknown as { jQuery: (sel: string) => { parsley: () => { validate: () => unknown } } }).jQuery;
    $(`#${fieldId}`).parsley().validate();
  }, id);
  return page.locator(`#${id}`).evaluate((el) => el.classList.contains("parsley-error"));
}

/** For each profile field actually present on this page: required-blank
 * shows an error, a well-formed value clears it, and (where the field
 * declares a type/pattern) a malformed value shows an error again. */
export async function checkProfileFields(page: Page): Promise<QaCheckResult[]> {
  const results: QaCheckResult[] = [];

  for (const id of PROFILE_FIELD_IDS) {
    const count = await page.locator(`#${id}`).count();
    if (count === 0) continue;

    const attrs = await readParsleyAttrs(page, id);
    if (attrs.tag !== "input") continue; // e.g. callingCode is a <select>, not directly required itself

    if (attrs.required) {
      await page.locator(`#${id}`).fill("");
      const hasError = await validateFieldViaParsley(page, id);
      results.push(
        hasError
          ? pass("field-validation", `${id}: blank required field is rejected`, id)
          : fail("field-validation", `${id}: blank required field is rejected`, "Expected .parsley-error after validating an empty required field, found none", id),
      );
    }

    if (attrs.required || attrs.type || attrs.pattern) {
      const validSample = pickValidSample(attrs.type);
      await page.locator(`#${id}`).fill(validSample);
      const stillHasError = await validateFieldViaParsley(page, id);
      results.push(
        !stillHasError
          ? pass("field-validation", `${id}: accepts a well-formed value ("${validSample}")`, id)
          : fail(
              "field-validation",
              `${id}: accepts a well-formed value ("${validSample}")`,
              `Still flagged .parsley-error after entering "${validSample}"`,
              id,
            ),
      );
    }

    if (attrs.type || attrs.pattern) {
      const invalidSample = pickInvalidSample(attrs.type, attrs.pattern);
      await page.locator(`#${id}`).fill(invalidSample);
      const hasError = await validateFieldViaParsley(page, id);
      results.push(
        hasError
          ? pass("field-validation", `${id}: rejects a malformed value ("${invalidSample}")`, id)
          : fail(
              "field-validation",
              `${id}: rejects a malformed value ("${invalidSample}")`,
              `Expected .parsley-error after entering "${invalidSample}", found none`,
              id,
            ),
      );
      // Leave the field valid again for any later checks (submit-gating/flow)
      // that share this same page — a lingering invalid value would make an
      // unrelated later check fail for the wrong reason.
      await page.locator(`#${id}`).fill(pickValidSample(attrs.type));
      await validateFieldViaParsley(page, id);
    }
  }

  return results;
}

/** For each question: exercises whatever control type it actually rendered
 * as (textarea / radio / checkbox — determined from the DOM, not assumed)
 * and confirms interacting with it actually updates the DOM. */
export async function checkQuestionInteraction(page: Page, manifest: FormManifest): Promise<QaCheckResult[]> {
  const results: QaCheckResult[] = [];

  for (const questionId of manifest.questionIds) {
    const moduleLocator = page.locator(`.form_check_module#${questionId}`);
    if ((await moduleLocator.count()) === 0) continue;

    const textarea = moduleLocator.locator("textarea");
    if ((await textarea.count()) > 0) {
      const sample = "QA automated test answer";
      await textarea.fill(sample);
      const value = await textarea.inputValue();
      results.push(
        value === sample
          ? pass("field-interaction", `${questionId}: text answer can be typed`, questionId)
          : fail("field-interaction", `${questionId}: text answer can be typed`, `Expected value "${sample}", got "${value}"`, questionId),
      );
      continue;
    }

    const firstOption = moduleLocator.locator('input[type="radio"], input[type="checkbox"]').first();
    if ((await firstOption.count()) === 0) {
      results.push(
        fail("field-interaction", `${questionId}: has a selectable control`, "No textarea/radio/checkbox found inside this question module", questionId),
      );
      continue;
    }
    const optionId = await firstOption.getAttribute("id");
    await setCheckedViaLabel(page, optionId!, true);
    const checked = await firstOption.isChecked();
    results.push(
      checked
        ? pass("field-interaction", `${questionId}: an answer can be selected`, questionId)
        : fail("field-interaction", `${questionId}: an answer can be selected`, "Option did not become checked after clicking it", questionId),
    );
  }

  return results;
}

/** The reference codegen never emits any Parsley validation on question
 * inputs (see this file's module doc comment) — so a question whose "*"
 * required-marker is shown to the user is, in reality, not enforced at all
 * before the Submit button can be enabled. That's a genuine, user-visible
 * gap between what the form *looks* like it requires and what it actually
 * requires, so it's reported as a failed check per starred question rather
 * than silently accepted as "working as designed". */
export async function checkRequiredEnforcement(page: Page, manifest: FormManifest): Promise<QaCheckResult[]> {
  const results: QaCheckResult[] = [];

  for (const questionId of manifest.questionIds) {
    const starCount = await page.locator(`.form_check_module#${questionId} .form_check_title .star`).count();
    if (starCount === 0) continue;

    results.push(
      fail(
        "required-enforcement",
        `${questionId}: required marker is backed by real submit-blocking validation`,
        `${questionId} is shown as required ("*") but the generated form applies no client-side validation to question ` +
          "inputs at all (only the Submit button's Q1-answer/privacy gating, and Parsley on profile fields) — a user can " +
          `submit without answering ${questionId}.`,
        questionId,
      ),
    );
  }

  return results;
}

/** Mirrors the reference's own `enableDisableSubmit()` exactly: the FF
 * variant requires #privacyPolicy checked AND one of Q1's first three
 * answers checked; the OC variant (which never renders #privacyPolicy at
 * all) requires only the Q1 answer. Verified by reading both variants'
 * reference JS directly rather than assumed identical between them. */
export async function checkSubmitGating(page: Page): Promise<QaCheckResult[]> {
  const results: QaCheckResult[] = [];
  const submitLocator = page.locator("#btnSubmit");
  if ((await submitLocator.count()) === 0) return results;

  const hasPrivacyCheckbox = (await page.locator("#privacyPolicy").count()) > 0;
  const gatingAnswerIds = ["Q1A1", "Q1A2", "Q1A3"];
  const existingCounts = await Promise.all(gatingAnswerIds.map((id) => page.locator(`#${id}`).count()));
  const firstGatingAnswer = existingCounts.findIndex((c) => c > 0);

  if (firstGatingAnswer === -1) {
    results.push(
      fail(
        "submit-gating",
        "Submit button can be enabled",
        "This form has no Q1A1/Q1A2/Q1A3 answer inputs for the Submit button's gating logic to react to (enableDisableSubmit() hardcodes those three ids) — Submit can never be enabled",
      ),
    );
    return results;
  }
  const answerId = gatingAnswerIds[firstGatingAnswer];

  if (hasPrivacyCheckbox) {
    await setCheckedViaLabel(page, answerId, true);
    let stillDisabled = await submitLocator.isDisabled();
    results.push(
      stillDisabled
        ? pass("submit-gating", "Submit stays disabled until the privacy checkbox is also checked", answerId)
        : fail("submit-gating", "Submit stays disabled until the privacy checkbox is also checked", "Submit became enabled before #privacyPolicy was checked"),
    );

    await setCheckedViaLabel(page, "privacyPolicy", true);
    const enabled = await submitLocator.isDisabled();
    results.push(
      !enabled
        ? pass("submit-gating", "Submit becomes enabled once privacy + a Q1 answer are both set")
        : fail("submit-gating", "Submit becomes enabled once privacy + a Q1 answer are both set", "Submit is still disabled after checking privacy + a Q1 answer"),
    );

    await setCheckedViaLabel(page, "privacyPolicy", false);
    stillDisabled = await submitLocator.isDisabled();
    results.push(
      stillDisabled
        ? pass("submit-gating", "Submit re-disables when the privacy checkbox is unchecked")
        : fail("submit-gating", "Submit re-disables when the privacy checkbox is unchecked", "Submit stayed enabled after unchecking #privacyPolicy"),
    );
    await setCheckedViaLabel(page, "privacyPolicy", true);
  } else {
    await setCheckedViaLabel(page, answerId, true);
    const enabled = await submitLocator.isDisabled();
    results.push(
      !enabled
        ? pass("submit-gating", "Submit becomes enabled once a Q1 answer is set (no privacy checkbox on this variant)")
        : fail(
            "submit-gating",
            "Submit becomes enabled once a Q1 answer is set (no privacy checkbox on this variant)",
            "Submit is still disabled after checking a Q1 answer",
          ),
    );
  }

  return results;
}

/** Fills every currently-invalid required profile field with a valid sample
 * and satisfies submit-gating, without asserting anything itself — shared
 * setup for both submit-flow scenarios below, each of which needs a fresh
 * page (submit success empties `.container`, so the two scenarios can't
 * share a page). */
export async function satisfySubmitPreconditions(page: Page): Promise<void> {
  for (const id of PROFILE_FIELD_IDS) {
    const locator = page.locator(`#${id}`);
    if ((await locator.count()) === 0) continue;
    const attrs = await readParsleyAttrs(page, id);
    if (attrs.tag !== "input") continue;
    if (attrs.required) {
      await locator.fill(pickValidSample(attrs.type));
    }
  }

  const hasPrivacyCheckbox = (await page.locator("#privacyPolicy").count()) > 0;
  if (hasPrivacyCheckbox) await setCheckedViaLabel(page, "privacyPolicy", true);

  for (const answerId of ["Q1A1", "Q1A2", "Q1A3"]) {
    if ((await page.locator(`#${answerId}`).count()) > 0) {
      await setCheckedViaLabel(page, answerId, true);
      break;
    }
  }
}

/**
 * Installs the mocked POST response for the form's submit fetch(), and
 * tracks whether a top-level navigation is ever attempted afterward.
 *
 * That navigation flag is what checkSubmitFlowSuccess below actually uses to
 * detect success — not #hrTy's visibility. The reference's own showSuccess()
 * sets #hrTy visible and then, as the very next line in the same synchronous
 * function call, assigns `window.top.location.href` (blank in generic
 * generated output, so it self-reloads) — so a same-page navigation being
 * *attempted* at all is already conclusive proof showSuccess() ran, with no
 * async gap to race. Trying to instead observe #hrTy directly runs straight
 * into that reload: a completed navigation destroys the page's JS execution
 * context out from under any in-page poll (`page.waitForFunction` throws),
 * and simply leaving the navigation's request permanently unresolved
 * doesn't help either — Playwright's own auto-waiting blocks further
 * locator calls on a page with a navigation in flight, regardless. Reading
 * a plain Node-side boolean this route handler sets sidesteps all of that:
 * it's driven by Playwright's request event, never touches the page's
 * execution context, and can't be invalidated by whatever the page does
 * next.
 *
 * This is installed *after* the caller's own initial `page.goto()`
 * (checkSubmitFlowSuccess/Failure both run against an already-loaded page)
 * — so the very first document GET this handler ever sees cannot be that
 * original load, which already happened before this route existed. It can
 * only be the submit-triggered reload, so there's no "first vs. second"
 * count to get right — any document GET at all is the signal.
 */
async function mockSubmitResponse(page: Page, status: number): Promise<{ getNavigatedAgain: () => boolean }> {
  let navigatedAgain = false;
  await page.route("**/*", (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      void route.fulfill({ status, contentType: "application/json", body: "{}" });
      return;
    }
    if (request.method() === "GET" && request.resourceType() === "document") {
      navigatedAgain = true;
      void route.continue();
      return;
    }
    void route.continue();
  });
  return { getNavigatedAgain: () => navigatedAgain };
}

/** Dismisses the reference's own "are you sure you want to submit?"
 * confirmation popup if it appears (see validateModal()/showSubmitModal() —
 * it only shows when no question has been answered yet, which
 * satisfySubmitPreconditions avoids, so this is a defensive no-op in the
 * common case) and reports whether #apiError became visible. Deliberately
 * doesn't touch #hrTy — see mockSubmitResponse's doc comment for why that
 * one needs the navigation-flag approach instead. Every page interaction is
 * wrapped so a transient "execution context destroyed" error (the page
 * could still be mid-navigation from a previous check) just skips that
 * poll cycle rather than aborting the whole wait. */
async function pollSubmitOutcome(
  page: Page,
  getNavigatedAgain: () => boolean,
  timeoutMs = 10_000,
): Promise<"success" | "error" | "timeout"> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (getNavigatedAgain()) return "success";
    try {
      const popupYes = page.locator("#submitIntentPopupYes");
      if (await popupYes.isVisible()) {
        await popupYes.click({ force: true });
      }
      if (await page.locator("#apiError").isVisible()) return "error";
    } catch {
      // Page likely mid-navigation for a moment — ignore and keep polling.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return getNavigatedAgain() ? "success" : "timeout";
}

/** Clicks Submit with a mocked *successful* API response and confirms the
 * reference's own showSuccess() actually ran — proves the client-side
 * success path works without depending on any real backend endpoint
 * (param.apiEndpoint is blank in generic generated output). See
 * mockSubmitResponse's doc comment for why this checks for the resulting
 * redirect attempt rather than #hrTy's visibility directly. */
export async function checkSubmitFlowSuccess(page: Page): Promise<QaCheckResult[]> {
  const { getNavigatedAgain } = await mockSubmitResponse(page, 200);
  await satisfySubmitPreconditions(page);
  await page.locator("#btnSubmit").click();

  const outcome = await pollSubmitOutcome(page, getNavigatedAgain);
  return outcome === "success"
    ? [pass("submit-flow", "Successful submit shows the thank-you state (#hrTy) with a mocked API success response")]
    : [
        fail(
          "submit-flow",
          "Successful submit shows the thank-you state (#hrTy) with a mocked API success response",
          `Never observed the post-success redirect attempt within 10s of clicking Submit with a mocked 200 response (observed: ${outcome})`,
        ),
      ];
}

/** Same as above but with a mocked *failing* API response — confirms
 * apiCallErrorHandler()'s visible error state (#apiError) actually fires,
 * and that Submit is re-enabled afterward so the user can retry. No
 * navigation race here — a failed submit never redirects. */
export async function checkSubmitFlowFailure(page: Page): Promise<QaCheckResult[]> {
  const { getNavigatedAgain } = await mockSubmitResponse(page, 500);
  await satisfySubmitPreconditions(page);
  await page.locator("#btnSubmit").click();
  const outcome = await pollSubmitOutcome(page, getNavigatedAgain);

  const results: QaCheckResult[] = [];
  results.push(
    outcome === "error"
      ? pass("submit-flow", "Failed submit shows a visible error state (#apiError) with a mocked API failure response")
      : fail(
          "submit-flow",
          "Failed submit shows a visible error state (#apiError) with a mocked API failure response",
          `#apiError never became visible within 10s of clicking Submit with a mocked 500 response (observed: ${outcome})`,
        ),
  );

  const reEnabled = !(await page.locator("#btnSubmit").isDisabled());
  results.push(
    reEnabled
      ? pass("submit-flow", "Submit button is re-enabled after a failed submit, so the user can retry")
      : fail("submit-flow", "Submit button is re-enabled after a failed submit, so the user can retry", "#btnSubmit stayed disabled after the mocked failure"),
  );

  return results;
}
