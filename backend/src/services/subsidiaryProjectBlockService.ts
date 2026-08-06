import { AppDataSource } from "../config/data-source";
import { SubsidiaryProjectBlock } from "../entities/SubsidiaryProjectBlock";
import { ConflictError, SubsidiaryProjectBlockedError } from "../utils/errors";

/** Every currently-blocked (subsidiary, project code) pair, newest first —
 * the admin management view. */
export function listSubsidiaryProjectBlocks(): Promise<SubsidiaryProjectBlock[]> {
  return AppDataSource.getRepository(SubsidiaryProjectBlock).find({ order: { createdAt: "DESC" } });
}

/** Blocks a (subsidiary, project code) pair from new uploads — exact-match on
 * both (both come from dropdowns, not free text). Rejects an exact-duplicate
 * pair with a 409 rather than a raw DB unique-constraint error. */
export async function createSubsidiaryProjectBlock(
  subsidiaryName: string,
  projectCode: string,
): Promise<SubsidiaryProjectBlock> {
  const repo = AppDataSource.getRepository(SubsidiaryProjectBlock);
  const existing = await repo.findOne({ where: { subsidiaryName, projectCode } });
  if (existing) {
    throw new ConflictError(`"${projectCode}" is already blocked for subsidiary "${subsidiaryName}"`);
  }
  return repo.save(repo.create({ subsidiaryName, projectCode }));
}

/** Unblocks a pair (deletes the row). Returns false if it wasn't blocked —
 * callers map that to a 404, same convention as the rest of the admin API. */
export async function deleteSubsidiaryProjectBlock(id: string): Promise<boolean> {
  const result = await AppDataSource.getRepository(SubsidiaryProjectBlock).delete({ id });
  return (result.affected ?? 0) > 0;
}

/**
 * Called from uploadService.createUpload before anything is written to disk,
 * alongside and independently of projectCodeService's own open check: throws
 * SubsidiaryProjectBlockedError if an admin has specifically blocked this
 * project code for this subsidiary. A no-op (resolves) otherwise — this is a
 * blocklist, not a picklist, so an unknown pair is simply not blocked.
 */
export async function assertNotBlocked(subsidiaryName: string, projectCode: string): Promise<void> {
  const blocked = await AppDataSource.getRepository(SubsidiaryProjectBlock).findOne({
    where: { subsidiaryName, projectCode },
  });
  if (blocked) {
    throw new SubsidiaryProjectBlockedError(
      `Project code "${projectCode}" is closed for new uploads from subsidiary "${subsidiaryName}"`,
    );
  }
}
