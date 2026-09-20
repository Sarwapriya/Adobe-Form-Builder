import type { LocaleCode } from "../../form/formDefinition";
import { languageFileNames, type FileNames } from "../fileNames";
import type { GeneratedFile } from "../types";
import { languagePin } from "./languagePin";
import { REFERENCE_FF_JS } from "./referenceFfJsContent";

/**
 * `<Sub>-<lang>_<projectCode>_FF.js` is the reference's `SGE-EN_F2H26_FF.js`, byte-identical
 * — no per-form logic — preceded only by the one-line `languagePin` that makes this
 * language the page's default. It reads the bare globals `fields`/`questions`/`answers`/
 * `page_error`/`validation_messages`/`param`/`country_subsidiary`/`subsidiary_detail`
 * that `buildDataJs.ts` emits, and the DOM shape `buildFfHtml.ts` renders. One file per
 * language (the form's default language when `locale` is omitted).
 */
export function buildFfJs(fileNames: FileNames, locale?: LocaleCode): GeneratedFile {
  const files = languageFileNames(fileNames, locale);
  return { path: files.ffJs, contents: languagePin(files.locale) + REFERENCE_FF_JS };
}
