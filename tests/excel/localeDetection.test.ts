// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseWorkbook } from "../../src/excel/parser.ts";
import { resolveLocales } from "../../src/excel/localeDetection.ts";

const DOCS_DIR = path.resolve(import.meta.dirname, "../../Documents");

function parse(file: string) {
  const buf = readFileSync(path.join(DOCS_DIR, file));
  const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  return parseWorkbook(arrayBuffer, file);
}

describe("resolveLocales against real sample files", () => {
  it("SEIL: resolves dual he_IL (C) + ar_PS (D) locales, both RTL", () => {
    const wb = parse("SEIL-country-F2H26-Translation Document.xlsx");
    const { locales, unresolved } = resolveLocales(wb.meta, wb.rows);
    expect(unresolved).toEqual([]);
    const codes = locales.map((l) => l.code);
    expect(codes).toEqual(["en_GB", "he_IL", "ar_PS"]);
    expect(locales.find((l) => l.code === "he_IL")?.isRtl).toBe(true);
    expect(locales.find((l) => l.code === "ar_PS")?.isRtl).toBe(true);
    expect(locales.find((l) => l.code === "en_GB")?.isRtl).toBe(false);
  });

  it("SETK: resolves tr_TR (C), drops empty D column silently", () => {
    const wb = parse("SETK-tr-TR-F2H26-Translation Document(1).xlsx");
    const { locales, unresolved } = resolveLocales(wb.meta, wb.rows);
    expect(unresolved).toEqual([]);
    expect(locales.map((l) => l.code)).toEqual(["en_GB", "tr_TR"]);
  });

  it("SGE: flags column C as unresolved (real Arabic content, placeholder metadata)", () => {
    const wb = parse("SGE-lang-country-F2H26-Translation Document_Ar V3_final.xlsx");
    const { locales, unresolved } = resolveLocales(wb.meta, wb.rows);
    expect(locales.map((l) => l.code)).toEqual(["en_GB"]);
    expect(unresolved).toEqual([{ column: "C", rawValue: "Language / Country" }]);
  });

  it("Sub-SESAR: resolves ar_SA (C), drops empty D column silently", () => {
    const wb = parse("Sub-lang-country-F2H26-Translation Document - SESAR.xlsx");
    const { locales, unresolved } = resolveLocales(wb.meta, wb.rows);
    expect(unresolved).toEqual([]);
    expect(locales.map((l) => l.code)).toEqual(["en_GB", "ar_SA"]);
    expect(locales.find((l) => l.code === "ar_SA")?.isRtl).toBe(true);
  });
});
