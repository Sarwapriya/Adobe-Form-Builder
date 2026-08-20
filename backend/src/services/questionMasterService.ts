import { randomUUID } from "node:crypto";
import fsp from "node:fs/promises";
import { buildQuestionMasterRows, buildQuestionMasterWorkbook, type FormDefinition, type QuestionMasterRow } from "@formbuilder/shared";
import { AppDataSource } from "../config/data-source";
import { Form } from "../entities/Form";
import { FormVersion } from "../entities/FormVersion";
import { ProjectCode } from "../entities/ProjectCode";
import { QuestionMasterVersion } from "../entities/QuestionMasterVersion";
import { Subsidiary } from "../entities/Subsidiary";
import { Upload, type UploadStatus } from "../entities/Upload";
import { absoluteFilePath, saveQuestionMasterFile } from "./fileService";
import { listContributionsForForm } from "./formContributionService";
import { generateFromWorkbook } from "./generationService";

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

export interface QuestionMasterReadinessItem {
  formId: string;
  formName: string;
  subsidiaryId: string;
  /** True once this form has been published at least once (`Form.publishedVersionId`
   * set). Purely `Form.status`-based — a form can be `published` here while still
   * having a newer, unmerged translation sitting in `pendingContribution` below, so
   * this alone doesn't mean the export actually reflects the latest content. */
  published: boolean;
  /** True when this form's *latest* contribution (a subsidiary user's proposed
   * translation/addition — see FormContribution.ts) is still "pending" admin review —
   * meaning it hasn't been merged into a new published FormVersion yet, so the
   * currently published definition Question Master reads from doesn't include it. A
   * form with no contributions at all, or whose latest one was already approved
   * (merged + republished) or rejected (never merged, nothing outstanding), is
   * `false` here. */
  pendingContribution: boolean;
  /** The actual gate used both for this UI and for `generateQuestionMaster`'s own
   * inclusion filter: published, with no unmerged pending contribution in the way. */
  readyForExport: boolean;
  /** Locale codes actually present in this form's *published* FormVersion.definition
   * (empty if never published) — lets an admin see at a glance exactly which locales
   * will feed the export, without needing to open the form itself. A locale a
   * subsidiary translated but that's missing here means either that translation was
   * never approved (see `pendingContribution`), or the admin never added that locale
   * to the form in the first place — a subsidiary can only translate into a locale
   * that already exists on the form (see contribution.ts's `validateContribution`),
   * never add a brand-new one themselves. */
  locales: string[];
}

async function hasPendingContribution(formId: string): Promise<boolean> {
  const contributions = await listContributionsForForm(formId);
  return contributions[0]?.status === "pending";
}

/** Every non-deleted Form under this project code belonging to a currently *active*
 * Subsidiary — the confirmed scope for both the readiness list and the generated
 * export. A project code can have more than one Form per subsidiary (no DB constraint
 * prevents it); each counts independently rather than picking "the" form for a
 * subsidiary. */
async function getRelevantForms(projectCode: string): Promise<Form[]> {
  const activeSubsidiaryNames = new Set(
    (await AppDataSource.getRepository(Subsidiary).find({ where: { isActive: true } })).map((s) => s.name),
  );
  const forms = await AppDataSource.getRepository(Form).find({ where: { projectCode, isDeleted: false } });
  return forms.filter((f) => activeSubsidiaryNames.has(f.subsidiaryId));
}

async function publishedLocales(form: Form): Promise<string[]> {
  if (!form.publishedVersionId) return [];
  const version = await AppDataSource.getRepository(FormVersion).findOne({ where: { id: form.publishedVersionId } });
  if (!version) return [];
  const definition = JSON.parse(version.definition) as FormDefinition;
  return definition.locales.map((l) => l.code);
}

export async function getReadiness(projectCode: string): Promise<QuestionMasterReadinessItem[]> {
  const forms = await getRelevantForms(projectCode);
  return Promise.all(
    forms.map(async (f) => {
      const published = f.status === "published" && f.publishedVersionId !== null;
      const [pendingContribution, locales] = await Promise.all([hasPendingContribution(f.id), publishedLocales(f)]);
      return {
        formId: f.id,
        formName: f.name,
        subsidiaryId: f.subsidiaryId,
        published,
        pendingContribution,
        readyForExport: published && !pendingContribution,
        locales,
      };
    }),
  );
}

// ---------------------------------------------------------------------------
// Excel-upload-based Question Master generation — additive only. Everything
// above this line (the Form-Initiator-based getReadiness/generateQuestionMaster
// process) is unchanged. This is a second, independent way to compile a
// Question Master: sourced from the Excel-upload flow's submitted `Upload`
// rows instead of Form Initiator's published `Form`s, for admins whose
// campaigns were run entirely through workbook uploads rather than the form
// builder. An admin explicitly chooses which of the two to run; neither
// replaces or is required by the other, and both write into the same
// QuestionMasterVersions version history (see `source` column) so a
// project's full export history stays in one place.
// ---------------------------------------------------------------------------

export interface QuestionMasterUploadReadinessItem {
  uploadId: string;
  fileName: string;
  subsidiaryId: string;
  status: UploadStatus;
  version: number | null;
  /** The gate used both for this UI and for `generateQuestionMasterFromUploads`'s own
   * inclusion filter — true only once this subsidiary's latest upload under the
   * project code has actually been submitted (assigned a version), matching
   * `readyForExport`'s role in `QuestionMasterReadinessItem` above. */
  readyForExport: boolean;
}

/** Every active subsidiary's most recent (by upload date) non-deleted Upload under a
 * project code — the Excel-upload-flow counterpart to `getRelevantForms` above. Unlike
 * Forms (one row per form, independently ready-or-not), an Upload's own "ready" state
 * is just its most recent attempt for this project code, since resubmitting supersedes
 * whatever came before it for that subsidiary. */
async function getRelevantUploads(projectCode: string): Promise<Upload[]> {
  const activeSubsidiaryNames = new Set(
    (await AppDataSource.getRepository(Subsidiary).find({ where: { isActive: true } })).map((s) => s.name),
  );
  const uploads = await AppDataSource.getRepository(Upload).find({ where: { projectCode, isDeleted: false } });

  const latestBySubsidiary = new Map<string, Upload>();
  for (const upload of uploads) {
    if (!activeSubsidiaryNames.has(upload.subsidiaryId)) continue;
    const current = latestBySubsidiary.get(upload.subsidiaryId);
    if (!current || upload.uploadDate > current.uploadDate) {
      latestBySubsidiary.set(upload.subsidiaryId, upload);
    }
  }
  return [...latestBySubsidiary.values()];
}

export async function getUploadReadiness(projectCode: string): Promise<QuestionMasterUploadReadinessItem[]> {
  const uploads = await getRelevantUploads(projectCode);
  return uploads.map((u) => ({
    uploadId: u.id,
    fileName: u.fileName,
    subsidiaryId: u.subsidiaryId,
    status: u.status,
    version: u.version,
    readyForExport: u.status === "submitted",
  }));
}

export type GenerateQuestionMasterFromUploadsOutcome = "ok" | "project_not_found" | "not_locked" | "no_uploads";

export interface GenerateQuestionMasterFromUploadsResult {
  outcome: GenerateQuestionMasterFromUploadsOutcome;
  version?: QuestionMasterVersion;
}

/**
 * Additive counterpart to `generateQuestionMaster` below: compiles Question Master
 * rows from the Excel-upload flow's submitted `Upload`s under a project code, instead
 * of Form Initiator's published `Form`s. `Upload` never persists a `FormDefinition` of
 * its own (only the source workbook + generated output files), so each one's
 * definition is re-derived by re-running the exact same parse/map pipeline the upload
 * itself was generated with (`generationService.generateFromWorkbook`, re-applying
 * that upload's own stored `questionOverrides` — same approach `regenerateUpload`
 * uses) against its stored source `.xlsx`.
 *
 * Same locking precondition and version-numbering scheme as `generateQuestionMaster`
 * (shared `QuestionMasterVersions` sequence per project code) — the two are otherwise
 * completely independent call paths.
 */
export async function generateQuestionMasterFromUploads(
  projectCode: string,
  division: string,
  generatedByUserId: string,
): Promise<GenerateQuestionMasterFromUploadsResult> {
  const projectCodeRow = await AppDataSource.getRepository(ProjectCode).findOne({ where: { code: projectCode } });
  if (!projectCodeRow) {
    return { outcome: "project_not_found" };
  }
  if (!projectCodeRow.isLocked) {
    return { outcome: "not_locked" };
  }

  const uploads = (await getRelevantUploads(projectCode)).filter((u) => u.status === "submitted");
  if (uploads.length === 0) {
    return { outcome: "no_uploads" };
  }

  const allRows: QuestionMasterRow[] = [];
  const subsidiaryIds = new Set<string>();
  for (const upload of uploads) {
    const buffer = await fsp.readFile(absoluteFilePath(upload.filePath));
    const requiredOverrides = upload.questionOverrides
      ? (JSON.parse(upload.questionOverrides) as Record<string, boolean>)
      : undefined;
    const { form } = generateFromWorkbook(toArrayBuffer(buffer), upload.fileName, requiredOverrides);
    allRows.push(...buildQuestionMasterRows(form, division, projectCode));
    subsidiaryIds.add(upload.subsidiaryId);
  }

  const workbookBytes = buildQuestionMasterWorkbook(allRows);
  const id = randomUUID();
  const filePath = await saveQuestionMasterFile(projectCode, id, workbookBytes);

  const version = await AppDataSource.transaction(async (manager) => {
    const rows: Array<{ nextVersion: number }> = await manager.query(
      `SELECT ISNULL(MAX(version), 0) + 1 AS nextVersion FROM QuestionMasterVersions WITH (UPDLOCK, HOLDLOCK) WHERE projectCode = @0`,
      [projectCode],
    );
    const nextVersion = rows[0].nextVersion;
    const repo = manager.getRepository(QuestionMasterVersion);
    const entity = repo.create({
      id,
      projectCode,
      version: nextVersion,
      division,
      filePath,
      subsidiaryCount: subsidiaryIds.size,
      totalRows: allRows.length,
      generatedByUserId,
      source: "excel_upload",
    });
    return repo.save(entity);
  });
  return { outcome: "ok", version };
}

export type GenerateQuestionMasterOutcome = "ok" | "project_not_found" | "not_locked";

export interface GenerateQuestionMasterResult {
  outcome: GenerateQuestionMasterOutcome;
  version?: QuestionMasterVersion;
}

/**
 * Generates a new Question Master version for a project code: compiles every ready
 * form's `FormDefinition` under it into flat rows (see
 * `buildQuestionMasterRows`/`buildQuestionMasterWorkbook` in `@formbuilder/shared`),
 * writes the `.xlsx`, and persists the version row — assigning the next version number
 * inside a locked transaction, the same `WITH (UPDLOCK, HOLDLOCK)` pattern
 * `submissionService.submitUpload` uses for `Upload.version`, scoped here to
 * `projectCode` instead of `subsidiaryId`. `division` has no persisted home elsewhere in
 * the app — it's whatever the caller (the Generate dialog) passed in for this one run.
 *
 * Requires the project code to be locked first (`ProjectCode.isLocked`) — guarantees the
 * snapshot reflects a state nothing can still be edited out from under (see
 * `ProjectCode.isLocked`'s own doc comment). Returns `"not_locked"` rather than throwing,
 * matching this function's own outcome-result style.
 *
 * "Ready" here means `readyForExport` (see `QuestionMasterReadinessItem`'s own doc
 * comment) — published *and* with no unmerged pending contribution outstanding. A form
 * that's technically `published` but has a newer translation still awaiting admin
 * approval is excluded until that contribution is approved (merging it into a fresh
 * published version) or rejected, so a still-pending translation never silently goes
 * missing from the export.
 *
 * The row-storage id is minted upfront (`randomUUID()`) rather than derived from the
 * version number, so the on-disk path never depends on a value only known after the
 * transaction commits — same reasoning as `fileService.uploadStorageDir`.
 */
export async function generateQuestionMaster(
  projectCode: string,
  division: string,
  generatedByUserId: string,
): Promise<GenerateQuestionMasterResult> {
  const projectCodeRow = await AppDataSource.getRepository(ProjectCode).findOne({ where: { code: projectCode } });
  if (!projectCodeRow) {
    return { outcome: "project_not_found" };
  }
  if (!projectCodeRow.isLocked) {
    return { outcome: "not_locked" };
  }

  const forms = await getRelevantForms(projectCode);
  const readyForms: Form[] = [];
  for (const form of forms) {
    const published = form.status === "published" && form.publishedVersionId !== null;
    if (published && !(await hasPendingContribution(form.id))) {
      readyForms.push(form);
    }
  }

  const formVersionRepo = AppDataSource.getRepository(FormVersion);
  const allRows: QuestionMasterRow[] = [];
  const subsidiaryIds = new Set<string>();
  for (const form of readyForms) {
    const version = await formVersionRepo.findOne({ where: { id: form.publishedVersionId! } });
    if (!version) continue;
    const definition = JSON.parse(version.definition) as FormDefinition;
    allRows.push(...buildQuestionMasterRows(definition, division, projectCode));
    subsidiaryIds.add(form.subsidiaryId);
  }

  const workbookBytes = buildQuestionMasterWorkbook(allRows);
  const id = randomUUID();
  const filePath = await saveQuestionMasterFile(projectCode, id, workbookBytes);

  const version = await AppDataSource.transaction(async (manager) => {
    const rows: Array<{ nextVersion: number }> = await manager.query(
      `SELECT ISNULL(MAX(version), 0) + 1 AS nextVersion FROM QuestionMasterVersions WITH (UPDLOCK, HOLDLOCK) WHERE projectCode = @0`,
      [projectCode],
    );
    const nextVersion = rows[0].nextVersion;
    const repo = manager.getRepository(QuestionMasterVersion);
    const entity = repo.create({
      id,
      projectCode,
      version: nextVersion,
      division,
      filePath,
      subsidiaryCount: subsidiaryIds.size,
      totalRows: allRows.length,
      generatedByUserId,
    });
    return repo.save(entity);
  });
  return { outcome: "ok", version };
}

export async function listVersions(projectCode: string): Promise<QuestionMasterVersion[]> {
  return AppDataSource.getRepository(QuestionMasterVersion).find({
    where: { projectCode },
    order: { version: "DESC" },
  });
}

export type GetVersionFileOutcome = "not_found" | "ok";

export interface GetVersionFileResult {
  outcome: GetVersionFileOutcome;
  buffer?: Buffer;
  fileName?: string;
}

export async function getVersionFile(id: string): Promise<GetVersionFileResult> {
  const version = await AppDataSource.getRepository(QuestionMasterVersion).findOne({ where: { id } });
  if (!version) {
    return { outcome: "not_found" };
  }
  const buffer = await fsp.readFile(absoluteFilePath(version.filePath));
  return {
    outcome: "ok",
    buffer,
    fileName: `QuestionMaster_${version.projectCode}_v${version.version}.xlsx`,
  };
}
