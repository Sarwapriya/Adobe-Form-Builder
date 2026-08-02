import type { FileNames } from "../fileNames.ts";
import type { GeneratedFile } from "../types.ts";
import { REFERENCE_FF_JS } from "./referenceFfJsContent.ts";

/**
 * `{prefix}_FF.js` is the reference's `SGE-EN_F2H26_FF.js`, byte-identical — no
 * per-form logic here. It reads the bare globals `fields`/`questions`/`answers`/
 * `page_error`/`validation_messages`/`param`/`country_subsidiary`/`subsidiary_detail`
 * that `buildDataJs.ts` emits, and the DOM shape `buildFfHtml.ts` renders.
 */
export function buildFfJs(fileNames: FileNames): GeneratedFile {
  return { path: fileNames.ffJs, contents: REFERENCE_FF_JS };
}
