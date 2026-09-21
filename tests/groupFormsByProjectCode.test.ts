import { describe, expect, it } from "vitest";
import { groupFormsByProjectCode } from "../src/components/formBuilder/groupFormsByProjectCode";

const form = (id: string, subsidiaryId: string, projectCode: string | null) => ({ id, subsidiaryId, projectCode });

describe("groupFormsByProjectCode", () => {
  it("groups by project code, then by subsidiary, keeping each subsidiary's form order", () => {
    const groups = groupFormsByProjectCode([
      form("1", "SEIL", "F2H26"),
      form("2", "SESAR", "F2H26"),
      form("3", "SEIL", "F2H26"),
      form("4", "SEIL", "S1H26"),
    ]);

    expect(groups.map((g) => g.projectCode)).toEqual(["F2H26", "S1H26"]);
    const f2h = groups[0];
    expect(f2h.formCount).toBe(3);
    expect(f2h.subsidiaries.map((s) => s.subsidiaryId)).toEqual(["SEIL", "SESAR"]);
    expect(f2h.subsidiaries[0].forms.map((f) => f.id)).toEqual(["1", "3"]);
    expect(f2h.subsidiaries[1].forms.map((f) => f.id)).toEqual(["2"]);
  });

  it("puts forms without a project code in one trailing group", () => {
    const groups = groupFormsByProjectCode([
      form("1", "SEIL", null),
      form("2", "SEIL", "A1"),
      form("3", "SESAR", "  "),
    ]);

    expect(groups.map((g) => g.projectCode)).toEqual(["A1", null]);
    expect(groups[1].formCount).toBe(2);
  });

  it("sorts project codes and subsidiaries naturally (numbers by value, case-insensitive)", () => {
    const groups = groupFormsByProjectCode([
      form("1", "sesar", "P10"),
      form("2", "SEIL", "P2"),
      form("3", "SEIL", "P10"),
    ]);

    expect(groups.map((g) => g.projectCode)).toEqual(["P2", "P10"]);
    expect(groups[1].subsidiaries.map((s) => s.subsidiaryId)).toEqual(["SEIL", "sesar"]);
  });

  it("returns nothing for an empty list", () => {
    expect(groupFormsByProjectCode([])).toEqual([]);
  });
});
