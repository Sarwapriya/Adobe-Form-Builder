import { readFile } from "node:fs/promises";
import { AppDataSource } from "../config/data-source";
import { Upload } from "../entities/Upload";
import { Form } from "../entities/Form";
import { GeneratedFile as GeneratedFileEntity } from "../entities/GeneratedFile";
import { absoluteFilePath } from "./fileService";

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
 * Builds a single self-contained HTML document for one upload's generated
 * form, for the admin dashboard's "Preview" button — same inlining technique
 * as the /local wizard's buildPreviewDocument (src/codegen/previewDocument.ts),
 * reimplemented here against on-disk GeneratedFiles rows rather than an
 * in-memory GeneratedFile[], since the admin dashboard previews an upload
 * that was generated server-side, possibly in a previous request entirely.
 *
 * Falls back to whichever variant *was* actually generated if the requested
 * one wasn't — the uploader may have only requested Full Form or only
 * One-Click (see Upload.variants), and the "View" button doesn't know which
 * up front, so this is friendlier than a flat 409 for the common case.
 *
 * `strict: true` disables that fallback and returns `no_files` outright if
 * the exact requested variant wasn't generated — used by qaRunService, where
 * silently substituting the other variant would run (and label) a QA report
 * against the wrong form entirely.
 */
export async function buildUploadPreview(
  uploadId: string,
  variant: PreviewVariant,
  strict = false,
): Promise<PreviewResult> {
  const upload = await AppDataSource.getRepository(Upload).findOne({ where: { id: uploadId, isDeleted: false } });
  if (!upload) {
    return { outcome: "not_found" };
  }

  const files = await AppDataSource.getRepository(GeneratedFileEntity).find({ where: { uploadId } });
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

/**
 * Builder-authored counterpart to buildUploadPreview above — same self-contained-HTML
 * inlining technique (reusing this file's own file-scoped readGeneratedFile/inlineLink/
 * inlineScript helpers), against a Form's *published* FormVersion instead of an Upload.
 * Only ever serves a currently-published form (`status === "published"`) — an
 * unpublished form's previously-generated files stay on disk but become unreachable
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
