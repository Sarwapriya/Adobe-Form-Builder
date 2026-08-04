export interface Issue {
  severity: "error" | "warning";
  sheet: string;
  /** 1-based Excel row number, when applicable. */
  row?: number;
  column?: string;
  message: string;
}

export interface ValidationResult {
  errors: Issue[];
  warnings: Issue[];
}

/** One raw data row from the "Complete Translations" sheet, columns already
 * resolved to their logical roles (key / English / translation C / translation D). */
export interface RawRow {
  rowNumber: number;
  key: string;
  englishText: string;
  translationC: string;
  translationD: string;
}

export interface WorkbookMeta {
  subsidiary: { C: string; D: string };
  languageCountry: { C: string; D: string };
  country: { C: string; D: string };
}

export interface ParsedWorkbook {
  sourceFileName: string;
  sheetNames: string[];
  meta: WorkbookMeta;
  /** 1-based Excel row number of the column-header row (e.g. "Original en_GB Text");
   * the semantic Q/A/field row-walk in mapper.ts starts immediately after this row. */
  headerRowNumber: number;
  rows: RawRow[];
  /** Structural issues found while locating the sheet/headers, before the semantic
   * Q/A/field row-walk in mapper.ts runs. */
  issues: Issue[];
}
