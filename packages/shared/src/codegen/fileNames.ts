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
 *
 * One set of names per form regardless of how many locales it has — there is no
 * separate per-locale HTML/behavior-JS pair (there used to be; see generate.ts's own
 * doc comment for why that was dropped). Every locale is served from this same
 * `ffHtml`/`ocHtml`/`ffJs`/`ocJs`/`dataJs`/`css` set, switched at runtime via the
 * `?lang=<localeCode>` URL param the reference behavior scripts already read.
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
    ffJs: `${prefix}_FF.js`,
    ocJs: `${prefix}_OC.js`,
    ffHtml: `${prefix}_FF.html`,
    ocHtml: `${prefix}_OC.html`,
  };
}
