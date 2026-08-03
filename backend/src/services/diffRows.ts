import deepDiff from "deep-diff";

export type RowArray = Array<string | number | boolean | null>;

export interface ChangedCell {
  row: string;
  column: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface DiffResult {
  addedRows: RowArray[];
  removedRows: RowArray[];
  changedCells: ChangedCell[];
}

function rowKey(row: RowArray): string {
  return String(row[0] ?? "");
}

/**
 * Pure row-diff transform, deliberately dependency-free (no disk/DB/xlsx
 * access) so it's directly unit-testable without pulling in the app's
 * runtime stack. Takes each workbook's rows as row-major arrays (row 0 =
 * header) and matches data rows by first-column key.
 */
export function diffRows(oldRows: RowArray[], newRows: RowArray[]): DiffResult {
  const header = newRows[0] ?? oldRows[0] ?? [];
  const [, ...oldDataRows] = oldRows;
  const [, ...newDataRows] = newRows;

  const oldByKey = new Map(oldDataRows.map((row) => [rowKey(row), row]));
  const newByKey = new Map(newDataRows.map((row) => [rowKey(row), row]));

  const addedRows: RowArray[] = [];
  const removedRows: RowArray[] = [];
  const changedCells: ChangedCell[] = [];

  for (const [key, newRow] of newByKey) {
    if (!oldByKey.has(key)) {
      addedRows.push(newRow);
    }
  }

  for (const [key, oldRow] of oldByKey) {
    const newRow = newByKey.get(key);
    if (!newRow) {
      removedRows.push(oldRow);
      continue;
    }

    const edits = deepDiff.diff(oldRow, newRow) ?? [];
    for (const edit of edits) {
      if (edit.kind !== "E") continue;
      const columnIndex = Number((edit.path ?? [])[0]);
      const columnName = String(header[columnIndex] ?? `column_${columnIndex}`);
      changedCells.push({
        row: key,
        column: columnName,
        oldValue: edit.lhs,
        newValue: edit.rhs,
      });
    }
  }

  return { addedRows, removedRows, changedCells };
}
