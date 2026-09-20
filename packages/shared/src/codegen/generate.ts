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
 * Output, for a form with L languages and V requested variants (see fileNames.ts for the
 * exact naming): one HTML file and one behavior JS file per language per variant
 * (`<Sub>-<lang>_<projectCode>_<FF|OC>.html`/`.js`), one main data file shared by every
 * language (`<Sub>_<projectCode>.js`), and one stylesheet per language
 * (`<lang>-<projectCode>.css`) — `2·L·V + L + 1` files. Each language's page defaults to
 * its own language (its behavior JS pins it — see js/languagePin.ts), and the reference
 * behavior scripts' `?lang=<localeCode>` URL param can still switch any page to another of
 * the form's languages. `buildDataJs.ts`'s data file keys every field by locale in one
 * file, so nothing locale-specific needs splitting out of it.
 *
 * (An earlier version emitted just one HTML/JS pair for every locale, switched only via
 * `?lang=`. Per-language files restore the reference's own `SESAR-AR_F2H26_FF.js` /
 * `SESAR-EN_F2H26_FF.js` layout, so each language can be deployed/linked on its own.)
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
    for (const { locale } of fileNames.languages) {
      files.push(buildFfHtml(effectiveForm, config, fileNames, locale));
      files.push(buildFfJs(fileNames, locale));
    }
  }
  if (config.variants.includes("oc")) {
    for (const { locale } of fileNames.languages) {
      files.push(buildOcHtml(effectiveForm, config, fileNames, locale));
      files.push(buildOcJs(fileNames, locale));
    }
  }
  files.push(buildDataJs(effectiveForm, config, fileNames));
  for (const { locale } of fileNames.languages) {
    files.push(buildStyleCss(fileNames, locale));
  }

  return files;
}
