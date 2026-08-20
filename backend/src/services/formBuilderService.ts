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
import { Form, type FormOrigin, type FormStatus } from "../entities/Form";
import { FormContribution } from "../entities/FormContribution";
import { FormVersion, type FormVersionStatus } from "../entities/FormVersion";
import { GeneratedFile as GeneratedFileEntity, type GeneratedFileType } from "../entities/GeneratedFile";
import { resolvePaging, type PagedResult } from "../utils/queryParsing";
import { absoluteFilePath, saveFormVersionGeneratedFiles } from "./fileService";
import { classifyFileType } from "./generationService";
import { buildZip, type ZipEntry } from "./zipService";
import { sendAdHocReviewSubmittedNotification } from "./emailService";

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

/** Ad-hoc forms are Full Form only — a subsidiary user's own self-service form
 * never gets a One-Click variant (not requested for that flow; the builder UI
 * also never shows a way to add one back, see MyAdHocFormEditorPage.tsx). */
function defaultConfig(origin: FormOrigin): BuilderConfig {
  return { ...defaultBuilderConfig(), variants: origin === "adhoc" ? ["ff"] : ["ff", "oc"] };
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
  /** "admin" (Form Initiator) or "adhoc" (a subsidiary user's own My Forms
   * submission) — see Form.origin's own doc comment. */
  origin: FormOrigin;
  /** True while an adhoc submission awaits admin review — see
   * submitAdHocFormForReview/approveAdHocForm/rejectAdHocForm below. Always false
   * for "admin"-origin forms. */
  pendingReview: boolean;
  submittedForReviewAt: Date | null;
  reviewedAt: Date | null;
  /** Set on reject, shown to the subsidiary user; cleared on the next review. */
  reviewNote: string | null;
  /** Only ever populated by formAccessService's subsidiary-scoped listing, never by
   * admin's own listForms (there's no single "calling user" whose contribution
   * would apply) — null if they've never submitted one, undefined from the admin
   * listing so the two call sites stay distinguishable. */
  myContributionProgress?: ContributionProgress | null;
  /** Whether this form's own project code is currently locked (see
   * ProjectCode.isLocked) — same populated-by-formAccessService-only,
   * undefined-from-admin-listing convention as myContributionProgress above (admins
   * stay exempt from the lock, so their own listing has no need for this). */
  projectCodeLocked?: boolean;
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
    origin: form.origin,
    pendingReview: form.pendingReview,
    submittedForReviewAt: form.submittedForReviewAt,
    reviewedAt: form.reviewedAt,
    reviewNote: form.reviewNote,
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
  /** Defaults to "admin" — pass "adhoc" for a subsidiary user's own My Forms
   * submission (see subsidiaryForms.router.ts's POST /adhoc). */
  origin?: FormOrigin;
  /** "Copy from an existing form" — clones that form's current content (its
   * draft if it has one, else its published version — same precedence
   * getFormDetail's own consumers already use) as this new form's starting
   * definition/config instead of a blank template. meta.subsidiary is always
   * overwritten to *this* new form's own subsidiaryId regardless of what the
   * source form's was, and enforceVariantsForOrigin still applies on top —
   * so copying an admin HR form into a new ad-hoc one (or across
   * subsidiaries) is always safe. Callers are expected to have already
   * validated the source exists/is accessible (see the two router call
   * sites) — a source that can't be found here just falls back to a blank
   * form rather than failing the whole creation. */
  copyFromFormId?: string;
}

/** Creates a new builder form: a draft FormVersion (blank, or cloned from an
 * existing form — see copyFromFormId) plus the Form row pointing at it. No
 * generation happens yet — a brand-new blank form has no questions, so it
 * wouldn't pass validateFormDefinition anyway (expected; only Publish
 * enforces that) — a copied one might already be publish-ready, which is the
 * point. */
export async function createForm(input: CreateFormInput): Promise<FormListItem> {
  const { name, subsidiaryId, projectCode, userId, origin = "admin", copyFromFormId } = input;

  const copySource = copyFromFormId ? await getFormDetail(copyFromFormId) : null;
  const sourceContent = copySource?.draft ?? copySource?.published ?? null;

  const definition: FormDefinition = sourceContent
    ? { ...sourceContent.definition, meta: { ...sourceContent.definition.meta, subsidiary: subsidiaryId } }
    : emptyFormDefinition(subsidiaryId);
  const config: BuilderConfig = enforceVariantsForOrigin(origin, sourceContent ? sourceContent.config : defaultConfig(origin));

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
        origin,
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
        definition: JSON.stringify(definition),
        config: JSON.stringify(config),
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
  /** When set, filters to forms currently awaiting adhoc review (or explicitly
   * excludes them) — the admin Form Initiator list's "Pending review only" toggle. */
  pendingReview?: boolean;
  /** "admin" or "adhoc" — backs the two separate Form Initiator submenu pages
   * (HR Form Initiator / Ad-hoc Forms), same split as the subsidiary side's own
   * My Forms submenu. */
  origin?: FormOrigin;
  /** Exact-match filter on Form.projectCode — added for aiCampaignTools.ts's
   * SEARCH_CAMPAIGNS tool (the plan's "extend SEARCH_CAMPAIGNS to also
   * optionally filter by projectCode"); no existing caller used this before. */
  projectCode?: string;
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
  if (options.pendingReview !== undefined) {
    qb.andWhere("form.pendingReview = :pendingReview", { pendingReview: options.pendingReview });
  }
  if (options.origin) {
    qb.andWhere("form.origin = :origin", { origin: options.origin });
  }
  if (options.projectCode) {
    qb.andWhere("form.projectCode = :projectCode", { projectCode: options.projectCode });
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

/** A subsidiary user's own adhoc forms, every status (draft/pending/published/
 * unpublished) — the My Forms page's "My ad-hoc forms" section. Unlike listForms
 * above, this is never paginated (a subsidiary user's own submission count is
 * always small) and always scoped to exactly one subsidiary + origin. */
export async function listMyAdHocForms(subsidiaryId: string): Promise<FormListItem[]> {
  const forms = await AppDataSource.getRepository(Form).find({
    where: { subsidiaryId, origin: "adhoc", isDeleted: false },
    order: { updatedAt: "DESC" },
  });
  const publishedVersionIds = forms.map((f) => f.publishedVersionId).filter((id): id is string => id !== null);
  const publishedVersions = publishedVersionIds.length
    ? await AppDataSource.getRepository(FormVersion).find({ where: publishedVersionIds.map((id) => ({ id })) })
    : [];
  const versionNumberById = new Map(publishedVersions.map((v) => [v.id, v.versionNumber]));
  return forms.map((form) =>
    toListItem(form, form.publishedVersionId ? (versionNumberById.get(form.publishedVersionId) ?? null) : null),
  );
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

/** Ad-hoc forms are Full Form only (see `defaultConfig` above) — enforced here too,
 * server-side, rather than trusted purely from the client's own omission of
 * VariantConfigPanel on both ad-hoc editor pages. Forces `variants` back to `["ff"]`
 * on every save/publish for an adhoc-origin form regardless of what's stored/passed,
 * so it's never possible (a stale client, a pre-this-feature row, a future bug) for
 * an ad-hoc form to end up generating One-Click output. */
function enforceVariantsForOrigin(origin: FormOrigin, config: BuilderConfig): BuilderConfig {
  return origin === "adhoc" ? { ...config, variants: ["ff"] } : config;
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
    config: JSON.stringify(enforceVariantsForOrigin(form.origin, config)),
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
  const config = enforceVariantsForOrigin(form.origin, JSON.parse(draftVersion.config) as BuilderConfig);
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
      // Persist the enforced config (not the raw draft's), so a legacy ad-hoc row's
      // published record matches what was actually generated rather than silently
      // disagreeing with it.
      config: JSON.stringify(config),
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
      config: JSON.stringify(config),
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

/** Ownership-check helper for a subsidiary user's own adhoc form, mirroring
 * uploadService's findOwnedUpload convention: returns null identically whether the
 * form doesn't exist, isn't theirs, or was admin-authored, so a router 404 never
 * leaks which case occurred. Used by every subsidiaryForms.router.ts /adhoc/* route. */
export function findOwnedAdHocForm(formId: string, subsidiaryId: string): Promise<Form | null> {
  return AppDataSource.getRepository(Form).findOne({
    where: { id: formId, subsidiaryId, origin: "adhoc", isDeleted: false },
  });
}

export type SubmitAdHocOutcome = "ok" | "not_found" | "already_pending";

/** A subsidiary user's "Submit for Review" action — flips pendingReview on, so an
 * admin sees it in their review queue (AdHocReviewPanel.tsx) and further draft
 * edits are blocked (subsidiaryForms.router.ts's PATCH /adhoc/:id/draft checks
 * this) until approveAdHocForm/rejectAdHocForm below resolve it. */
export async function submitAdHocFormForReview(formId: string, subsidiaryId: string): Promise<SubmitAdHocOutcome> {
  const form = await findOwnedAdHocForm(formId, subsidiaryId);
  if (!form) return "not_found";
  if (form.pendingReview) return "already_pending";

  const submittedAt = new Date();
  await AppDataSource.getRepository(Form).update(formId, {
    pendingReview: true,
    submittedForReviewAt: submittedAt,
    reviewNote: null,
  });
  void sendAdHocReviewSubmittedNotification({ formName: form.name, subsidiaryId, submittedAt });
  return "ok";
}

export type ApproveAdHocOutcome = "ok" | "not_found" | "not_adhoc" | "not_pending" | "invalid";

export interface ApproveAdHocResult {
  outcome: ApproveAdHocOutcome;
  validation?: ValidationResult;
}

/** The admin review queue's "Approve" action — the one point a project code gets
 * attached to an adhoc form (never asked of the subsidiary user, see the feature's
 * own requirement), then reuses publishForm as-is: same validate/generate/publish
 * path admin's own Publish button uses everywhere else. If the draft turns out to
 * be invalid, pendingReview is left cleared (not put back to pending) — the
 * subsidiary sees an ordinary editable draft again and can fix it and resubmit,
 * same recovery shape a reject gives them. */
export async function approveAdHocForm(formId: string, projectCode: string, userId: string): Promise<ApproveAdHocResult> {
  const form = await AppDataSource.getRepository(Form).findOne({ where: { id: formId, isDeleted: false } });
  if (!form) return { outcome: "not_found" };
  if (form.origin !== "adhoc") return { outcome: "not_adhoc" };
  if (!form.pendingReview) return { outcome: "not_pending" };

  await AppDataSource.getRepository(Form).update(formId, {
    projectCode,
    pendingReview: false,
    reviewNote: null,
    reviewedAt: new Date(),
  });

  const result = await publishForm(formId, userId);
  if (result.outcome === "not_found") return { outcome: "not_found" };
  if (result.outcome === "invalid") return { outcome: "invalid", validation: result.validation };
  return { outcome: "ok" };
}

export type RejectAdHocOutcome = "ok" | "not_found" | "not_adhoc" | "not_pending";

/** The admin review queue's "Reject" action — leaves the form untouched (still
 * draft) but clears pendingReview so the subsidiary user can edit and resubmit,
 * with an optional note explaining why (shown on their own ad-hoc editor page,
 * same "reviewer note visible to the submitter" convention as
 * formContributionService.rejectContribution). */
export async function rejectAdHocForm(formId: string, reviewNote?: string): Promise<RejectAdHocOutcome> {
  const form = await AppDataSource.getRepository(Form).findOne({ where: { id: formId, isDeleted: false } });
  if (!form) return "not_found";
  if (form.origin !== "adhoc") return "not_adhoc";
  if (!form.pendingReview) return "not_pending";

  await AppDataSource.getRepository(Form).update(formId, {
    pendingReview: false,
    reviewNote: reviewNote ?? null,
    reviewedAt: new Date(),
  });
  return "ok";
}

export type DeleteAdHocOutcome = "ok" | "not_found" | "already_published";

/** A subsidiary user's own "Delete" action on their ad-hoc form (My Forms →
 * Ad-hoc Forms) — allowed while still a draft or awaiting admin review, blocked
 * once an admin has approved/published it (see approveAdHocForm, which calls
 * publishForm) since a published form has downstream FormVersion/GeneratedFiles
 * rows a subsidiary user shouldn't be able to remove themselves. Checks
 * publishedVersionId rather than the current status so a form an admin later
 * unpublished stays undeletable too — "ever published", not "currently
 * published". Reuses the existing generic deleteForm, which itself
 * hard-deletes a never-published form (no FormVersion/GeneratedFiles rows
 * exist yet to worry about). */
export async function deleteAdHocForm(formId: string, subsidiaryId: string): Promise<DeleteAdHocOutcome> {
  const form = await findOwnedAdHocForm(formId, subsidiaryId);
  if (!form) return "not_found";
  if (form.publishedVersionId !== null) return "already_published";
  await deleteForm(formId);
  return "ok";
}

export type DeleteFormOutcome = "ok" | "not_found";

/** Hard-deletes a form that's never been published (nothing downstream references it
 * yet — no GeneratedFiles rows can exist for it, since those are only ever written by
 * publishForm); soft-deletes (Form.isDeleted) one that has, mirroring Upload.isDeleted's
 * own audit-trail convention. Works identically for every form regardless of `origin`
 * (admin-authored or ad-hoc) or `pendingReview` — neither is a delete precondition.
 *
 * The hard-delete path has to break two self/cross-referencing foreign keys before the
 * rows they point at can go away, or SQL Server rejects the whole transaction with a
 * REFERENCE constraint violation (surfaced to the client as a bare 500): `Forms.
 * currentDraftVersionId`/`publishedVersionId` both point *at* this form's own
 * FormVersions rows, so those columns must be nulled out first; and any
 * FormContributions row for this form (formId, and baseVersionId pointing at one of its
 * versions) must be deleted before the FormVersions/Forms rows it references can be —
 * normally there are none for a never-published form (contributions only ever target an
 * already-published one), but deleting them unconditionally here keeps this correct
 * even for an edge-case/pre-existing row rather than relying on that always holding. */
export async function deleteForm(formId: string): Promise<DeleteFormOutcome> {
  const form = await AppDataSource.getRepository(Form).findOne({ where: { id: formId, isDeleted: false } });
  if (!form) return "not_found";

  if (form.publishedVersionId === null) {
    await AppDataSource.transaction(async (manager) => {
      await manager.getRepository(FormContribution).delete({ formId });
      await manager.getRepository(Form).update(formId, { currentDraftVersionId: null, publishedVersionId: null });
      await manager.query(`DELETE FROM GeneratedFiles WHERE formVersionId IN (SELECT id FROM FormVersions WHERE formId = @0)`, [formId]);
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
