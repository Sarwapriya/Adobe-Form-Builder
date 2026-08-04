import type { ParsedWorkbook } from "./types";
export declare function isSupportedExcelFile(fileName: string): boolean;
/**
 * Parses the raw bytes of an uploaded workbook into a `ParsedWorkbook`: the located
 * "Complete Translations" sheet's header metadata (Subsidiary/Language_Country/Country)
 * plus every data row below it, columns resolved to logical roles by fuzzy header match
 * rather than hardcoded indices (so minor header whitespace/casing variance is tolerated).
 *
 * This function only understands sheet/row/column shape — it has no idea what "Q1" or
 * "A1" mean. Semantic interpretation of the row key column happens in mapper.ts.
 */
export declare function parseWorkbook(buffer: ArrayBuffer, sourceFileName: string): ParsedWorkbook;
