import { readFile } from "node:fs/promises";
import type { FileNames, GeneratedFile as SharedGeneratedFile } from "@formbuilder/shared";
import { AppDataSource } from "../config/data-source";
import { Form } from "../entities/Form";
import { GeneratedFile as GeneratedFileEntity } from "../entities/GeneratedFile";
import { absoluteFilePath } from "./fileService";
import { classifyFileType } from "./generationService";

export type PreviewVariant = "ff" | "oc";
export type PreviewOutcome = "not_found" | "no_files" | "ok";

export interface PreviewResult {
  outcome: PreviewOutcome;
  html?: string;
}

function readGeneratedFile(file: GeneratedFileEntity): Promise<string> {
  return readFile(absoluteFilePath(file.filePath), "utf-8");
}

/** Replaces `<link>`/`<script src>` tags referencing `file` with an inline
 * equivalent carrying `contents` — a no-op if `file` is undefined (nothing to
 * inline) or its tag isn't present in `html` (already handled elsewhere). */
function inlineLink(html: string, file: GeneratedFileEntity | undefined, contents: string): string {
  if (!file) return html;
  return html.replace(`<link rel="stylesheet" href="${file.fileName}">`, `<style>${contents}</style>`);
}

function inlineScript(html: string, file: GeneratedFileEntity | undefined, contents: string): string {
  if (!file) return html;
  return html.replace(`<script src="${file.fileName}"></script>`, `<script>${contents}</script>`);
}

/**
 * Same self-contained-HTML inlining as buildFormVersionPreview below, but
 * sourced directly from an in-memory `generateSolution()` output rather
 * than on-disk GeneratedFiles rows — for QA runs against content that has no
 * GeneratedFiles rows to read yet (a pending subsidiary contribution merged onto a
 * form's current draft, or an ad-hoc form's own draft while it awaits admin review;
 * see qaRunService.createContributionQaRun/createAdHocReviewQaRun). Returns null if
 * the requested variant's HTML wasn't in `files` (e.g. it wasn't in the config's own
 * `variants` list), mirroring buildFormVersionPreview's own `no_files` outcome.
 */
export function inlineGeneratedFiles(files: SharedGeneratedFile[], fileNames: FileNames, variant: PreviewVariant): string | null {
  const suffix = variant === "ff" ? "_FF" : "_OC";
  const htmlFile = files.find((f) => classifyFileType(f.path, fileNames) === "html" && f.path.endsWith(`${suffix}.html`));
  if (!htmlFile) return null;

  const cssFile = files.find((f) => classifyFileType(f.path, fileNames) === "css");
  const dataJsFile = files.find((f) => classifyFileType(f.path, fileNames) === "data-js");
  const jsFile = files.find((f) => classifyFileType(f.path, fileNames) === "js" && f.path.endsWith(`${suffix}.js`));

  let html = htmlFile.contents;
  if (cssFile) html = html.replace(`<link rel="stylesheet" href="${cssFile.path}">`, `<style>${cssFile.contents}</style>`);
  if (dataJsFile) html = html.replace(`<script src="${dataJsFile.path}"></script>`, `<script>${dataJsFile.contents}</script>`);
  if (jsFile) html = html.replace(`<script src="${jsFile.path}"></script>`, `<script>${jsFile.contents}</script>`);
  return html;
}

/**
 * Builds a single self-contained HTML document for a Form's *published*
 * FormVersion — same inlining technique as the /local wizard's
 * buildPreviewDocument (src/codegen/previewDocument.ts), reimplemented here
 * against on-disk GeneratedFiles rows (reusing this file's own file-scoped
 * readGeneratedFile/inlineLink/inlineScript helpers). Only ever serves a
 * currently-published form (`status === "published"`) — an unpublished
 * form's previously-generated files stay on disk but become unreachable
 * here, reversible by re-publishing (see formBuilderService.unpublishForm).
 */
export async function buildFormVersionPreview(formId: string, variant: PreviewVariant, strict = false): Promise<PreviewResult> {
  const form = await AppDataSource.getRepository(Form).findOne({ where: { id: formId, isDeleted: false } });
  if (!form || form.status !== "published" || !form.publishedVersionId) {
    return { outcome: "not_found" };
  }

  const files = await AppDataSource.getRepository(GeneratedFileEntity).find({
    where: { formVersionId: form.publishedVersionId },
  });
  if (files.length === 0) {
    return { outcome: "no_files" };
  }

  const suffixFor = (v: PreviewVariant) => (v === "ff" ? "_FF" : "_OC");
  const findHtml = (v: PreviewVariant) => files.find((f) => f.fileType === "html" && f.fileName.endsWith(`${suffixFor(v)}.html`));

  const requestedHtml = findHtml(variant);
  const fallbackVariant: PreviewVariant = variant === "ff" ? "oc" : "ff";
  const htmlFile = requestedHtml ?? (strict ? undefined : findHtml(fallbackVariant));
  const resolvedVariant = requestedHtml ? variant : fallbackVariant;
  if (!htmlFile) {
    return { outcome: "no_files" };
  }
  const suffix = suffixFor(resolvedVariant);
  const jsFile = files.find((f) => f.fileType === "js" && f.fileName.endsWith(`${suffix}.js`));
  const cssFile = files.find((f) => f.fileType === "css");
  const dataJsFile = files.find((f) => f.fileType === "data-js");

  const [html, css, dataJs, behaviorJs] = await Promise.all([
    readGeneratedFile(htmlFile),
    cssFile ? readGeneratedFile(cssFile) : Promise.resolve(""),
    dataJsFile ? readGeneratedFile(dataJsFile) : Promise.resolve(""),
    jsFile ? readGeneratedFile(jsFile) : Promise.resolve(""),
  ]);

  const inlined = inlineScript(inlineScript(inlineLink(html, cssFile, css), dataJsFile, dataJs), jsFile, behaviorJs);

  return { outcome: "ok", html: inlined };
}
