import type { FormDefinition, LocaleCode } from "../form/formDefinition";
import type { BuilderConfig } from "./types";

/**
 * One language's set of generated files. A form produces one of these per locale it
 * has (see `FileNames.languages`).
 *
 * Naming convention (`<Sub>` = the subsidiary, `<lang>` = the upper-cased language
 * subtag such as `EN`/`AR`, `<projectCode>` = the form's project code):
 *
 * - HTML / behavior JS: `<Sub>-<lang>_<projectCode>_<FF|OC>.html` / `.js`
 * - CSS:                `<lang>-<projectCode>.css` (one per language + project code)
 *
 * Whenever the form has no project code (yet), its `_<projectCode>` / `-<projectCode>`
 * segment is simply omitted, e.g. `SESAR-EN_FF.html` / `EN.css`.
 */
export interface LanguageFileNames {
  /** The locale this set of files serves, e.g. "ar_SA". */
  locale: LocaleCode;
  /** The language token used in this language's file names, e.g. "AR". */
  lang: string;
  css: string;
  ffHtml: string;
  ocHtml: string;
  ffJs: string;
  ocJs: string;
}

/**
 * Single source of truth for generated output file names, so the HTML's `<link>`/
 * `<script src>` references, the zip's actual file paths, and the live preview's
 * inline-substitution lookups can never drift apart.
 *
 * The top-level `css`/`ffHtml`/`ocHtml`/`ffJs`/`ocJs` are the **default locale's** files
 * (kept so single-language call sites read naturally); every language's files —
 * including the default's — are in `languages`. `dataJs` is the one main data file,
 * shared by every language, named per subsidiary + project code: `<Sub>_<projectCode>.js`.
 */
export interface FileNames extends LanguageFileNames {
  /** `<Sub>_<projectCode>.js` — every language's HTML reads this same data file. */
  dataJs: string;
  /** One entry per form locale, in the form's `locales` order. */
  languages: LanguageFileNames[];
}

function sanitize(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

/** The `<Sub>` part of every name. `fileNamePrefix` (a BuilderConfig override) replaces it. */
function resolveSubsidiary(form: FormDefinition, config: BuilderConfig): string {
  const override = config.fileNamePrefix?.trim();
  if (override) return sanitize(override);
  return sanitize(form.meta.subsidiary.trim());
}

/**
 * The language token for each locale: the upper-cased language subtag (`EN`, `AR`).
 * When two of the form's locales share a language (e.g. `en_GB` + `en_US`) that token
 * would collide, so those locales fall back to their full code (`EN-GB` / `EN-US`).
 */
function resolveLangTokens(locales: { code: LocaleCode; langSubtag: string }[]): string[] {
  const subtags = locales.map((l) => (l.langSubtag || "en").toUpperCase());
  return locales.map((l, i) => {
    const collides = subtags.filter((s) => s === subtags[i]).length > 1;
    return sanitize(collides ? l.code.replace(/_/g, "-").toUpperCase() : subtags[i]);
  });
}

export function resolveFileNames(form: FormDefinition, config: BuilderConfig): FileNames {
  const sub = resolveSubsidiary(form, config);
  const projectCode = sanitize(config.projectCode?.trim() ?? "");

  // Always include the default locale, even if `locales` somehow omits it, so there is
  // always a default-language file set.
  const locales = form.locales.map((l) => ({ code: l.code, langSubtag: l.langSubtag }));
  if (!locales.some((l) => l.code === form.meta.defaultLocale)) {
    locales.unshift({ code: form.meta.defaultLocale, langSubtag: form.meta.defaultLocale.split("_")[0] ?? "en" });
  }
  const tokens = resolveLangTokens(locales);

  const languages: LanguageFileNames[] = locales.map((l, i) => {
    const lang = tokens[i];
    const htmlBase = `${sub ? `${sub}-${lang}` : lang}${projectCode ? `_${projectCode}` : ""}`;
    return {
      locale: l.code,
      lang,
      css: `${lang}${projectCode ? `-${projectCode}` : ""}.css`,
      ffHtml: `${htmlBase}_FF.html`,
      ocHtml: `${htmlBase}_OC.html`,
      ffJs: `${htmlBase}_FF.js`,
      ocJs: `${htmlBase}_OC.js`,
    };
  });

  const defaultLanguage = languages.find((l) => l.locale === form.meta.defaultLocale) ?? languages[0];
  const dataJs = `${[sub, projectCode].filter(Boolean).join("_") || "data"}.js`;

  return { ...defaultLanguage, dataJs, languages };
}

/** The file set for `locale`, falling back to the default locale's when it has none. */
export function languageFileNames(fileNames: FileNames, locale?: LocaleCode): LanguageFileNames {
  return fileNames.languages.find((l) => l.locale === locale) ?? fileNames;
}
