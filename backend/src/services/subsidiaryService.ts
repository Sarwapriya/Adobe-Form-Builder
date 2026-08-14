import { AppDataSource } from "../config/data-source";
import { Subsidiary } from "../entities/Subsidiary";
import { SubsidiaryProjectBlock } from "../entities/SubsidiaryProjectBlock";
import { User } from "../entities/User";
import { ConflictError, NotFoundError, SubsidiaryInactiveError } from "../utils/errors";

/** Every subsidiary, active and inactive alike, name ascending — the admin
 * management view (needs to see disabled ones too, to re-enable them). */
export function listSubsidiaries(): Promise<Subsidiary[]> {
  return AppDataSource.getRepository(Subsidiary).find({ order: { name: "ASC" } });
}

/** Only the active ones — what the upload form's and user-creation form's
 * "Subsidiary" dropdowns offer to any authenticated user (a disabled
 * subsidiary shouldn't even appear as an option, not just be rejected on
 * submit). */
export function listActiveSubsidiaries(): Promise<Subsidiary[]> {
  return AppDataSource.getRepository(Subsidiary).find({ where: { isActive: true }, order: { name: "ASC" } });
}

/**
 * Creates a new subsidiary, active by default. Rejects an exact-duplicate
 * name (case-insensitive) with a 409 rather than a raw DB unique-constraint
 * error, so the admin UI can show a meaningful message.
 *
 * Also re-enables every User scoped to this subsidiary name — the mirror
 * image of deleteSubsidiary's own cascade below: re-adding a subsidiary that
 * was previously deleted (and so had auto-disabled its users) brings those
 * accounts back automatically, without an admin having to hunt them down one
 * by one. A no-op update if no such users exist (a genuinely new name).
 */
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

  const created = await repo.save(repo.create({ name: trimmed, isActive: true }));
  await AppDataSource.getRepository(User).update({ subsidiaryId: trimmed }, { isActive: true });
  return created;
}

/** Toggles a subsidiary active/inactive — the reversible way to block every
 * project for it in one step (independent of, and layered above,
 * SubsidiaryProjectBlock's own per-project restriction). Returns null if the
 * id doesn't exist — callers map that to a 404, same convention as the rest
 * of the admin API. */
export async function setSubsidiaryActive(id: string, isActive: boolean): Promise<Subsidiary | null> {
  const repo = AppDataSource.getRepository(Subsidiary);
  const existing = await repo.findOne({ where: { id } });
  if (!existing) return null;

  existing.isActive = isActive;
  return repo.save(existing);
}

export interface SubsidiaryNotificationEmails {
  /** Each explicit `null` clears that slot; an omitted key leaves it as-is —
   * same "presence vs value" convention projectCodeService.setProjectCodeDateRange
   * uses for its own optional fields. */
  notificationEmail1?: string | null;
  notificationEmail2?: string | null;
}

/** Updates a subsidiary's up-to-two extra notification recipient addresses
 * (see Subsidiary.notificationEmail1/2's own doc comment). Returns null if the
 * id doesn't exist. */
export async function setSubsidiaryNotificationEmails(id: string, emails: SubsidiaryNotificationEmails): Promise<Subsidiary | null> {
  const repo = AppDataSource.getRepository(Subsidiary);
  const existing = await repo.findOne({ where: { id } });
  if (!existing) return null;

  if ("notificationEmail1" in emails) {
    existing.notificationEmail1 = emails.notificationEmail1?.trim() || null;
  }
  if ("notificationEmail2" in emails) {
    existing.notificationEmail2 = emails.notificationEmail2?.trim() || null;
  }
  return repo.save(existing);
}

/**
 * Permanently removes a subsidiary — the irreversible alternative to
 * disabling it. Upload.subsidiaryId/User.subsidiaryId are plain text
 * snapshots, not foreign keys, so historical *upload* records are untouched.
 * Also removes any SubsidiaryProjectBlock rows naming it, since a
 * restriction for a subsidiary that no longer exists is unreachable (matched
 * by name) and just clutters the admin list.
 *
 * Every User currently scoped to this subsidiary is disabled (User.isActive
 * = false) — with the subsidiary gone from the picklist there's no valid
 * value left for their account to upload under, so leaving them enabled
 * would just mean a login that can never successfully upload. See
 * createSubsidiary above for the mirror-image re-enable if the same name is
 * added back later. Returns false if the id didn't exist — callers map that
 * to a 404.
 */
export async function deleteSubsidiary(id: string): Promise<boolean> {
  const repo = AppDataSource.getRepository(Subsidiary);
  const existing = await repo.findOne({ where: { id } });
  if (!existing) return false;

  await AppDataSource.getRepository(SubsidiaryProjectBlock).delete({ subsidiaryName: existing.name });
  await AppDataSource.getRepository(User).update({ subsidiaryId: existing.name }, { isActive: false });
  await repo.delete({ id });
  return true;
}

/**
 * Called from uploadService.createUpload before anything is written to disk,
 * alongside the project code's own open check and the per-project
 * SubsidiaryProjectBlock check: throws NotFoundError if no subsidiary
 * matches (an admin never created it, or it was mistyped client-side — the
 * dropdown should prevent this, but the server never trusts the client
 * alone) or SubsidiaryInactiveError if an admin has since disabled it. A
 * no-op (resolves) if it's active.
 */
export async function assertSubsidiaryActiveForUpload(name: string): Promise<void> {
  const subsidiary = await AppDataSource.getRepository(Subsidiary).findOne({ where: { name } });
  if (!subsidiary) {
    throw new NotFoundError(`Unknown subsidiary "${name}"`);
  }
  if (!subsidiary.isActive) {
    throw new SubsidiaryInactiveError(`Subsidiary "${name}" is disabled for new uploads`);
  }
}
