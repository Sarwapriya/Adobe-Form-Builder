// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { parseWorkbook } from "../../src/excel/parser";

const DOCS_DIR = path.resolve(import.meta.dirname, "../../../../Documents");
// Question Master workbooks (Documents/Question_Master_*.xlsx, QuestionMaster_*.xlsx)
// are a different report format entirely — a flat per-(subsidiary, locale,
// question/field) sheet consumed by questionMasterRows.ts, not a "Complete
// Translations" translation document — so they're excluded from this glob rather
// than failing the "no structural issues" assertions below, which assume the
// translation-document shape.
const files = readdirSync(DOCS_DIR).filter((f) => f.endsWith(".xlsx") && !/^question.?master/i.test(f));

describe("parseWorkbook against real sample files", () => {
  it("finds all 4 sample files", () => {
    expect(files.length).toBe(4);
  });

  for (const file of files) {
    it(`parses ${file} with no structural issues`, () => {
      const buf = readFileSync(path.join(DOCS_DIR, file));
      const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
      const result = parseWorkbook(arrayBuffer, file);

      expect(result.sheetNames).toContain("Complete Translations");
      expect(result.issues).toEqual([]);
      expect(result.rows.length).toBeGreaterThan(50);
      // row 10 (1-based Excel row number) is always Q1 in every sample file
      const q1Row = result.rows.find((r) => r.rowNumber === 10);
      expect(q1Row?.key).toBe("Q1");
      expect(q1Row?.englishText).toBe("I am currently using");
    });
  }

  it("extracts SEIL's dual Hebrew/Arabic Language_Country metadata", () => {
    const buf = readFileSync(path.join(DOCS_DIR, "SEIL-country-F2H26-Translation Document.xlsx"));
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    const result = parseWorkbook(arrayBuffer, "SEIL.xlsx");
    expect(result.meta.languageCountry).toEqual({ C: "he_IL", D: "ar_PS" });
    expect(result.meta.subsidiary).toEqual({ C: "SEIL", D: "SEIL" });
  });
});
