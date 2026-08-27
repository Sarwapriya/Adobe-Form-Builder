import { AppDataSource } from "../config/data-source";
import { Form } from "../entities/Form";
import { ProjectCode } from "../entities/ProjectCode";
import { SubsidiaryProjectBlock } from "../entities/SubsidiaryProjectBlock";
import { Upload } from "../entities/Upload";
import { ConflictError, NotFoundError, ProjectCodeClosedError, ProjectCodeLockedError } from "../utils/errors";
import { sendProjectLockedNotification } from "./emailService";
import { resolveSubsidiaryRecipients } from "./subsidiaryRecipients";

/** Every project code, newest first — the admin management view (shows both
 * open and closed). */
export function listProjectCodes(): Promise<ProjectCode[]> {
  return AppDataSource.getRepository(ProjectCode).find({ order: { createdAt: "DESC" } });
}

/** Only the open ones, code ascending — what the upload form's dropdown
 * offers to any authenticated user (a closed code shouldn't even appear as an
 * option, not just be rejected on submit). `excludeLocked` additionally drops
 * locked codes — pass `true` for a non-admin caller (a locked code shouldn't
 * even appear as an option for them either, same "don't just rely on the
 * submit-time rejection" reasoning as isOpen); admins stay exempt from the
 * lock (see ProjectCode.isLocked's own doc comment), so the route passes
 * `false` for them and locked codes remain selectable. */
export function listOpenProjectCodes(excludeLocked = false): Promise<ProjectCode[]> {
  return AppDataSource.getRepository(ProjectCode).find({
    where: excludeLocked ? { isOpen: true, isLocked: false } : { isOpen: true },
    order: { code: "ASC" },
  });
}

/**
 * Only the open ones, minus any an admin has specifically blocked for this
 * subsidiary (see subsidiaryProjectBlockService.ts) — what the upload form's
 * "Project Code" dropdown offers once a subsidiary is selected. A project
 * code closed globally never appears here regardless of subsidiary; one
 * that's only blocked for *this* subsidiary is filtered out here but would
 * still appear for any other. `excludeLocked` — see listOpenProjectCodes.
 */
export async function listOpenProjectCodesForSubsidiary(subsidiaryName: string, excludeLocked = false): Promise<ProjectCode[]> {
  const [open, blocks] = await Promise.all([
    listOpenProjectCodes(excludeLocked),
    AppDataSource.getRepository(SubsidiaryProjectBlock).find({ where: { subsidiaryName } }),
  ]);
  const blockedCodes = new Set(blocks.map((b) => b.projectCode));
  return open.filter((pc) => !blockedCodes.has(pc.code));
}

export interface ProjectCodeDateRange {
  /** ISO date strings ("YYYY-MM-DD") from the admin UI's <input type="date">
   * fields, or null to clear a bound. Undefined leaves the existing value
   * untouched (see updateProjectCode below) — distinct from null. */
  startDate?: string | null;
  endDate?: string | null;
  /** Deadline for subsidiary users to get their contributions to this
   * project's forms approved — see ProjectCode.cutoffDate's own doc comment. */
  cutoffDate?: string | null;
}

/** Creates a new project code, open by default. Rejects an exact-duplicate
 * code (case-insensitive) with a 409 rather than a raw DB unique-constraint
 * error, so the admin UI can show a meaningful message. `startDate`/`endDate`
 * are purely descriptive (see ProjectCode entity's own doc comment) — never
 * enforced against uploads; `cutoffDate` is meaningful but likewise not
 * enforced here. */
export async function createProjectCode(code: string, dateRange: ProjectCodeDateRange = {}): Promise<ProjectCode> {
  const trimmed = code.trim();
  const repo = AppDataSource.getRepository(ProjectCode);

  const existing = await repo
    .createQueryBuilder("projectCode")
    .where("LOWER(projectCode.code) = LOWER(:code)", { code: trimmed })
    .getOne();
  if (existing) {
    throw new ConflictError(`Project code "${trimmed}" already exists`);
  }

  return repo.save(
    repo.create({
      code: trimmed,
      isOpen: true,
      startDate: dateRange.startDate ? new Date(dateRange.startDate) : null,
      endDate: dateRange.endDate ? new Date(dateRange.endDate) : null,
      cutoffDate: dateRange.cutoffDate ? new Date(dateRange.cutoffDate) : null,
    }),
  );
}

/**
 * Renames a project code's own text value. Rejects an exact-duplicate code
 * (case-insensitive, excluding this row itself) with the same ConflictError
 * createProjectCode uses, for the same reason: a raw DB unique-constraint
 * error isn't a message the admin UI can show directly. Returns null if the
 * id doesn't exist.
 *
 * This does NOT retroactively rename anything already uploaded — `Upload.
 * projectCode` is a plain text snapshot taken at upload time, not a foreign
 * key (see that column's own doc comment), so past uploads keep showing
 * whatever code was selected when they were made, same as a subsidiary
 * rename would leave `Upload.subsidiaryId`'s stored text alone.
 */
export async function setProjectCodeValue(id: string, code: string): Promise<ProjectCode | null> {
  const trimmed = code.trim();
  const repo = AppDataSource.getRepository(ProjectCode);
  const existing = await repo.findOne({ where: { id } });
  if (!existing) return null;

  const duplicate = await repo
    .createQueryBuilder("projectCode")
    .where("LOWER(projectCode.code) = LOWER(:code)", { code: trimmed })
    .andWhere("projectCode.id != :id", { id })
    .getOne();
  if (duplicate) {
    throw new ConflictError(`Project code "${trimmed}" already exists`);
  }

  existing.code = trimmed;
  return repo.save(existing);
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

/** Every distinct subsidiary with a Form (draft or published, undeleted) or an
 * Upload under the given project code — the recipient set for the
 * project-locked notification below, mirroring cutoffReminderService's own
 * "group Forms by subsidiaryId" shape. */
async function listSubsidiariesUnderProjectCode(code: string): Promise<string[]> {
  const [forms, uploads] = await Promise.all([
    AppDataSource.getRepository(Form).find({ where: { projectCode: code, isDeleted: false } }),
    AppDataSource.getRepository(Upload).find({ where: { projectCode: code } }),
  ]);
  const subsidiaryIds = new Set<string>();
  for (const form of forms) subsidiaryIds.add(form.subsidiaryId);
  for (const upload of uploads) subsidiaryIds.add(upload.subsidiaryId);
  return Array.from(subsidiaryIds);
}

/** Toggles a project code locked/unlocked — see ProjectCode.isLocked's own doc
 * comment for what locking actually blocks (subsidiary uploads/contributions) and how
 * it differs from isOpen. Returns null if the id doesn't exist. Locking it (not
 * unlocking) best-effort notifies every subsidiary that has a form or upload
 * under this code — see emailService.sendProjectLockedNotification — so nobody
 * is surprised their next upload/contribution gets rejected. */
export async function setProjectCodeLocked(id: string, isLocked: boolean): Promise<ProjectCode | null> {
  const repo = AppDataSource.getRepository(ProjectCode);
  const existing = await repo.findOne({ where: { id } });
  if (!existing) return null;

  const wasLocked = existing.isLocked;
  existing.isLocked = isLocked;
  const saved = await repo.save(existing);

  if (isLocked && !wasLocked) {
    void (async () => {
      const subsidiaryIds = await listSubsidiariesUnderProjectCode(saved.code);
      for (const subsidiaryId of subsidiaryIds) {
        const recipients = await resolveSubsidiaryRecipients(subsidiaryId);
        await sendProjectLockedNotification(recipients, { projectCode: saved.code, cutoffDate: saved.cutoffDate });
      }
    })();
  }

  return saved;
}

/** Updates a project code's campaign date range. Each field is applied only
 * if present in `dateRange` (an explicit `null` clears that bound; an
 * omitted key leaves it as-is) — lets the admin UI save just the field that
 * changed. Returns null if the id doesn't exist. */
export async function setProjectCodeDateRange(id: string, dateRange: ProjectCodeDateRange): Promise<ProjectCode | null> {
  const repo = AppDataSource.getRepository(ProjectCode);
  const existing = await repo.findOne({ where: { id } });
  if (!existing) return null;

  if ("startDate" in dateRange) {
    existing.startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
  }
  if ("endDate" in dateRange) {
    existing.endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
  }
  if ("cutoffDate" in dateRange) {
    existing.cutoffDate = dateRange.cutoffDate ? new Date(dateRange.cutoffDate) : null;
  }
  return repo.save(existing);
}

/**
 * Called from uploadService.createUpload before anything is written to disk,
 * and from formBuilderService.createForm/approveAdHocForm before a
 * Configuration form is created/approved against a project code: throws
 * NotFoundError if no project code matches (an admin never created it, or it
 * was mistyped client-side — the dropdown should prevent this, but the
 * server never trusts the client alone) or ProjectCodeClosedError if an
 * admin has since closed it. A no-op (resolves) if it's open.
 */
export async function assertProjectCodeOpen(code: string): Promise<void> {
  const projectCode = await AppDataSource.getRepository(ProjectCode).findOne({ where: { code } });
  if (!projectCode) {
    throw new NotFoundError(`Unknown project code "${code}"`);
  }
  if (!projectCode.isOpen) {
    throw new ProjectCodeClosedError(`Project code "${code}" is closed`);
  }
}

/**
 * Called from uploadService.createUpload alongside assertProjectCodeOpen,
 * but only for non-admin uploaders — see ProjectCode.isLocked's own doc comment for why
 * this is a separate, more permanent freeze from isOpen/closed. Throws NotFoundError if
 * no project code matches, or ProjectCodeLockedError if an admin has locked it. A no-op
 * (resolves) if it's unlocked.
 */
export async function assertProjectCodeUnlockedForUpload(code: string): Promise<void> {
  const projectCode = await AppDataSource.getRepository(ProjectCode).findOne({ where: { code } });
  if (!projectCode) {
    throw new NotFoundError(`Unknown project code "${code}"`);
  }
  if (projectCode.isLocked) {
    throw new ProjectCodeLockedError(`Project code "${code}" is locked for new uploads`);
  }
}
