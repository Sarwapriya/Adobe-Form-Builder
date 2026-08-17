import type { QuestionMasterRow } from "./questionMasterRows";
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
export declare function buildQuestionMasterWorkbook(rows: QuestionMasterRow[]): Uint8Array;
