import type { FormDefinition } from "../form/formDefinition.ts";
import type { BuilderConfig } from "./types.ts";

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
  behaviorJs: string;
  ffHtml: string;
  ocHtml: string;
}

function sanitize(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

function resolvePrefix(form: FormDefinition, config: BuilderConfig): string {
  const override = config.fileNamePrefix?.trim();
  if (override) return sanitize(override);

  const defaultLocaleInfo = form.locales.find((l) => l.code === form.meta.defaultLocale);
  const lang = (defaultLocaleInfo?.langSubtag ?? "en").toUpperCase();
  const subsidiary = form.meta.subsidiary.trim();
  return sanitize(subsidiary ? `${subsidiary}-${lang}` : lang);
}

export function resolveFileNames(form: FormDefinition, config: BuilderConfig): FileNames {
  const prefix = resolvePrefix(form, config);
  return {
    prefix,
    css: `${prefix}.css`,
    dataJs: `${prefix}.js`,
    // Kept as one file shared by both variants (see buildBehaviorJs.ts) rather than the
    // reference's duplicated `_FF.js`/`_OC.js` pair, so it gets its own distinct suffix
    // instead of a variant one.
    behaviorJs: `${prefix}_common.js`,
    ffHtml: `${prefix}_FF.html`,
    ocHtml: `${prefix}_OC.html`,
  };
}
