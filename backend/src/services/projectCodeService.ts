import { AppDataSource } from "../config/data-source";
import { ProjectCode } from "../entities/ProjectCode";
import { ConflictError, NotFoundError, ProjectCodeClosedError } from "../utils/errors";

/** Every project code, newest first — the admin management view (shows both
 * open and closed). */
export function listProjectCodes(): Promise<ProjectCode[]> {
  return AppDataSource.getRepository(ProjectCode).find({ order: { createdAt: "DESC" } });
}

/** Only the open ones, code ascending — what the upload form's dropdown
 * offers to any authenticated user (a closed code shouldn't even appear as an
 * option, not just be rejected on submit). */
export function listOpenProjectCodes(): Promise<ProjectCode[]> {
  return AppDataSource.getRepository(ProjectCode).find({ where: { isOpen: true }, order: { code: "ASC" } });
}

/** Creates a new project code, open by default. Rejects an exact-duplicate
 * code (case-insensitive) with a 409 rather than a raw DB unique-constraint
 * error, so the admin UI can show a meaningful message. */
export async function createProjectCode(code: string): Promise<ProjectCode> {
  const trimmed = code.trim();
  const repo = AppDataSource.getRepository(ProjectCode);

  const existing = await repo
    .createQueryBuilder("projectCode")
    .where("LOWER(projectCode.code) = LOWER(:code)", { code: trimmed })
    .getOne();
  if (existing) {
    throw new ConflictError(`Project code "${trimmed}" already exists`);
  }

  return repo.save(repo.create({ code: trimmed, isOpen: true }));
}

/** Toggles a project code open/closed. Returns null if the id doesn't exist —
 * callers map that to a 404, same convention as the rest of the admin API. */
export async function setProjectCodeOpen(id: string, isOpen: boolean): Promise<ProjectCode | null> {
  const repo = AppDataSource.getRepository(ProjectCode);
  const existing = await repo.findOne({ where: { id } });
  if (!existing) return null;

  existing.isOpen = isOpen;
  return repo.save(existing);
}

/**
 * Called from uploadService.createUpload before anything is written to disk:
 * throws NotFoundError if no project code matches (an admin never created it,
 * or it was mistyped client-side — the dropdown should prevent this, but the
 * server never trusts the client alone) or ProjectCodeClosedError if an admin
 * has since closed it. A no-op (resolves) if it's open.
 */
export async function assertProjectCodeOpenForUpload(code: string): Promise<void> {
  const projectCode = await AppDataSource.getRepository(ProjectCode).findOne({ where: { code } });
  if (!projectCode) {
    throw new NotFoundError(`Unknown project code "${code}"`);
  }
  if (!projectCode.isOpen) {
    throw new ProjectCodeClosedError(`Project code "${code}" is closed for new uploads`);
  }
}
