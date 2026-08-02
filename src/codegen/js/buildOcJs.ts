import type { FileNames } from "../fileNames.ts";
import type { GeneratedFile } from "../types.ts";
import { REFERENCE_OC_JS } from "./referenceOcJsContent.ts";

/**
 * `{prefix}_OC.js` is the reference's `SGE-EN_F2H26_OC.js`, byte-identical — no
 * per-form logic here. It reads the bare globals `fields`/`questions`/`answers`/
 * `page_error`/`validation_messages`/`param`/`country_subsidiary`/`subsidiary_detail`
 * that `buildDataJs.ts` emits, and the DOM shape `buildOcHtml.ts` renders.
 */
export function buildOcJs(fileNames: FileNames): GeneratedFile {
  return { path: fileNames.ocJs, contents: REFERENCE_OC_JS };
}
