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
 * the form's own default locale. A form with more than one locale additionally gets its
 * own extra HTML/behavior-JS pair per *other* locale (see `fileNames.localeVariants`),
 * still against the same shared `data.js`/`style.css` — mirroring the reference's own
 * separate per-locale files (e.g. `SESAR-AR_F2H26_FF.js` / `SESAR-EN_F2H26_FF.js`) while
 * keeping the multi-locale-keyed data file itself unified rather than duplicated.
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

  for (const variant of fileNames.localeVariants) {
    const localeInfo = form.locales.find((l) => l.code === variant.locale);
    // fileNames.localeVariants is itself derived from form.locales, so this is always
    // found — the check just satisfies the optional LocaleInfo|undefined param type.
    if (!localeInfo) continue;
    const variantFileNames = { ...fileNames, ffHtml: variant.ffHtml, ffJs: variant.ffJs, ocHtml: variant.ocHtml, ocJs: variant.ocJs };
    if (config.variants.includes("ff")) {
      files.push(buildFfHtml(effectiveForm, config, variantFileNames, localeInfo));
      files.push(buildFfJs(variantFileNames));
    }
    if (config.variants.includes("oc")) {
      files.push(buildOcHtml(effectiveForm, config, variantFileNames, localeInfo));
      files.push(buildOcJs(variantFileNames));
    }
  }

  return files;
}
