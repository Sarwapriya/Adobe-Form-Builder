import type { FormDefinition } from "../form/formDefinition.ts";
import { buildStyleCss } from "./css/buildStyleCss.ts";
import { resolveFileNames } from "./fileNames.ts";
import { buildFfHtml } from "./html/buildFfHtml.ts";
import { buildOcHtml } from "./html/buildOcHtml.ts";
import { buildDataJs } from "./js/buildDataJs.ts";
import { buildFfJs } from "./js/buildFfJs.ts";
import { buildOcJs } from "./js/buildOcJs.ts";
import type { BuilderConfig, GeneratedFile } from "./types.ts";

/**
 * Pure function: `FormDefinition` + `BuilderConfig` in, generated files out. No
 * DOM/download side effects live here (that's `zipAndDownload.ts`) — this is what the
 * live preview and the "Generate Form" button both call, so they can never drift.
 *
 * Output mirrors the reference's file count (no invented extras): one HTML file and one
 * behavior JS file per requested variant, one shared `data.js`, one `style.css`.
 */
export function generateSolution(form: FormDefinition, config: BuilderConfig): GeneratedFile[] {
  const fileNames = resolveFileNames(form, config);

  // Apply per-question required overrides from config
  const effectiveForm = config.questionRequired
    ? {
        ...form,
        questions: form.questions.map((q) => {
          const override = config.questionRequired?.[q.id];
          if (override === undefined) return q;
          return { ...q, required: override };
        }),
      }
    : form;

  const files: GeneratedFile[] = [];
  if (config.variants.includes("ff")) {
    files.push(buildFfHtml(effectiveForm, config, fileNames));
    files.push(buildFfJs(fileNames));
  }
  if (config.variants.includes("oc")) {
    files.push(buildOcHtml(effectiveForm, config, fileNames));
    files.push(buildOcJs(fileNames));
  }
  files.push(buildDataJs(effectiveForm, config, fileNames));
  files.push(buildStyleCss(fileNames));
  return files;
}
