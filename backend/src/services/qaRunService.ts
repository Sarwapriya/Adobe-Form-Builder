import path from "node:path";
import fsp from "node:fs/promises";
import { AppDataSource } from "../config/data-source";
import { QaRun, type QaRunVariant } from "../entities/QaRun";
import { QaTestCaseResult } from "../entities/QaTestCaseResult";
import { Upload } from "../entities/Upload";
import { buildUploadPreview } from "./previewService";
import { runQaSuite } from "./qa/qaTestRunner";
import type { QaCheckResult } from "./qa/types";
import { absoluteFilePath, uploadStorageDir } from "./fileService";

export type CreateQaRunOutcome =
  | { outcome: "not_found" }
  | { outcome: "no_files" }
  | { outcome: "ok"; qaRun: QaRun };

/**
 * Kicks off a QA run for one upload's generated variant: validates the
 * upload/variant actually has generated files (reusing
 * previewService.buildUploadPreview — the exact same self-contained
 * HTML/CSS/JS the admin "Preview" button already renders, so what gets
 * QA-tested is byte-for-byte what an admin would see), persists a "pending"
 * QaRun row, then fires the real Playwright execution in the background
 * (deliberately not awaited here) so the request returns immediately — see
 * runQaJob below and admin.router.ts's POST /qa-runs, which the frontend
 * polls GET /qa-runs/:id against until status leaves "pending"/"running".
 */
export async function createQaRun(uploadId: string, variant: QaRunVariant, triggeredByUserId: string): Promise<CreateQaRunOutcome> {
  const preview = await buildUploadPreview(uploadId, variant);
  if (preview.outcome === "not_found") return { outcome: "not_found" };
  if (preview.outcome === "no_files") return { outcome: "no_files" };

  const repo = AppDataSource.getRepository(QaRun);
  const qaRun = await repo.save(repo.create({ uploadId, variant, status: "pending", triggeredByUserId }));

  void runQaJob(qaRun.id, preview.html!);

  return { outcome: "ok", qaRun };
}

/**
 * The actual background execution: launches Chromium (via qaTestRunner.
 * runQaSuite), persists every individual QaTestCaseResult, and lands the
 * QaRun on "passed"/"failed" (based on whether every check passed) or
 * "error" (the run itself couldn't complete, e.g. Chromium failed to
 * launch, or Playwright's own overall timeout tripped) — never left at
 * "running" once this function returns, since runQaSuite's own timeout
 * guarantees it eventually resolves or throws.
 *
 * There is no queue/worker process behind this — it's a plain fire-and-forget
 * async call from createQaRun, running in the same Node process as the API
 * server. That's a deliberate, documented limitation for this feature's
 * current scope: a server restart mid-run leaves that one QaRun stuck at
 * "running" forever (rare in practice, and always resolvable by re-running
 * QA for that upload), rather than something worth a persistent job queue
 * for a feature used this occasionally.
 */
async function runQaJob(qaRunId: string, html: string): Promise<void> {
  const qaRunRepo = AppDataSource.getRepository(QaRun);
  const resultRepo = AppDataSource.getRepository(QaTestCaseResult);

  await qaRunRepo.update(qaRunId, { status: "running", startedAt: new Date() });

  try {
    const { results } = await runQaSuite(html);

    const rows = results.map((r) =>
      resultRepo.create({
        qaRunId,
        category: r.category,
        name: r.name,
        status: r.status,
        fieldId: r.fieldId ?? null,
        message: r.message ?? null,
      }),
    );
    await resultRepo.save(rows);

    const passedTests = results.filter((r) => r.status === "passed").length;
    const failedTests = results.length - passedTests;

    const qaRun = await qaRunRepo.findOneOrFail({ where: { id: qaRunId } });
    const upload = await AppDataSource.getRepository(Upload).findOneOrFail({ where: { id: qaRun.uploadId } });
    const reportPath = await writeQaReport(upload.subsidiaryId, qaRun, results);

    await qaRunRepo.update(qaRunId, {
      status: failedTests > 0 ? "failed" : "passed",
      totalTests: results.length,
      passedTests,
      failedTests,
      reportPath,
      completedAt: new Date(),
    });
  } catch (err) {
    await qaRunRepo.update(qaRunId, {
      status: "error",
      errorMessage: err instanceof Error ? err.message : "Unknown error",
      completedAt: new Date(),
    });
  }
}

export function getQaRun(id: string): Promise<QaRun | null> {
  return AppDataSource.getRepository(QaRun).findOne({ where: { id } });
}

export function listQaRunsForUpload(uploadId: string): Promise<QaRun[]> {
  return AppDataSource.getRepository(QaRun).find({ where: { uploadId }, order: { createdAt: "DESC" } });
}

export interface QaRunDetail {
  run: QaRun;
  results: QaTestCaseResult[];
}

/** Returns null for an unknown id — callers map that to a 404. */
export async function getQaRunDetail(id: string): Promise<QaRunDetail | null> {
  const run = await AppDataSource.getRepository(QaRun).findOne({ where: { id } });
  if (!run) return null;
  const results = await AppDataSource.getRepository(QaTestCaseResult).find({ where: { qaRunId: id }, order: { createdAt: "ASC" } });
  return { run, results };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const CATEGORY_LABELS: Record<string, string> = {
  structure: "Page structure",
  "field-validation": "Field validation",
  "field-interaction": "Field interaction",
  "required-enforcement": "Required-field enforcement",
  "submit-gating": "Submit button gating",
  "submit-flow": "Submit flow",
};

/**
 * Builds the downloadable HTML report — a single self-contained document
 * (no external assets) grouped by category, so an admin can open it directly
 * or send it to whoever owns fixing a failing field. Written to disk under
 * the same upload storage directory GeneratedFiles already use (see
 * fileService.uploadStorageDir), not the database — reports can run to a few
 * hundred rows and there's no reason to carry that in every QaRun query.
 */
async function writeQaReport(subsidiaryId: string, qaRun: QaRun, results: QaCheckResult[]): Promise<string> {
  const byCategory = new Map<string, QaCheckResult[]>();
  for (const r of results) {
    const list = byCategory.get(r.category) ?? [];
    list.push(r);
    byCategory.set(r.category, list);
  }

  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.length - passed;

  const sections = [...byCategory.entries()]
    .map(([category, items]) => {
      const rows = items
        .map(
          (r) => `<tr class="${r.status}">
        <td class="status">${r.status === "passed" ? "✓ Passed" : "✗ Failed"}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${r.fieldId ? escapeHtml(r.fieldId) : "—"}</td>
        <td>${r.message ? escapeHtml(r.message) : "—"}</td>
      </tr>`,
        )
        .join("\n");
      return `<h2>${escapeHtml(CATEGORY_LABELS[category] ?? category)}</h2>
      <table>
        <thead><tr><th>Result</th><th>Check</th><th>Field</th><th>Details</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<title>QA report — ${escapeHtml(qaRun.variant.toUpperCase())} — ${qaRun.id}</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; margin: 32px; color: #1a1a2e; }
  h1 { margin-bottom: 4px; }
  .summary { display: flex; gap: 16px; margin: 16px 0 32px; }
  .tile { padding: 12px 20px; border-radius: 8px; font-weight: 700; }
  .tile.total { background: #eef0fa; }
  .tile.passed { background: #e3f8ec; color: #147a3b; }
  .tile.failed { background: #fdecec; color: #b3261e; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e4e4ee; font-size: 14px; }
  th { background: #f8f9fc; text-transform: uppercase; font-size: 11px; letter-spacing: 0.4px; color: #666; }
  tr.failed .status { color: #b3261e; font-weight: 700; }
  tr.passed .status { color: #147a3b; }
</style>
</head>
<body>
<h1>QA report — ${escapeHtml(qaRun.variant.toUpperCase())} variant</h1>
<p>Upload ${escapeHtml(qaRun.uploadId)} · Run ${escapeHtml(qaRun.id)} · ${new Date().toLocaleString()}</p>
<div class="summary">
  <div class="tile total">${results.length} total</div>
  <div class="tile passed">${passed} passed</div>
  <div class="tile failed">${failed} failed</div>
</div>
${sections}
</body>
</html>
`;

  const relativePath = path.join(uploadStorageDir(subsidiaryId, qaRun.uploadId), "qa", `${qaRun.id}.html`);
  const absolutePath = absoluteFilePath(relativePath);
  await fsp.mkdir(path.dirname(absolutePath), { recursive: true });
  await fsp.writeFile(absolutePath, html, "utf-8");
  return relativePath;
}

export type QaReportDownloadOutcome =
  | { outcome: "not_found" }
  | { outcome: "not_ready" }
  | { outcome: "ok"; html: string };

/** Called from admin.router.ts's GET /qa-runs/:id/download. "not_ready"
 * covers a run still pending/running, or one that errored before ever
 * producing a report. */
export async function buildQaReportDownload(qaRunId: string): Promise<QaReportDownloadOutcome> {
  const qaRun = await AppDataSource.getRepository(QaRun).findOne({ where: { id: qaRunId } });
  if (!qaRun) return { outcome: "not_found" };
  if (!qaRun.reportPath) return { outcome: "not_ready" };

  const html = await fsp.readFile(absoluteFilePath(qaRun.reportPath), "utf-8");
  return { outcome: "ok", html };
}
