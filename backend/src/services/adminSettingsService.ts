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
