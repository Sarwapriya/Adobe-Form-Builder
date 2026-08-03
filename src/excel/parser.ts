import * as XLSX from "xlsx";
import type { Issue, ParsedWorkbook, RawRow, WorkbookMeta } from "./types.ts";
import { normalize, normalizeLoose } from "./textUtils.ts";

const TARGET_SHEET_NAME = normalizeLoose("Complete Translations");
const SHEET_NAME_HINTS = ["translation", "complete", "translat"];
const METADATA_SCAN_ROWS = 15;
const HEADER_SCAN_ROWS = 10;

export function isSupportedExcelFile(fileName: string): boolean {
  return /\.(xlsx|xls)$/i.test(fileName.trim());
}

/**
 * Parses the raw bytes of an uploaded workbook into a `ParsedWorkbook`: the located
 * "Complete Translations" sheet's header metadata (Subsidiary/Language_Country/Country)
 * plus every data row below it, columns resolved to logical roles by fuzzy header match
 * rather than hardcoded indices (so minor header whitespace/casing variance is tolerated).
 *
 * This function only understands sheet/row/column shape — it has no idea what "Q1" or
 * "A1" mean. Semantic interpretation of the row key column happens in mapper.ts.
 */
export function parseWorkbook(buffer: ArrayBuffer, sourceFileName: string): ParsedWorkbook {
  const issues: Issue[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    return {
      sourceFileName,
      sheetNames: [],
      meta: emptyMeta(),
      headerRowNumber: 1,
      rows: [],
      issues: [{ severity: "error", sheet: "", message: "The file could not be read as a valid Excel workbook." }],
    };
  }

  // Try exact match first, then fuzzy match on known hints
  let sheetName = workbook.SheetNames.find((n) => normalizeLoose(n) === TARGET_SHEET_NAME);
  if (!sheetName) {
    sheetName = workbook.SheetNames.find((n) => {
      const loose = normalizeLoose(n);
      return SHEET_NAME_HINTS.some((hint) => loose.includes(hint));
    });
  }
  if (!sheetName) {
    return {
      sourceFileName,
      sheetNames: workbook.SheetNames,
      meta: emptyMeta(),
      headerRowNumber: 1,
      rows: [],
      issues: [
        {
          severity: "error",
          sheet: "",
          message: `No sheet named "Complete Translations" (or similar) was found. Sheets present: ${workbook.SheetNames.join(", ")}.`,
        },
      ],
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const grid: string[][] = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  const { keyCol, englishCol, translationCCol, translationDCol, headerRowNumber, headerIssues } = locateColumns(
    grid,
    sheetName,
  );
  issues.push(...headerIssues);

  const meta = extractMeta(grid, sheetName, englishCol, translationCCol, translationDCol, issues);

  const rows: RawRow[] = [];
  for (let r = 0; r < grid.length; r++) {
    const line = grid[r] ?? [];
    rows.push({
      rowNumber: r + 1,
      key: normalize(line[keyCol]),
      englishText: normalize(line[englishCol]),
      translationC: normalize(line[translationCCol]),
      translationD: normalize(line[translationDCol]),
    });
  }

  return { sourceFileName, sheetNames: workbook.SheetNames, meta, headerRowNumber, rows, issues };
}

function emptyMeta(): WorkbookMeta {
  return {
    subsidiary: { C: "", D: "" },
    languageCountry: { C: "", D: "" },
    country: { C: "", D: "" },
  };
}

interface ColumnLocation {
  keyCol: number;
  englishCol: number;
  translationCCol: number;
  translationDCol: number;
  /** 1-based Excel row number of the header row. */
  headerRowNumber: number;
  headerIssues: Issue[];
}

/** Various header text patterns that identify the English/source text column. */
const ENGLISH_HEADER_HINTS = [
  "originalengbtext",
  "originaltext",
  "sourcetext",
  "englishtext",
  "english",
  "original",
  "source",
];

/** Various header text patterns that identify a translation column. */
const TRANSLATION_HEADER_HINTS = [
  "completethistranslationcolumn",
  "translationcolumn",
  "translation",
  "translatetext",
  "targettext",
  "target",
];

/** Finds the header row (fuzzy match on English source / translation column headers),
 * and from it, the column indices for key/English/translation C/D. Falls back to the
 * observed-standard A/B/C/D layout, with a warning, if the header text can't be
 * located within the first few rows. */
function locateColumns(grid: string[][], sheetName: string): ColumnLocation {
  const headerIssues: Issue[] = [];

  for (let r = 0; r < Math.min(HEADER_SCAN_ROWS, grid.length); r++) {
    const line = grid[r] ?? [];

    // Find the English/source text column
    let englishCol = -1;
    for (let c = 0; c < line.length; c++) {
      const loose = normalizeLoose(line[c]);
      if (ENGLISH_HEADER_HINTS.some((hint) => loose.includes(hint))) {
        englishCol = c;
        break;
      }
    }
    if (englishCol === -1) continue;

    // Find translation columns
    const translationCols: number[] = [];
    for (let c = 0; c < line.length; c++) {
      if (c === englishCol) continue;
      const loose = normalizeLoose(line[c]);
      if (TRANSLATION_HEADER_HINTS.some((hint) => loose.includes(hint))) {
        translationCols.push(c);
      }
    }
    if (translationCols.length === 0) continue;

    return {
      keyCol: Math.max(0, englishCol - 1),
      englishCol,
      translationCCol: translationCols[0] ?? englishCol + 1,
      translationDCol: translationCols[1] ?? translationCols[0] ?? englishCol + 2,
      headerRowNumber: r + 1,
      headerIssues,
    };
  }

  headerIssues.push({
    severity: "warning",
    sheet: sheetName,
    row: 1,
    message:
      'Could not locate English/translation column headers within the first 10 rows; falling back to the standard A/B/C/D column layout.',
  });
  return { keyCol: 0, englishCol: 1, translationCCol: 2, translationDCol: 3, headerRowNumber: 1, headerIssues };
}

function extractMeta(
  grid: string[][],
  sheetName: string,
  englishCol: number,
  translationCCol: number,
  translationDCol: number,
  issues: Issue[],
): WorkbookMeta {
  const meta = emptyMeta();
  const found = { subsidiary: false, languageCountry: false, country: false };

  for (let r = 0; r < Math.min(METADATA_SCAN_ROWS, grid.length); r++) {
    const line = grid[r] ?? [];
    const label = normalizeLoose(line[englishCol]);
    const c = normalize(line[translationCCol]);
    const d = normalize(line[translationDCol]);

    if (label === "subsidiary") {
      meta.subsidiary = { C: c, D: d };
      found.subsidiary = true;
    } else if (label === "languagecountry") {
      meta.languageCountry = { C: c, D: d };
      found.languageCountry = true;
    } else if (label === "country") {
      meta.country = { C: c, D: d };
      found.country = true;
    }
  }

  if (!found.languageCountry) {
    issues.push({
      severity: "warning",
      sheet: sheetName,
      message: 'Could not locate a "Language_Country" metadata row in the first 15 rows.',
    });
  }

  return meta;
}
