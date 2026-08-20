import type { FormDefinition } from "../form/formDefinition";
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
export declare function generateSolution(form: FormDefinition, config: BuilderConfig): GeneratedFile[];
