import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Form } from "../entities/Form";
import { FormContribution } from "../entities/FormContribution";
import { FormVersion } from "../entities/FormVersion";
import { SubsidiaryProjectBlock } from "../entities/SubsidiaryProjectBlock";
import { getFormDetail, type ContributionProgress, type FormDetail, type FormListItem } from "./formBuilderService";

/**
 * Read access to a *published* Form for a subsidiary-scoped standard user — a
 * separate, much narrower surface than admin's own `formBuilderService` list/detail
 * (which sees every form regardless of status). A form is visible to a standard user
 * iff: it belongs to their own subsidiary (Form.subsidiaryId, a text snapshot — see
 * Form.ts — is directly comparable to User.subsidiaryId, the same convention), it's
 * currently published, and its (subsidiary, project code) pair isn't blocked — the
 * same SubsidiaryProjectBlock check uploadService.createUpload applies, just read
 * instead of asserted, mirroring "who has access for that project code."
 */

async function toListItem(form: Form, myContributionProgress: ContributionProgress | null = null): Promise<FormListItem> {
  const publishedVersion = form.publishedVersionId
    ? await AppDataSource.getRepository(FormVersion).findOne({ where: { id: form.publishedVersionId } })
    : null;
  return {
    id: form.id,
    name: form.name,
    subsidiaryId: form.subsidiaryId,
    projectCode: form.projectCode,
    status: form.status,
    createdByUserId: form.createdByUserId,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
    publishedVersionNumber: publishedVersion?.versionNumber ?? null,
    myContributionProgress,
  };
}

/** This user's own latest contribution per form, keyed by formId — "latest" by
 * submittedAt, so a form they've contributed to more than once (e.g. resubmitting
 * after a rejection) reflects the most recent outcome rather than an arbitrary one. */
async function latestOwnContributionProgressByForm(formIds: string[], userId: string): Promise<Map<string, ContributionProgress>> {
  if (formIds.length === 0) return new Map();
  const rows = await AppDataSource.getRepository(FormContribution).find({
    where: { formId: In(formIds), submittedByUserId: userId },
    order: { submittedAt: "DESC" },
  });
  const byForm = new Map<string, ContributionProgress>();
  for (const row of rows) {
    if (!byForm.has(row.formId)) {
      byForm.set(row.formId, { status: row.status, submittedAt: row.submittedAt, reviewedAt: row.reviewedAt, publishedAt: row.publishedAt });
    }
  }
  return byForm;
}

/** Every published form for `subsidiaryId`, minus any whose project code is
 * currently blocked for that subsidiary. Each item's `myContributionProgress`
 * reflects `userId`'s own most recent submission against that form, if any — lets
 * the "My Forms" list show a live status bar the moment a user submits, without a
 * separate per-form round trip. */
export async function listAccessibleForms(subsidiaryId: string, userId: string): Promise<FormListItem[]> {
  const forms = await AppDataSource.getRepository(Form).find({
    where: { subsidiaryId, status: "published", isDeleted: false },
    order: { updatedAt: "DESC" },
  });
  if (forms.length === 0) return [];

  const blocks = await AppDataSource.getRepository(SubsidiaryProjectBlock).find({ where: { subsidiaryName: subsidiaryId } });
  const blockedProjectCodes = new Set(blocks.map((b) => b.projectCode));
  const visible = forms.filter((f) => !f.projectCode || !blockedProjectCodes.has(f.projectCode));

  const progressByForm = await latestOwnContributionProgressByForm(visible.map((f) => f.id), userId);
  return Promise.all(visible.map((f) => toListItem(f, progressByForm.get(f.id) ?? null)));
}

/** Same visibility rule as `listAccessibleForms`, for a single form — returns `null`
 * identically whether the form doesn't exist, isn't published, belongs to a
 * different subsidiary, or is blocked, so nothing about *why* leaks to the caller
 * (same "null means not found or not yours" convention as uploadService's
 * findOwnedUpload). */
export async function getAccessibleFormDetail(formId: string, subsidiaryId: string): Promise<FormDetail | null> {
  const form = await AppDataSource.getRepository(Form).findOne({ where: { id: formId, subsidiaryId, status: "published", isDeleted: false } });
  if (!form) return null;

  if (form.projectCode) {
    const blocked = await AppDataSource.getRepository(SubsidiaryProjectBlock).findOne({
      where: { subsidiaryName: subsidiaryId, projectCode: form.projectCode },
    });
    if (blocked) return null;
  }

  return getFormDetail(formId);
}
