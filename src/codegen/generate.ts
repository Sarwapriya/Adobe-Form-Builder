import type { FormDefinition } from "../form/formDefinition.ts";
import { buildStyleCss } from "./css/buildStyleCss.ts";
import { buildFfHtml } from "./html/buildFfHtml.ts";
import { buildOcHtml } from "./html/buildOcHtml.ts";
import { buildBehaviorJs } from "./js/buildBehaviorJs.ts";
import { buildDataJs } from "./js/buildDataJs.ts";
import type { BuilderConfig, GeneratedFile } from "./types.ts";

/**
 * Pure function: `FormDefinition` + `BuilderConfig` in, generated files out. No
 * DOM/download side effects live here (that's `zipAndDownload.ts`) — this is what the
 * live preview and the "Generate Form" button both call, so they can never drift.
 *
 * Output mirrors the reference's file count (no invented extras): one HTML file per
 * requested variant, one shared `data.js`, one shared `behavior.js`, one `style.css`.
 */
export function generateSolution(form: FormDefinition, config: BuilderConfig): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  if (config.variants.includes("ff")) files.push(buildFfHtml(form, config));
  if (config.variants.includes("oc")) files.push(buildOcHtml(form, config));
  files.push(buildDataJs(form, config));
  files.push(buildBehaviorJs());
  files.push(buildStyleCss());
  return files;
}
