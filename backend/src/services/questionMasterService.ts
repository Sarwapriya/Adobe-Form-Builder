import { randomUUID } from "node:crypto";
import fsp from "node:fs/promises";
import { buildQuestionMasterRows, buildQuestionMasterWorkbook, type FormDefinition, type QuestionMasterRow } from "@formbuilder/shared";
import { AppDataSource } from "../config/data-source";
import { Form } from "../entities/Form";
import { FormVersion } from "../entities/FormVersion";
import { ProjectCode } from "../entities/ProjectCode";
import { QuestionMasterVersion } from "../entities/QuestionMasterVersion";
import { Subsidiary } from "../entities/Subsidiary";
import { absoluteFilePath, saveQuestionMasterFile } from "./fileService";
import { listContributionsForForm } from "./formContributionService";

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
 * inside a locked transaction (`WITH (UPDLOCK, HOLDLOCK)`), scoped to `projectCode`.
 * `division` has no persisted home elsewhere in the app — it's whatever the caller (the
 * Generate dialog) passed in for this one run.
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
 * transaction commits.
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
