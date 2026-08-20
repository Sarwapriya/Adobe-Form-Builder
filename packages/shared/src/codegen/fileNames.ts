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

/** Same `{subsidiary}-{LANG}` convention as the base prefix, but for one of the
 * form's non-default locales — falls back to the full locale code (e.g. "AR-AE"
 * instead of just "AR") if its langSubtag collides with an already-used prefix
 * (two locales sharing a language, e.g. "en_GB" and "en_US"), so every locale
 * variant still gets a distinct file name. */
function resolveLocaleVariantPrefix(form: FormDefinition, basePrefix: string, locale: FormDefinition["locales"][number], usedPrefixes: Set<string>): string {
  const subsidiary = form.meta.subsidiary.trim();
  const lang = locale.langSubtag.toUpperCase();
  let candidate = sanitize(subsidiary ? `${subsidiary}-${lang}` : lang);
  if (candidate === basePrefix || usedPrefixes.has(candidate)) {
    candidate = sanitize(subsidiary ? `${subsidiary}-${locale.code}` : locale.code);
  }
  usedPrefixes.add(candidate);
  return candidate;
}

export function resolveFileNames(form: FormDefinition, config: BuilderConfig): FileNames {
  const prefix = resolvePrefix(form, config);
  const usedPrefixes = new Set<string>([prefix]);
  const localeVariants: LocaleVariantFileNames[] = form.locales
    .filter((l) => l.code !== form.meta.defaultLocale)
    .map((l) => {
      const variantPrefix = resolveLocaleVariantPrefix(form, prefix, l, usedPrefixes);
      return {
        locale: l.code,
        prefix: variantPrefix,
        ffJs: `${variantPrefix}_FF.js`,
        ocJs: `${variantPrefix}_OC.js`,
        ffHtml: `${variantPrefix}_FF.html`,
        ocHtml: `${variantPrefix}_OC.html`,
      };
    });

  return {
    prefix,
    css: `${prefix}.css`,
    dataJs: `${prefix}.js`,
    // Mirrors the reference's `_FF.js`/`_OC.js` pair: each variant gets its own behavior
    // script (see buildVariantJs.ts) rather than a single shared file.
    ffJs: `${prefix}_FF.js`,
    ocJs: `${prefix}_OC.js`,
    ffHtml: `${prefix}_FF.html`,
    ocHtml: `${prefix}_OC.html`,
    localeVariants,
  };
}
