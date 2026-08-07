import http from "node:http";
import type { AddressInfo } from "node:net";
import { chromium, type Browser, type Page } from "playwright";
import {
  checkProfileFields,
  checkQuestionInteraction,
  checkRequiredEnforcement,
  checkStructure,
  checkSubmitFlowFailure,
  checkSubmitFlowSuccess,
  checkSubmitGating,
  getFormManifest,
  waitForClientLibraries,
} from "./qaIntrospection";
import type { QaCheckResult } from "./types";

const OVERALL_TIMEOUT_MS = 3 * 60_000;

export interface QaRunOutcome {
  results: QaCheckResult[];
}

/** Serves the exact same self-contained HTML (already inlined by
 * previewService.buildUploadPreview — CSS/data.js/behavior.js all inline,
 * only the two CDN `<script src>` tags for jQuery/Parsley/libphonenumber
 * remain external) to every request on an ephemeral localhost port. A real
 * HTTP server (not `file://`) is used specifically so `page.route()` can
 * reliably intercept the form's `fetch()` submit call — file:// requests
 * don't go through the same network-interception path Playwright hooks. */
function serveHtml(html: string): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.method === "GET") {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(html);
        return;
      }
      // Safety net only — page.route() below intercepts the real submit
      // fetch() before it would ever reach here.
      res.setHeader("Content-Type", "application/json");
      res.end("{}");
    });
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${port}/`,
        close: () => new Promise((res) => server.close(() => res())),
      });
    });
  });
}

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

/**
 * Runs the full generic QA suite (qaIntrospection.ts) against one
 * self-contained generated form document. Three page loads against the same
 * local server: one for every non-destructive check (structure, field
 * validation, question interaction, required-enforcement, submit-gating),
 * and one fresh load each for the two submit-flow scenarios (success/
 * failure), since a successful submit empties the form's own container —
 * sharing a page across those would make the failure scenario's result
 * meaningless.
 *
 * Wrapped in an overall timeout so a hung page/browser can't leave a QaRun
 * stuck at "running" forever — see qaRunService.runQaJob, which relies on
 * this always eventually resolving or throwing.
 */
export async function runQaSuite(html: string): Promise<QaRunOutcome> {
  return withTimeout(runQaSuiteInner(html), OVERALL_TIMEOUT_MS);
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`QA run exceeded its ${ms / 1000}s timeout`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

async function runQaSuiteInner(html: string): Promise<QaRunOutcome> {
  const server = await serveHtml(html);
  let browser: Browser | undefined;

  // The One-Click variant's own reference JS requires a non-empty
  // "id" (recipientId) URL query param — by design, an OC form is only ever
  // reached via a campaign link carrying that recipient id, and its
  // validateRequiredUrlParam() throws (caught by its own top-level try/catch,
  // which then calls showError() and wipes the page) if it's missing. The FF
  // variant has no such check, so this dummy value is harmless there too —
  // applied to every navigation rather than branching on variant, since this
  // module only ever sees a plain HTML string, not which variant it came from.
  const navigateUrl = `${server.url}?id=qa-automation-run`;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const results: QaCheckResult[] = [];

    // --- Page A: everything that doesn't destroy form state -------------
    const pageA = await context.newPage();
    const consoleErrorsA = collectConsoleErrors(pageA);
    await pageA.goto(navigateUrl, { waitUntil: "domcontentloaded" });
    const librariesLoaded = await waitForClientLibraries(pageA);

    if (!librariesLoaded) {
      results.push({
        category: "structure",
        name: "jQuery/Parsley (loaded from CDN) become available",
        status: "failed",
        fieldId: null,
        message:
          "jQuery/ParsleyJS never loaded within 20s — this generated form loads them from a public CDN " +
          "(code.jquery.com / cdn.jsdelivr.net), so this usually means the machine running the QA tool has no " +
          "internet access, not that the generated form itself is broken. Every later check was skipped.",
      });
      await pageA.close();
      return { results };
    }

    const manifest = await getFormManifest(pageA);
    results.push(...(await checkStructure(pageA, manifest, consoleErrorsA)));
    results.push(...(await checkProfileFields(pageA)));
    results.push(...(await checkQuestionInteraction(pageA, manifest)));
    results.push(...(await checkRequiredEnforcement(pageA, manifest)));
    results.push(...(await checkSubmitGating(pageA)));
    await pageA.close();

    // --- Page B: mocked successful submit --------------------------------
    const pageB = await context.newPage();
    await pageB.goto(navigateUrl, { waitUntil: "domcontentloaded" });
    if (await waitForClientLibraries(pageB)) {
      results.push(...(await checkSubmitFlowSuccess(pageB)));
    }
    await pageB.close();

    // --- Page C: mocked failing submit ------------------------------------
    const pageC = await context.newPage();
    await pageC.goto(navigateUrl, { waitUntil: "domcontentloaded" });
    if (await waitForClientLibraries(pageC)) {
      results.push(...(await checkSubmitFlowFailure(pageC)));
    }
    await pageC.close();

    return { results };
  } finally {
    await browser?.close();
    await server.close();
  }
}
