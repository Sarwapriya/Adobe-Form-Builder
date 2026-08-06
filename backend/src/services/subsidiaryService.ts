import { AppDataSource } from "../config/data-source";
import { Subsidiary } from "../entities/Subsidiary";
import { ConflictError } from "../utils/errors";

/** Every subsidiary, name ascending — populates both the upload form's
 * "Subsidiary" dropdown (any authenticated user) and the admin management
 * views. There's no open/closed distinction on a subsidiary itself; see
 * subsidiaryProjectBlockService.ts for the actual per-subsidiary upload
 * restriction, always scoped to one project code. */
export function listSubsidiaries(): Promise<Subsidiary[]> {
  return AppDataSource.getRepository(Subsidiary).find({ order: { name: "ASC" } });
}

/** Creates a new subsidiary. Rejects an exact-duplicate name (case-
 * insensitive) with a 409 rather than a raw DB unique-constraint error, so
 * the admin UI can show a meaningful message. */
export async function createSubsidiary(name: string): Promise<Subsidiary> {
  const trimmed = name.trim();
  const repo = AppDataSource.getRepository(Subsidiary);

  const existing = await repo
    .createQueryBuilder("subsidiary")
    .where("LOWER(subsidiary.name) = LOWER(:name)", { name: trimmed })
    .getOne();
  if (existing) {
    throw new ConflictError(`Subsidiary "${trimmed}" already exists`);
  }

  return repo.save(repo.create({ name: trimmed }));
}
