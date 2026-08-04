// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseWorkbook } from "../../src/excel/parser";
import { mapWorkbook } from "../../src/excel/mapper";

const DOCS_DIR = path.resolve(import.meta.dirname, "../../../../Documents");

function mapFile(file: string) {
  const buf = readFileSync(path.join(DOCS_DIR, file));
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  const parsed = parseWorkbook(arrayBuffer, file);
  return mapWorkbook(parsed);
}

describe("mapWorkbook against real sample files", () => {
  it("SEIL: 4 real questions (Q5/Q6 placeholder-skipped), correct control types, no hard errors", () => {
    const { form, issues } = mapFile("SEIL-country-F2H26-Translation Document.xlsx");
    expect(form.questions.map((q) => q.id)).toEqual(["Q1", "Q2", "Q3", "Q4"]);
    expect(form.questions.map((q) => q.controlType)).toEqual(["radio", "checkbox", "radio", "checkbox"]);
    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
    // Q5/Q6 placeholder skip is reported as a warning, not silently dropped.
    const placeholderWarnings = issues.filter((i) => /placeholder/.test(i.message));
    expect(placeholderWarnings.length).toBe(2);
  });

  it("SEIL: question text and answers resolve per locale, Hebrew/Arabic both present", () => {
    const { form } = mapFile("SEIL-country-F2H26-Translation Document.xlsx");
    const q1 = form.questions[0]!;
    expect(q1.headingByLocale["en_GB"]).toBe("I am currently using");
    expect(q1.headingByLocale["he_IL"]).toBe("הטלפון שלי כרגע הוא");
    expect(q1.headingByLocale["ar_PS"]).toBe("هاتفي الآن هو");
    expect(q1.answers.map((a) => a.textByLocale["en_GB"])).toEqual(["Galaxy", "iPhone", "Others"]);
  });

  it("SEIL: profile fields, privacy policy, and per-locale redirect URL are captured", () => {
    const { form } = mapFile("SEIL-country-F2H26-Translation Document.xlsx");
    expect(form.fields.email?.labelByLocale["en_GB"]).toBe("E-mail");
    expect(form.fields.firstName?.labelByLocale["en_GB"]).toBe("First Name");
    expect(form.fields.submitButton.labelByLocale["en_GB"]).toBe("Submit");
    expect(form.fields.privacyPolicy?.linkUrlByLocale["en_GB"]).toBe("https://www.samsung.com/ae/info/privacy/");
    expect(form.fields.redirectAfterSuccessUrlByLocale?.["en_GB"]).toBe(
      "https://www.samsung.com/ae/unpacked/thank-you",
    );
    // "Rafle Draw" has no dedicated model field — must be preserved via the passthrough bucket.
    expect(form.fields.extraFieldsByLocale?.["Rafle Draw"]?.["en_GB"]).toContain("Raffle Draw");
  });

  it("SEIL: pageError and thankYou sections are correctly disambiguated (not conflated)", () => {
    const { form } = mapFile("SEIL-country-F2H26-Translation Document.xlsx");
    expect(form.pageError["en_GB"]?.heading).toBe("Something went wrong.");
    expect(form.thankYou["en_GB"]?.heading).toBe("Thank you for your interest");
    expect(form.pageError["en_GB"]?.heading).not.toBe(form.thankYou["en_GB"]?.heading);
  });

  it("SGE: Q2 keeps original A6/A8 ids (source skips A7) but sequential order 1..8", () => {
    const { form, issues } = mapFile("SGE-lang-country-F2H26-Translation Document_Ar V3_final.xlsx");
    const q2 = form.questions.find((q) => q.id === "Q2")!;
    expect(q2.answers.map((a) => a.id)).toEqual(["A1", "A2", "A3", "A4", "A5", "A6", "A8", "A9"]);
    expect(q2.answers.map((a) => a.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
  });

  it("SGE: Q5 has no marker row, defaults to radio with a warning (not an error)", () => {
    const { form, issues } = mapFile("SGE-lang-country-F2H26-Translation Document_Ar V3_final.xlsx");
    const q5 = form.questions.find((q) => q.id === "Q5")!;
    expect(q5.controlType).toBe("radio");
    expect(issues.some((i) => i.severity === "warning" && /no .*marker/i.test(i.message))).toBe(true);
  });

  it("SGE: Q6 placeholder skipped, unresolved column-C locale surfaced (not silently dropped)", () => {
    const { form, unresolvedLocales } = mapFile("SGE-lang-country-F2H26-Translation Document_Ar V3_final.xlsx");
    expect(form.questions.find((q) => q.id === "Q6")).toBeUndefined();
    expect(unresolvedLocales).toEqual([{ column: "C", rawValue: "Language / Country" }]);
  });

  for (const file of [
    "SEIL-country-F2H26-Translation Document.xlsx",
    "SETK-tr-TR-F2H26-Translation Document(1).xlsx",
    "SGE-lang-country-F2H26-Translation Document_Ar V3_final.xlsx",
    "Sub-lang-country-F2H26-Translation Document - SESAR.xlsx",
  ]) {
    it(`${file}: no unrecognized-key issues (every non-blank column-A key is understood)`, () => {
      const { issues } = mapFile(file);
      const unrecognized = issues.filter((i) => /Unrecognized row key/.test(i.message));
      expect(unrecognized).toEqual([]);
    });

    it(`${file}: no orphan-answer or duplicate-question errors`, () => {
      const { issues } = mapFile(file);
      const structuralErrors = issues.filter((i) => i.severity === "error");
      expect(structuralErrors).toEqual([]);
    });
  }
});
