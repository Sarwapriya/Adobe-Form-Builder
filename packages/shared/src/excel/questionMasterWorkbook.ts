import * as XLSX from "xlsx";
import type { QuestionMasterRow } from "./questionMasterRows";

/** Exact column order of the reference Question Master workbooks in `Documents/`. */
const COLUMNS: (keyof QuestionMasterRow)[] = [
  "division",
  "project",
  "subsidiary",
  "country_alpha_2",
  "locale",
  "question_code",
  "question_text_full",
  "question_text_alias",
  "mandatory_yn",
  "local_yn",
  "type",
  "answer_code",
  "answer_text_full",
  "answer_text_alias",
];

/** Serializes Question Master rows into `.xlsx` bytes — the write-side counterpart to
 * `excel/parser.ts`'s read-only use of the same `xlsx` library. A single "Question
 * Master" sheet, header row first, columns in `COLUMNS` order regardless of row key
 * insertion order.
 *
 * `XLSX.write(..., { type: "array" })` actually returns a raw `ArrayBuffer`, not a
 * `Uint8Array` (verified against the installed xlsx version) — Node's `fs.writeFile`
 * rejects a bare `ArrayBuffer` outright (TypeError), so this wraps it in a real
 * `Uint8Array` view, which both `fs.writeFile` (a TypedArray) and `XLSX.read` (array-like)
 * accept. */
export function buildQuestionMasterWorkbook(rows: QuestionMasterRow[]): Uint8Array {
  const sheet = XLSX.utils.json_to_sheet(rows, { header: COLUMNS });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Question Master");
  const output = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Uint8Array(output);
}
