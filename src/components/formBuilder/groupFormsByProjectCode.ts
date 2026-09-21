export const NO_PROJECT_CODE_LABEL = "No project code";

interface Groupable {
  subsidiaryId: string;
  projectCode: string | null;
}

export interface SubsidiaryFormGroup<T> {
  subsidiaryId: string;
  forms: T[];
}

export interface ProjectCodeGroup<T> {
  /** `null` collects forms that have no project code yet. */
  projectCode: string | null;
  subsidiaries: SubsidiaryFormGroup<T>[];
  formCount: number;
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/** Project code -> subsidiary -> forms. Project codes and subsidiaries are sorted
 * alphabetically, "no project code" always last, and each subsidiary's forms keep
 * the order they came in (the API already returns them most-recently-updated first). */
export function groupFormsByProjectCode<T extends Groupable>(forms: T[]): ProjectCodeGroup<T>[] {
  const byCode = new Map<string | null, Map<string, T[]>>();
  for (const form of forms) {
    const code = form.projectCode?.trim() || null;
    const bySubsidiary = byCode.get(code) ?? new Map<string, T[]>();
    const list = bySubsidiary.get(form.subsidiaryId) ?? [];
    list.push(form);
    bySubsidiary.set(form.subsidiaryId, list);
    byCode.set(code, bySubsidiary);
  }

  return [...byCode.entries()]
    .map(([projectCode, bySubsidiary]) => {
      const subsidiaries = [...bySubsidiary.entries()]
        .map(([subsidiaryId, list]) => ({ subsidiaryId, forms: list }))
        .sort((a, b) => collator.compare(a.subsidiaryId, b.subsidiaryId));
      return { projectCode, subsidiaries, formCount: subsidiaries.reduce((n, s) => n + s.forms.length, 0) };
    })
    .sort((a, b) => {
      if (a.projectCode === null) return 1;
      if (b.projectCode === null) return -1;
      return collator.compare(a.projectCode, b.projectCode);
    });
}
