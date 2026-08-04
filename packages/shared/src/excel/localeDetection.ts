import type { LocaleInfo } from "../form/formDefinition";
import { isRtlLangSubtag, langDisplayName } from "../form/langNames";
import type { RawRow, WorkbookMeta } from "./types";
import { normalize } from "./textUtils";

const LOCALE_CODE_RE = /^([a-z]{2,3})[_-]([a-zA-Z]{2,3})$/;
const KEY_ROW_RE = /^[qa]\d+$/i;

export const ENGLISH_LOCALE: LocaleInfo = {
  code: "en_GB",
  langSubtag: "en",
  isRtl: false,
  sourceColumn: "en_GB",
  label: "English",
};

export interface UnresolvedLocale {
  column: "C" | "D";
  /** Raw text found in the Language_Country metadata cell for this column (may be
   * a placeholder like "Language / Country", or blank). */
  rawValue: string;
}

export interface LocaleResolution {
  locales: LocaleInfo[];
  /** Columns that have real translated content but whose Language_Country metadata
   * couldn't be parsed into a `<lang>_<COUNTRY>` code — these require the builder
   * user to manually confirm a language before that column's locale can be included
   * in generation. Guessing here would risk mislabeling an RTL language as LTR (or
   * vice versa), corrupting `lang`/`dir` downstream, so we surface rather than guess. */
  unresolved: UnresolvedLocale[];
}

function columnHasContent(rows: RawRow[], column: "C" | "D"): boolean {
  return rows.some((r) => KEY_ROW_RE.test(r.key) && normalize(column === "C" ? r.translationC : r.translationD) !== "");
}

function resolveColumn(rawLocale: string, column: "C" | "D", rows: RawRow[]): LocaleInfo | UnresolvedLocale | null {
  const match = LOCALE_CODE_RE.exec(normalize(rawLocale));
  if (match) {
    const langSubtag = match[1]!.toLowerCase();
    const country = match[2]!.toUpperCase();
    return {
      code: `${langSubtag}_${country}`,
      langSubtag,
      isRtl: isRtlLangSubtag(langSubtag),
      sourceColumn: column,
      label: langDisplayName(langSubtag),
    };
  }

  if (columnHasContent(rows, column)) {
    return { column, rawValue: normalize(rawLocale) };
  }

  // No parseable locale code and no real content in this column — treat as absent.
  return null;
}

/** Resolves the workbook's locale list from its Language_Country metadata (columns C
 * and D) plus the always-present English source locale (column B). */
export function resolveLocales(meta: WorkbookMeta, rows: RawRow[]): LocaleResolution {
  const locales: LocaleInfo[] = [ENGLISH_LOCALE];
  const unresolved: UnresolvedLocale[] = [];

  for (const column of ["C", "D"] as const) {
    const result = resolveColumn(meta.languageCountry[column], column, rows);
    if (result === null) continue;
    if ("code" in result) locales.push(result);
    else unresolved.push(result);
  }

  return { locales, unresolved };
}
