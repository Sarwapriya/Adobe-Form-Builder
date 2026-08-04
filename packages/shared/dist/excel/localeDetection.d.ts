import type { LocaleInfo } from "../form/formDefinition";
import type { RawRow, WorkbookMeta } from "./types";
export declare const ENGLISH_LOCALE: LocaleInfo;
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
/** Resolves the workbook's locale list from its Language_Country metadata (columns C
 * and D) plus the always-present English source locale (column B). */
export declare function resolveLocales(meta: WorkbookMeta, rows: RawRow[]): LocaleResolution;
