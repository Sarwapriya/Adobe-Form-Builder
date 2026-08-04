import type { FileNames } from "../fileNames";
import type { GeneratedFile } from "../types";
/**
 * `{prefix}_FF.js` is the reference's `SGE-EN_F2H26_FF.js`, byte-identical — no
 * per-form logic here. It reads the bare globals `fields`/`questions`/`answers`/
 * `page_error`/`validation_messages`/`param`/`country_subsidiary`/`subsidiary_detail`
 * that `buildDataJs.ts` emits, and the DOM shape `buildFfHtml.ts` renders.
 */
export declare function buildFfJs(fileNames: FileNames): GeneratedFile;
