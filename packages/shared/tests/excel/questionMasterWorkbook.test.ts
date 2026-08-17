import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { buildQuestionMasterWorkbook } from "../../src/excel/questionMasterWorkbook";
import type { QuestionMasterRow } from "../../src/excel/questionMasterRows";

const SAMPLE_ROWS: QuestionMasterRow[] = [
  {
    division: "MX",
    project: "F2H26",
    subsidiary: "SEIL",
    country_alpha_2: "PS",
    locale: "ar_PS",
    question_code: "FIRSTNAME",
    question_text_full: "الاسم الأول",
    question_text_alias: "firstname",
    mandatory_yn: "Y",
    local_yn: "Standard",
    type: "Free text",
    answer_code: "firstName",
    answer_text_full: "الاسم الأول",
    answer_text_alias: "firstname",
  },
  {
    division: "MX",
    project: "F2H26",
    subsidiary: "SEIL",
    country_alpha_2: "PS",
    locale: "ar_PS",
    question_code: "HPP_CODE",
    question_text_full: "رقم الهاتف المتحرّك",
    question_text_alias: "mobileNumber",
    mandatory_yn: "N",
    local_yn: "Local",
    type: "Free text",
    answer_code: "mobileNumber",
    answer_text_full: "رقم الهاتف المتحرّك",
    answer_text_alias: "mobileNumber",
  },
];

describe("buildQuestionMasterWorkbook", () => {
  it("round-trips: headers and row content survive a write-then-read cycle", () => {
    const bytes = buildQuestionMasterWorkbook(SAMPLE_ROWS);
    const workbook = XLSX.read(bytes, { type: "array" });

    expect(workbook.SheetNames).toEqual(["Question Master"]);
    const sheet = workbook.Sheets["Question Master"];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { raw: false, defval: "" });

    expect(rows).toHaveLength(2);
    expect(Object.keys(rows[0])).toEqual([
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
    ]);
    expect(rows[0]).toMatchObject({
      division: "MX",
      project: "F2H26",
      subsidiary: "SEIL",
      country_alpha_2: "PS",
      locale: "ar_PS",
      question_code: "FIRSTNAME",
      question_text_full: "الاسم الأول",
      question_text_alias: "firstname",
      mandatory_yn: "Y",
      local_yn: "Standard",
      type: "Free text",
      answer_code: "firstName",
    });
    expect(rows[1].question_code).toBe("HPP_CODE");
    expect(rows[1].local_yn).toBe("Local");
    expect(rows[1].answer_code).toBe("mobileNumber");
  });

  it("produces an empty-but-valid sheet (headers only) for zero rows", () => {
    const bytes = buildQuestionMasterWorkbook([]);
    const workbook = XLSX.read(bytes, { type: "array" });
    const sheet = workbook.Sheets["Question Master"];
    const rows = XLSX.utils.sheet_to_json(sheet);
    expect(rows).toHaveLength(0);
  });

  // Regression test: XLSX.write(..., { type: "array" }) actually returns a raw
  // ArrayBuffer, not a Uint8Array — Node's fs.writeFile rejects a bare ArrayBuffer
  // outright (TypeError), which broke every real generate call (caught only in
  // production, not by the round-trip test above, since XLSX.read happily accepts
  // an ArrayBuffer too and never exercises the actual file-write path
  // questionMasterService.ts uses). Asserting the concrete type and doing a real
  // fs.writeFileSync closes that gap.
  it("returns a real Uint8Array that Node's fs.writeFile actually accepts", () => {
    const bytes = buildQuestionMasterWorkbook(SAMPLE_ROWS);
    expect(bytes).toBeInstanceOf(Uint8Array);

    const dir = mkdtempSync(path.join(tmpdir(), "question-master-"));
    const filePath = path.join(dir, "question-master.xlsx");
    try {
      writeFileSync(filePath, bytes);
      const readBack = XLSX.read(readFileSync(filePath));
      expect(readBack.SheetNames).toEqual(["Question Master"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
