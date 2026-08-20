import type { FormDefinition } from "../form/formDefinition";
import type { BuilderConfig } from "./types";
/**
 * Single source of truth for generated output file names, so the HTML's `<link>`/
 * `<script src>` references, the zip's actual file paths, and the live preview's
 * inline-substitution lookups can never drift apart (previously each of those five
 * places hardcoded "style.css"/"data.js"/"behavior.js"/"ff.html"/"oc.html" separately).
 *
 * Defaults to the reference's `{SUBSIDIARY}-{LANG}` prefix convention (e.g. the
 * reference's `SGE-EN_F2H26.js` → here `SEIL-EN.js` from a workbook whose subsidiary
 * cell reads "SEIL"), minus the campaign-code suffix (`_F2H26`) since no such code
 * exists anywhere in the source workbook data for a generic tool to derive.
 */
export interface FileNames {
    /** The bare `{subsidiary}-{LANG}` (or override) prefix all other names derive from. */
    prefix: string;
    css: string;
    dataJs: string;
    ffJs: string;
    ocJs: string;
    ffHtml: string;
    ocHtml: string;
    /**
     * One extra `{ffJs, ocJs, ffHtml, ocHtml}` set per locale beyond the form's own
     * default — a multi-locale form gets its own independent HTML/behavior-JS pair per
     * locale (mirroring the reference's own separate `SESAR-AR_F2H26_FF.js` /
     * `SESAR-EN_F2H26_FF.js` files) while still sharing one `dataJs`/`css` across all of
     * them (see buildDataJs.ts, which already keys every field by locale in one file —
     * there's nothing locale-specific to split out of it). Empty for a single-locale
     * form, so nothing about today's single-bundle output changes for the common case.
     */
    localeVariants: LocaleVariantFileNames[];
}
export interface LocaleVariantFileNames {
    locale: string;
    prefix: string;
    ffJs: string;
    ocJs: string;
    ffHtml: string;
    ocHtml: string;
}
export declare function resolveFileNames(form: FormDefinition, config: BuilderConfig): FileNames;
