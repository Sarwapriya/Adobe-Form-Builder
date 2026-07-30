// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseWorkbook } from "../../src/excel/parser.ts";
import { mapWorkbook } from "../../src/excel/mapper.ts";
import { validateWorkbook } from "../../src/excel/validator.ts";
import type { MapResult } from "../../src/excel/mapper.ts";

const DOCS_DIR = path.resolve(import.meta.dirname, "../../Documents");

function validateFile(file: string) {
  const buf = readFileSync(path.join(DOCS_DIR, file));
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  const parsed = parseWorkbook(arrayBuffer, file);
  const mapped = mapWorkbook(parsed);
  return { validation: validateWorkbook(mapped, parsed.issues), mapped };
}

describe("validateWorkbook against real sample files", () => {
  it("SEIL/SETK/Sub-SESAR: no blocking errors, generation-ready", () => {
    for (const file of [
      "SEIL-country-F2H26-Translation Document.xlsx",
      "SETK-tr-TR-F2H26-Translation Document(1).xlsx",
      "Sub-lang-country-F2H26-Translation Document - SESAR.xlsx",
    ]) {
      const { validation } = validateFile(file);
      expect(validation.errors).toEqual([]);
    }
  });

  it("SEIL: flags the SEIL Q3/A1 multi-translation-in-one-cell mismatch as a warning", () => {
    const { validation } = validateFile("SEIL-country-F2H26-Translation Document.xlsx");
    expect(validation.errors).toEqual([]);
    expect(
      validation.warnings.some((w) => /multiple lines/.test(w.message) && /Q3 answer A1/.test(w.message)),
    ).toBe(true);
  });

  it("SGE: blocks generation until column C's language is confirmed", () => {
    const { validation } = validateFile("SGE-lang-country-F2H26-Translation Document_Ar V3_final.xlsx");
    expect(validation.errors.some((e) => /Column C/.test(e.message))).toBe(true);
  });
});

describe("validateWorkbook against hand-crafted broken fixtures", () => {
  function fixture(overrides: Partial<MapResult>): MapResult {
    const base: MapResult = {
      form: {
        meta: { subsidiary: "TEST", sourceFileName: "test.xlsx", defaultLocale: "en_GB" },
        locales: [{ code: "en_GB", langSubtag: "en", isRtl: false, sourceColumn: "en_GB", label: "English" }],
        questions: [
          {
            id: "Q1",
            order: 1,
            controlType: "radio",
            headingByLocale: { en_GB: "Pick one" },
            subheadingByLocale: {},
            required: true,
            answers: [{ id: "A1", order: 1, textByLocale: { en_GB: "Yes" } }],
          },
        ],
        fields: { submitButton: { labelByLocale: { en_GB: "Submit" } } },
        validationMessages: {},
        pageError: {},
        thankYou: {},
      },
      unresolvedLocales: [],
      issues: [],
    };
    return { ...base, ...overrides };
  }

  it("errors when no questions survived mapping", () => {
    const result = validateWorkbook(fixture({ form: { ...fixture({}).form, questions: [] } }), []);
    expect(result.errors.some((e) => /No usable questions/.test(e.message))).toBe(true);
  });

  it("errors when submitButton has no English label", () => {
    const base = fixture({});
    const result = validateWorkbook(
      { ...base, form: { ...base.form, fields: { submitButton: { labelByLocale: {} } } } },
      [],
    );
    expect(result.errors.some((e) => /submitButton/.test(e.message))).toBe(true);
  });

  it("warns on formula-like leading characters (Excel/CSV injection defense)", () => {
    const base = fixture({});
    base.form.questions[0]!.headingByLocale.en_GB = "=cmd|'/c calc'!A1";
    const result = validateWorkbook(base, []);
    expect(result.warnings.some((w) => /formula-like/.test(w.message))).toBe(true);
  });

  it("propagates parser- and mapper-level errors/warnings by severity", () => {
    const result = validateWorkbook(fixture({}), [
      { severity: "error", sheet: "x", message: "boom" },
      { severity: "warning", sheet: "x", message: "hmm" },
    ]);
    expect(result.errors.some((e) => e.message === "boom")).toBe(true);
    expect(result.warnings.some((w) => w.message === "hmm")).toBe(true);
  });
});
