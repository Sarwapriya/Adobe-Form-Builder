import type { FormDefinition } from "../form/formDefinition";
import { buildStyleCss } from "./css/buildStyleCss";
import { resolveFileNames } from "./fileNames";
import { buildFfHtml } from "./html/buildFfHtml";
import { buildOcHtml } from "./html/buildOcHtml";
import { buildDataJs } from "./js/buildDataJs";
import { buildFfJs } from "./js/buildFfJs";
import { buildOcJs } from "./js/buildOcJs";
import type { BuilderConfig, GeneratedFile } from "./types";

/**
 * Pure function: `FormDefinition` + `BuilderConfig` in, generated files out. No
 * DOM/download side effects live here (that's `zipAndDownload.ts`) — this is what the
 * live preview and the "Generate Form" button both call, so they can never drift.
 *
 * Output mirrors the reference's file count (no invented extras): one HTML file and one
 * behavior JS file per requested variant, one shared `data.js`, one `style.css` — for
 * *every* locale the form has, not just the default one. A multi-locale form does NOT
 * get its own extra HTML/behavior-JS pair per locale (it used to — see fileNames.ts's
 * git history — mirroring the reference's own separate per-locale files like
 * `SESAR-AR_F2H26_FF.js` / `SESAR-EN_F2H26_FF.js`). That duplication turned out to be
 * unnecessary: the reference FF.js/OC.js scripts (byte-identical here, see buildFfJs.ts/
 * buildOcJs.ts) already resolve `var language = frameUrlParam.get("lang") ||
 * param["fallbackLanguage"]` at runtime and index every `fields[language]`/
 * `questions[language]`/`answers[language]` lookup off it, and already set the page's
 * `dir` attribute from that same resolved language (see the reference script's own
 * "HTML Direction (RTL/LTR)" block) — so one HTML/JS pair already renders any of the
 * form's locales correctly, switched purely via a `?lang=<localeCode>` URL param, with
 * no server-side duplication needed. `buildDataJs.ts`'s `data.js` already keys every
 * field by locale in one file, so there's nothing locale-specific left to split out —
 * this is exactly how the live preview has always worked (see previewDocument.ts, which
 * never touched the old per-locale files at all, only ever this shared pair).
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
