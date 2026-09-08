import type { FileNames } from "../fileNames";
import type { GeneratedFile } from "../types";
import { REFERENCE_OC_JS } from "./referenceOcJsContent";

/**
 * `{prefix}_OC.js` is the reference's `SGE-EN_F2H26_OC.js`, byte-identical — no
 * per-form logic here. It reads the bare globals `fields`/`questions`/`answers`/
 * `page_error`/`validation_messages`/`param`/`country_subsidiary`/`subsidiary_detail`
 * that `buildDataJs.ts` emits, and the DOM shape `buildOcHtml.ts` renders.
 */
export function buildOcJs(fileNames: FileNames): GeneratedFile {
  return { path: fileNames.ocJs, contents: REFERENCE_OC_JS };
}
