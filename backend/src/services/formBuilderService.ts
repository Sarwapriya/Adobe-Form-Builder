import crypto from "node:crypto";
import {
  defaultBuilderConfig,
  generateSolution,
  resolveFileNames,
  validateFormDefinition,
  type BuilderConfig,
  type FileNames,
  type FormDefinition,
  type GeneratedFile,
  type ValidationResult,
} from "@formbuilder/shared";
import { AppDataSource } from "../config/data-source";
import { Form, type FormStatus } from "../entities/Form";
import { FormVersion, type FormVersionStatus } from "../entities/FormVersion";
import { GeneratedFile as GeneratedFileEntity, type GeneratedFileType } from "../entities/GeneratedFile";
import { resolvePaging, type PagedResult } from "../utils/queryParsing";
import { absoluteFilePath, saveFormVersionGeneratedFiles } from "./fileService";
import { classifyFileType } from "./generationService";
import { buildZip, type ZipEntry } from "./zipService";

/**
 * Builder-authored counterpart to generationService.generateFromWorkbook, minus the
 * parse/map step — the input is already a FormDefinition-shaped JSON blob (the
 * FormVersion's own `definition` column), not a workbook buffer. Uses
 * validateFormDefinition (the schema-authored counterpart to validateWorkbook) rather
 * than re-purposing the Excel-specific validator. Same "files: [] whenever there are
 * blocking errors" convention as the Excel path.
 */
function generateFromFormDefinition(
  form: FormDefinition,
  config: BuilderConfig,
): { validation: ValidationResult; files: GeneratedFile[]; fileNames: FileNames } {
  const validation = validateFormDefinition(form);
  const fileNames = resolveFileNames(form, config);
  const files = validation.errors.length === 0 ? generateSolution(form, config) : [];
  return { validation, files, fileNames };
}

function emptyFormDefinition(subsidiaryId: string): FormDefinition {
  return {
    meta: { subsidiary: subsidiaryId, sourceFileName: "", defaultLocale: "en_GB" },
    locales: [{ code: "en_GB", langSubtag: "en", isRtl: false, sourceColumn: "en_GB", label: "English" }],
    questions: [],
    fields: { submitButton: { labelByLocale: { en_GB: "Submit" } } },
    validationMessages: {},
    pageError: {},
    thankYou: {},
  };
}

function defaultConfig(): BuilderConfig {
  return { ...defaultBuilderConfig(), variants: ["ff", "oc"] };
}

/** The calling standard user's own latest-contribution progress for a form — drives
 * the 4-stage status bar on "My Forms" (Submitted → Reviewed by admin → Approved →
 * Published). `reviewedAt`/`publishedAt` being set is what actually advances the
 * bar; `status` alone distinguishes "approved, awaiting publish" from "published",
 * and separately flags "rejected" (shown as a reset/outlined-red bar instead of the
 * normal progression — see ContributionStatusBar.tsx). */
export interface ContributionProgress {
  status: "pending" | "approved" | "rejected";
  submittedAt: Date;
  reviewedAt: Date | null;
  publishedAt: Date | null;
}

export interface FormListItem {
  id: string;
  name: string;
  subsidiaryId: string;
  projectCode: string | null;
  status: FormStatus;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  publishedVersionNumber: number | null;
  /** Only ever populated by formAccessService's subsidiary-scoped listing, never by
   * admin's own listForms (there's no single "calling user" whose contribution
   * would apply) — null if they've never submitted one, undefined from the admin
   * listing so the two call sites stay distinguishable. */
  myContributionProgress?: ContributionProgress | null;
}

function toListItem(form: Form, publishedVersionNumber: number | null = null): FormListItem {
  return {
    id: form.id,
    name: form.name,
    subsidiaryId: form.subsidiaryId,
    projectCode: form.projectCode,
    status: form.status,
    createdByUserId: form.createdByUserId,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
    publishedVersionNumber,
  };
}

export interface FormVersionContent {
  id: string;
  definition: FormDefinition;
  config: BuilderConfig;
}

export interface FormDetail extends FormListItem {
  draft: FormVersionContent | null;
  published: (FormVersionContent & { versionNumber: number }) | null;
}

function parseVersionContent(version: FormVersion): FormVersionContent {
  return {
    id: version.id,
    definition: JSON.parse(version.definition) as FormDefinition,
    config: JSON.parse(version.config) as BuilderConfig,
  };
}

export interface CreateFormInput {
  name: string;
  subsidiaryId: string;
  projectCode?: string | null;
  userId: string;
}

/** Creates a new builder form: an empty draft FormVersion plus the Form row pointing
 * at it. No generation happens yet — a brand-new form has no questions, so it
 * wouldn't pass validateFormDefinition anyway (expected; only Publish enforces that). */
export async function createForm(input: CreateFormInput): Promise<FormListItem> {
  const { name, subsidiaryId, projectCode, userId } = input;

  return AppDataSource.transaction(async (manager) => {
    const formId = crypto.randomUUID();

    // Forms.id must exist before a FormVersion row can reference it as
    // FormVersions.formId (a NOT NULL FK) — create the Form row first (with
    // currentDraftVersionId temporarily null), then the FormVersion, then
    // backfill the pointer, rather than inserting in dependency-violating order.
    const formRepo = manager.getRepository(Form);
    await formRepo.save(
      formRepo.create({
        id: formId,
        name,
        subsidiaryId,
        projectCode: projectCode ?? null,
        status: "draft",
        currentDraftVersionId: null,
        publishedVersionId: null,
        createdByUserId: userId,
      }),
    );

    const versionRepo = manager.getRepository(FormVersion);
    const draftVersion = await versionRepo.save(
      versionRepo.create({
        formId,
        versionNumber: null,
        definition: JSON.stringify(emptyFormDefinition(subsidiaryId)),
        config: JSON.stringify(defaultConfig()),
        status: "draft",
        createdByUserId: userId,
      }),
    );

    await formRepo.update(formId, { currentDraftVersionId: draftVersion.id });
    const form = await formRepo.findOneOrFail({ where: { id: formId } });

    return toListItem(form);
  });
}

export interface ListFormsOptions {
  page?: number;
  pageSize?: number;
  status?: FormStatus;
  subsidiaryId?: string;
  search?: string;
}

/** Admin-facing list — every builder form regardless of who created it (this feature
 * has no per-user ownership model, unlike Uploads; both admin and superadmin share
 * identical access per the feature's own requirement). */
export async function listForms(options: ListFormsOptions = {}): Promise<PagedResult<FormListItem>> {
  const { page, pageSize, skip } = resolvePaging(options);

  const qb = AppDataSource.getRepository(Form)
    .createQueryBuilder("form")
    .where("form.isDeleted = :isDeleted", { isDeleted: false });

  if (options.status) {
    qb.andWhere("form.status = :status", { status: options.status });
  }
  if (options.subsidiaryId) {
    qb.andWhere("form.subsidiaryId = :subsidiaryId", { subsidiaryId: options.subsidiaryId });
  }
  if (options.search) {
    qb.andWhere("form.name LIKE :search", { search: `%${options.search}%` });
  }

  qb.orderBy("form.updatedAt", "DESC").skip(skip).take(pageSize);

  const [rows, total] = await qb.getManyAndCount();
  const publishedVersionIds = rows.map((f) => f.publishedVersionId).filter((id): id is string => id !== null);
  const publishedVersions = publishedVersionIds.length
    ? await AppDataSource.getRepository(FormVersion).find({ where: publishedVersionIds.map((id) => ({ id })) })
    : [];
  const versionNumberById = new Map(publishedVersions.map((v) => [v.id, v.versionNumber]));

  const items = rows.map((form) =>
    toListItem(form, form.publishedVersionId ? (versionNumberById.get(form.publishedVersionId) ?? null) : null),
  );
  return { items, total, page, pageSize };
}

export async function getFormDetail(formId: string): Promise<FormDetail | null> {
  const form = await AppDataSource.getRepository(Form).findOne({ where: { id: formId, isDeleted: false } });
  if (!form) return null;

  const versionRepo = AppDataSource.getRepository(FormVersion);
  const [draftVersion, publishedVersion] = await Promise.all([
    form.currentDraftVersionId ? versionRepo.findOne({ where: { id: form.currentDraftVersionId } }) : null,
    form.publishedVersionId ? versionRepo.findOne({ where: { id: form.publishedVersionId } }) : null,
  ]);

  return {
    ...toListItem(form, publishedVersion?.versionNumber ?? null),
    draft: draftVersion ? parseVersionContent(draftVersion) : null,
    published:
      publishedVersion && publishedVersion.versionNumber !== null
        ? { ...parseVersionContent(publishedVersion), versionNumber: publishedVersion.versionNumber }
        : null,
  };
}

export type UpdateDraftOutcome = "ok" | "not_found";

/** Saves the draft FormVersion's content in place ("Save Draft") — no validation gate
 * here (an incomplete in-progress draft is expected and fine to save); validation only
 * blocks Publish, below. */
export async function updateDraft(
  formId: string,
  definition: FormDefinition,
  config: BuilderConfig,
): Promise<UpdateDraftOutcome> {
  const form = await AppDataSource.getRepository(Form).findOne({ where: { id: formId, isDeleted: false } });
  if (!form || !form.currentDraftVersionId) return "not_found";

  await AppDataSource.getRepository(FormVersion).update(form.currentDraftVersionId, {
    definition: JSON.stringify(definition),
    config: JSON.stringify(config),
  });
  await AppDataSource.getRepository(Form).update(formId, { updatedAt: new Date() });
  return "ok";
}

export type PublishOutcome = "ok" | "not_found" | "invalid";

export interface PublishResult {
  outcome: PublishOutcome;
  validation?: ValidationResult;
}

/**
 * Validates and generates the current draft, persists its GeneratedFiles, assigns a
 * versionNumber inside a locked transaction (identical shape to
 * submissionService.submitUpload's Upload.version assignment — "assigned only at the
 * meaningful transition, never reused"), then clones the just-published content into a
 * fresh draft row so further edits never touch this now-published version's data or
 * on-disk output again (see FormVersion.ts's own doc comment for the full lifecycle).
 */
export async function publishForm(formId: string, userId: string): Promise<PublishResult> {
  const form = await AppDataSource.getRepository(Form).findOne({ where: { id: formId, isDeleted: false } });
  if (!form || !form.currentDraftVersionId) return { outcome: "not_found" };

  const versionRepo = AppDataSource.getRepository(FormVersion);
  const draftVersion = await versionRepo.findOne({ where: { id: form.currentDraftVersionId } });
  if (!draftVersion) return { outcome: "not_found" };

  const definition = JSON.parse(draftVersion.definition) as FormDefinition;
  const config = JSON.parse(draftVersion.config) as BuilderConfig;
  const generation = generateFromFormDefinition(definition, config);
  if (generation.validation.errors.length > 0) {
    return { outcome: "invalid", validation: generation.validation };
  }

  const saved = await saveFormVersionGeneratedFiles(form.subsidiaryId, draftVersion.id, generation.files);
  const generatedFileRepo = AppDataSource.getRepository(GeneratedFileEntity);
  const rows = saved.map((f) =>
    generatedFileRepo.create({
      formVersionId: draftVersion.id,
      fileName: f.fileName,
      filePath: f.relativePath,
      fileType: classifyFileType(f.fileName, generation.fileNames) as GeneratedFileType,
    }),
  );
  await generatedFileRepo.save(rows);

  const publishedAt = new Date();
  await AppDataSource.transaction(async (manager) => {
    const versionRows: Array<{ nextVersion: number }> = await manager.query(
      `SELECT ISNULL(MAX(versionNumber), 0) + 1 AS nextVersion FROM FormVersions WITH (UPDLOCK, HOLDLOCK) WHERE formId = @0`,
      [formId],
    );
    const nextVersion = versionRows[0].nextVersion;
    await manager.getRepository(FormVersion).update(draftVersion.id, {
      status: "published" as FormVersionStatus,
      versionNumber: nextVersion,
      publishedAt,
    });
    await manager.getRepository(Form).update(formId, {
      status: "published" as FormStatus,
      publishedVersionId: draftVersion.id,
      updatedAt: publishedAt,
    });
    // Any subsidiary contribution approved (merged onto the draft) since the last
    // publish is going live right now along with everything else in this draft —
    // stamp it so the submitter's status bar can show "Published" instead of
    // "Approved" (see formContributionService.approveContribution, which
    // deliberately never publishes on its own).
    await manager.query(
      `UPDATE FormContributions SET publishedAt = @0 WHERE formId = @1 AND status = 'approved' AND publishedAt IS NULL`,
      [publishedAt, formId],
    );
  });

  // Clone the just-published content into a fresh draft — further edits must never
  // mutate the version row that was just published (see this function's own doc
  // comment / FormVersion.ts).
  const newDraft = await versionRepo.save(
    versionRepo.create({
      formId,
      versionNumber: null,
      definition: draftVersion.definition,
      config: draftVersion.config,
      status: "draft",
      createdByUserId: userId,
    }),
  );
  await AppDataSource.getRepository(Form).update(formId, { currentDraftVersionId: newDraft.id });

  return { outcome: "ok", validation: generation.validation };
}

export type UnpublishOutcome = "ok" | "not_found" | "not_published";

/** Gates preview/download (see previewService.buildFormVersionPreview /
 * formBuilderService.buildFormZip) without deleting anything — re-publishing (or
 * simply the fact nothing was removed) makes the same content reachable again. */
export async function unpublishForm(formId: string): Promise<UnpublishOutcome> {
  const form = await AppDataSource.getRepository(Form).findOne({ where: { id: formId, isDeleted: false } });
  if (!form) return "not_found";
  if (form.status !== "published" || !form.publishedVersionId) return "not_published";

  await AppDataSource.getRepository(Form).update(formId, { status: "unpublished", updatedAt: new Date() });
  await AppDataSource.getRepository(FormVersion).update(form.publishedVersionId, { unpublishedAt: new Date() });
  return "ok";
}

export type DeleteFormOutcome = "ok" | "not_found";

/** Hard-deletes a form that's never been published (nothing downstream references it
 * yet — no GeneratedFiles rows can exist for it); soft-deletes (Form.isDeleted) one
 * that has, mirroring Upload.isDeleted's own audit-trail convention. */
export async function deleteForm(formId: string): Promise<DeleteFormOutcome> {
  const form = await AppDataSource.getRepository(Form).findOne({ where: { id: formId, isDeleted: false } });
  if (!form) return "not_found";

  if (form.publishedVersionId === null) {
    await AppDataSource.transaction(async (manager) => {
      await manager.getRepository(FormVersion).delete({ formId });
      await manager.getRepository(Form).delete(formId);
    });
    return "ok";
  }

  await AppDataSource.getRepository(Form).update(formId, { isDeleted: true });
  return "ok";
}

export interface FormVersionSummary {
  id: string;
  versionNumber: number | null;
  status: FormVersionStatus;
  createdAt: Date;
  publishedAt: Date | null;
  unpublishedAt: Date | null;
}

export async function listFormVersions(formId: string): Promise<FormVersionSummary[]> {
  const versions = await AppDataSource.getRepository(FormVersion).find({
    where: { formId },
    order: { createdAt: "DESC" },
  });
  return versions.map((v) => ({
    id: v.id,
    versionNumber: v.versionNumber,
    status: v.status,
    createdAt: v.createdAt,
    publishedAt: v.publishedAt,
    unpublishedAt: v.unpublishedAt,
  }));
}

export type FormZipOutcome = "not_found" | "no_files" | "unpublished" | "ok";

export interface FormZipResult {
  outcome: FormZipOutcome;
  buffer?: Uint8Array;
  fileName?: string;
}

/** Zips the published version's generated files — mirrors adminUploadService.buildUploadZip,
 * gated on the form actually being published (not merely having once been). */
export async function buildFormZip(formId: string): Promise<FormZipResult> {
  const form = await AppDataSource.getRepository(Form).findOne({ where: { id: formId, isDeleted: false } });
  if (!form) return { outcome: "not_found" };
  if (form.status !== "published" || !form.publishedVersionId) return { outcome: "unpublished" };

  const [files, publishedVersion] = await Promise.all([
    AppDataSource.getRepository(GeneratedFileEntity).find({ where: { formVersionId: form.publishedVersionId } }),
    AppDataSource.getRepository(FormVersion).findOne({ where: { id: form.publishedVersionId } }),
  ]);
  if (files.length === 0) return { outcome: "no_files" };

  const entries: ZipEntry[] = files.map((f) => ({ zipPath: f.fileName, absoluteFilePath: absoluteFilePath(f.filePath) }));
  const buffer = await buildZip(entries);
  const safeName = form.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const fileName = `${safeName}-v${publishedVersion?.versionNumber ?? "draft"}.zip`;
  return { outcome: "ok", buffer, fileName };
}
