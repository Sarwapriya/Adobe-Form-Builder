import { AppDataSource } from "../config/data-source";
import { SubsidiaryLocale } from "../entities/SubsidiaryLocale";
import { ConflictError } from "../utils/errors";

/** Every master locale row, every subsidiary — the admin management view. */
export function listAllSubsidiaryLocales(): Promise<SubsidiaryLocale[]> {
  return AppDataSource.getRepository(SubsidiaryLocale).find({
    order: { subsidiaryName: "ASC", sortOrder: "ASC" },
  });
}

/** One subsidiary's own allowed locale list, fallback first — the shape both
 * admin's Form Initiator convenience picker and a subsidiary user's own ad-hoc
 * locale picker consume. */
export function listSubsidiaryLocales(subsidiaryName: string): Promise<SubsidiaryLocale[]> {
  return AppDataSource.getRepository(SubsidiaryLocale).find({
    where: { subsidiaryName },
    order: { isFallback: "DESC", sortOrder: "ASC" },
  });
}

export interface CreateSubsidiaryLocaleInput {
  subsidiaryName: string;
  code: string;
  langSubtag: string;
  isRtl: boolean;
  label: string;
  isFallback: boolean;
}

/** Adds one locale to a subsidiary's master list. Rejects an exact-duplicate code
 * for that subsidiary with a 409, same convention as
 * subsidiaryProjectBlockService.createSubsidiaryProjectBlock. When `isFallback` is
 * true, first clears any other fallback for this subsidiary — exactly one row per
 * subsidiary is the designated fallback (enforced here, not the DB), mirroring
 * LocaleManagerPanel's own "first locale = fallback" convention. */
export async function addSubsidiaryLocale(input: CreateSubsidiaryLocaleInput): Promise<SubsidiaryLocale> {
  const repo = AppDataSource.getRepository(SubsidiaryLocale);
  const existing = await repo.findOne({ where: { subsidiaryName: input.subsidiaryName, code: input.code } });
  if (existing) {
    throw new ConflictError(`"${input.code}" is already on ${input.subsidiaryName}'s locale list`);
  }

  if (input.isFallback) {
    await repo.update({ subsidiaryName: input.subsidiaryName }, { isFallback: false });
  }

  const count = await repo.count({ where: { subsidiaryName: input.subsidiaryName } });
  return repo.save(repo.create({ ...input, sortOrder: count }));
}

/** Removes one locale from a subsidiary's master list. Returns false if it didn't
 * exist, callers map that to a 404 — same convention as
 * subsidiaryProjectBlockService.deleteSubsidiaryProjectBlock. */
export async function removeSubsidiaryLocale(id: string): Promise<boolean> {
  const result = await AppDataSource.getRepository(SubsidiaryLocale).delete({ id });
  return (result.affected ?? 0) > 0;
}
