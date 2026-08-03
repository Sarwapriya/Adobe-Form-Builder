import { describe, it, expect } from "vitest";
import { diffRows } from "../src/services/diffRows";

describe("diffRows", () => {
  const header = ["key", "english", "arabic"];

  it("detects rows added only in the new workbook", () => {
    const oldRows = [header, ["k1", "Hello", "مرحبا"]];
    const newRows = [header, ["k1", "Hello", "مرحبا"], ["k2", "Bye", "وداعا"]];

    const result = diffRows(oldRows, newRows);
    expect(result.addedRows).toEqual([["k2", "Bye", "وداعا"]]);
    expect(result.removedRows).toEqual([]);
    expect(result.changedCells).toEqual([]);
  });

  it("detects rows removed from the old workbook", () => {
    const oldRows = [header, ["k1", "Hello", "مرحبا"], ["k2", "Bye", "وداعا"]];
    const newRows = [header, ["k1", "Hello", "مرحبا"]];

    const result = diffRows(oldRows, newRows);
    expect(result.removedRows).toEqual([["k2", "Bye", "وداعا"]]);
    expect(result.addedRows).toEqual([]);
  });

  it("detects changed cells with column names and matches rows by first column, not position", () => {
    const oldRows = [header, ["k1", "Hello", "مرحبا"], ["k2", "Bye", "وداعا"]];
    // k2 inserted before k1 in the new workbook — a positional diff would
    // misreport this as two changed rows instead of zero.
    const newRows = [header, ["k2", "Bye", "وداعا"], ["k1", "Hi", "مرحبا"]];

    const result = diffRows(oldRows, newRows);
    expect(result.addedRows).toEqual([]);
    expect(result.removedRows).toEqual([]);
    expect(result.changedCells).toEqual([
      { row: "k1", column: "english", oldValue: "Hello", newValue: "Hi" },
    ]);
  });

  it("returns empty results for identical workbooks", () => {
    const rows = [header, ["k1", "Hello", "مرحبا"]];
    const result = diffRows(rows, rows.map((r) => [...r]));
    expect(result).toEqual({ addedRows: [], removedRows: [], changedCells: [] });
  });
});
