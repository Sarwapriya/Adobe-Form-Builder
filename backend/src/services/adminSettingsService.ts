import { AppDataSource } from "../config/data-source";
import { AdminSetting } from "../entities/AdminSetting";

/**
 * Reads a single AdminSettings value by key. Returns null if the key has no
 * row rather than throwing — every current caller treats an unset setting as
 * "fall back to a sensible default," not as an error condition.
 */
export async function getAdminSetting(key: string): Promise<string | null> {
  const setting = await AppDataSource.getRepository(AdminSetting).findOne({ where: { key } });
  return setting?.value ?? null;
}

/**
 * Upserts (or, for a null/blank value, deletes) a single AdminSettings row.
 * `AdminSetting.value` is NOT NULL, so "unset" is represented by the row's
 * absence rather than an empty string — matching getAdminSetting's own
 * "no row = null" convention, not a stored empty string that would need
 * special-casing on every read.
 */
export async function setAdminSetting(key: string, value: string | null): Promise<void> {
  const repo = AppDataSource.getRepository(AdminSetting);
  const trimmed = value?.trim();
  if (!trimmed) {
    await repo.delete({ key });
    return;
  }
  const existing = await repo.findOne({ where: { key } });
  if (existing) {
    existing.value = trimmed;
    await repo.save(existing);
  } else {
    await repo.save(repo.create({ key, value: trimmed }));
  }
}
