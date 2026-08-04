import { type FormDefinition } from "../../form/formDefinition";
import type { FileNames } from "../fileNames";
import type { BuilderConfig, GeneratedFile } from "../types";
/**
 * Builds the data file (`{prefix}.js`): the bare top-level `const`s the byte-identical
 * `buildFfJs.ts`/`buildOcJs.ts` scripts read at runtime — same names and shape as the
 * reference's `SGE-EN_F2H26.js` (`page_error`, `fields`, `questions`, `answers`,
 * `validation_messages`, `country_subsidiary`, `subsidiary_detail`, `param`), not the
 * `FORM_DATA` wrapper object used previously. `country_subsidiary`/`subsidiary_detail`
 * are embedded in full (see `form/subsidiaryData.ts`) rather than filtered to one
 * selected subsidiary — the reference scripts resolve the right subsidiary themselves,
 * at runtime, from the active locale's own country suffix.
 */
export declare function buildDataJs(form: FormDefinition, config: BuilderConfig, fileNames: FileNames): GeneratedFile;
