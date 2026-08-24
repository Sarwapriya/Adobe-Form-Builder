import { In, Not } from "typeorm";
import {
  applyContribution,
  validateContribution,
  type BuilderConfig,
  type ContributionContent,
  type FormDefinition,
  type ValidationResult,
} from "@formbuilder/shared";
import { AppDataSource } from "../config/data-source";
import { Form } from "../entities/Form";
import { FormVersion } from "../entities/FormVersion";
import { FormContribution, type ContributionStatus } from "../entities/FormContribution";
import { ProjectCode } from "../entities/ProjectCode";
import { User } from "../entities/User";
import { getAccessibleFormDetail } from "./formAccessService";
import { updateDraft } from "./formBuilderService";
import { sendContributionSubmittedNotification } from "./emailService";

export interface ContributionSummary {
  id: string;
  formId: string;
  submittedByUserId: string;
  status: ContributionStatus;
  content: ContributionContent;
  note: string | null;
  reviewNote: string | null;
  reviewedByUserId: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  /** Set by `formBuilderService.publishForm` the moment a publish actually carries
   * this (already-approved) contribution's content live — see FormContribution.ts.
   * Null for pending/rejected contributions, and for an approved one still sitting
   * in an unpublished draft. */
  publishedAt: Date | null;
}

function toSummary(row: FormContribution): ContributionSummary {
  return {
    id: row.id,
    formId: row.formId,
    submittedByUserId: row.submittedByUserId,
    status: row.status,
    content: JSON.parse(row.content) as ContributionContent,
    note: row.note,
    reviewNote: row.reviewNote,
    reviewedByUserId: row.reviewedByUserId,
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt,
    publishedAt: row.publishedAt,
  };
}

export type SubmitContributionOutcome = "ok" | "not_found" | "invalid" | "project_locked";

export interface SubmitContributionResult {
  outcome: SubmitContributionOutcome;
  contribution?: ContributionSummary;
  validation?: ValidationResult;
}

/** Validates a proposed contribution against the form's *published* content (what
 * the submitting user actually saw) and, if valid, queues it as "pending" — never
 * applied directly. `getAccessibleFormDetail` re-derives the same subsidiary/
 * project-code-block visibility a standard user's own form list uses, so a
 * contribution can't be submitted against a form the caller can't actually see. */
export async function submitContribution(
  formId: string,
  userId: string,
  subsidiaryId: string,
  content: ContributionContent,
  note?: string,
): Promise<SubmitContributionResult> {
  const detail = await getAccessibleFormDetail(formId, subsidiaryId);
  if (!detail?.published) return { outcome: "not_found" };

  // A locked project code freezes subsidiary contributions the same way it freezes
  // Excel uploads — see ProjectCode.isLocked's own doc comment. Reachable only via
  // subsidiaryFormsRouter (requireAuth-only, always subsidiary-scoped), so unlike
  // uploadService.createUpload this needs no admin-exemption check — admins never
  // submit contributions, they review them.
  if (detail.projectCode) {
    const projectCode = await AppDataSource.getRepository(ProjectCode).findOne({ where: { code: detail.projectCode } });
    if (projectCode?.isLocked) {
      return { outcome: "project_locked" };
    }
  }

  const validation = validateContribution(detail.published.definition, content);
  if (validation.errors.length > 0) {
    return { outcome: "invalid", validation };
  }

  // Promote an existing draft row in place (see FormContribution.ts's own doc
  // comment) rather than inserting a second row — a save-then-submit session
  // ends with exactly one row for this (form, user) pair.
  const repo = AppDataSource.getRepository(FormContribution);
  const existingDraft = await repo.findOne({ where: { formId, submittedByUserId: userId, status: "draft" } });
  const row = await repo.save(
    existingDraft
      ? {
          ...existingDraft,
          baseVersionId: detail.published.id,
          status: "pending" as const,
          content: JSON.stringify(content),
          note: note ?? null,
          submittedAt: new Date(),
        }
      : repo.create({
          formId,
          submittedByUserId: userId,
          baseVersionId: detail.published.id,
          status: "pending",
          content: JSON.stringify(content),
          note: note ?? null,
        }),
  );

  const [form, submitter] = await Promise.all([
    AppDataSource.getRepository(Form).findOne({ where: { id: formId } }),
    AppDataSource.getRepository(User).findOne({ where: { id: userId } }),
  ]);
  if (form && submitter) {
    void sendContributionSubmittedNotification({
      formName: form.name,
      subsidiaryId: subsidiaryId,
      submittedByUserName: submitter.username,
      submittedByUserEmail: submitter.email,
      note: note ?? null,
    });
  }

  return { outcome: "ok", contribution: toSummary(row), validation };
}

/** Admin-facing — every *actually submitted* contribution for a form, regardless of
 * status. Excludes "draft" rows — a subsidiary user's unsent scratch space is never
 * admin-visible. */
export async function listContributionsForForm(formId: string): Promise<ContributionSummary[]> {
  const rows = await AppDataSource.getRepository(FormContribution).find({
    where: { formId, status: Not("draft") },
    order: { submittedAt: "DESC" },
  });
  return rows.map(toSummary);
}

/** Standard-user-facing — only the caller's own rows for a form (including a "draft"
 * one, if any), so the Translate & Extend page can both track pending/approved/
 * rejected status and resume an in-progress draft, without seeing other users'. */
export async function listOwnContributions(formId: string, userId: string): Promise<ContributionSummary[]> {
  const rows = await AppDataSource.getRepository(FormContribution).find({
    where: { formId, submittedByUserId: userId },
    order: { submittedAt: "DESC" },
  });
  return rows.map(toSummary);
}

/** Saves (or updates in place) this user's one draft row for a form — never queues
 * it for admin review, and unlike `submitContribution` runs no validation, since the
 * whole point is being able to save incomplete/in-progress work. `getAccessibleFormDetail`
 * still gates it the same way submit does, so a user can't save a draft against a
 * form they can no longer see. */
export type SaveContributionDraftOutcome = "ok" | "not_found";

export interface SaveContributionDraftResult {
  outcome: SaveContributionDraftOutcome;
  contribution?: ContributionSummary;
}

export async function saveContributionDraft(
  formId: string,
  userId: string,
  subsidiaryId: string,
  content: ContributionContent,
  note?: string,
): Promise<SaveContributionDraftResult> {
  const detail = await getAccessibleFormDetail(formId, subsidiaryId);
  if (!detail?.published) return { outcome: "not_found" };

  const repo = AppDataSource.getRepository(FormContribution);
  const existingDraft = await repo.findOne({ where: { formId, submittedByUserId: userId, status: "draft" } });
  const row = await repo.save(
    existingDraft
      ? { ...existingDraft, baseVersionId: detail.published.id, content: JSON.stringify(content), note: note ?? null, submittedAt: new Date() }
      : repo.create({
          formId,
          submittedByUserId: userId,
          baseVersionId: detail.published.id,
          status: "draft",
          content: JSON.stringify(content),
          note: note ?? null,
        }),
  );

  return { outcome: "ok", contribution: toSummary(row) };
}

export interface ContributionSummaryWithForm extends ContributionSummary {
  formName: string;
}

/** Standard-user-facing — every contribution this user has ever submitted, across
 * every form, newest first. Backs a consolidated "My Submissions" history view so a
 * user doesn't have to remember which specific form a past (especially rejected)
 * submission belonged to — the per-form Translate & Extend page only shows *that*
 * form's own history. Enriches each row with its form's current name since
 * ContributionSummary alone only carries a formId. */
export async function listOwnContributionsAllForms(userId: string): Promise<ContributionSummaryWithForm[]> {
  const rows = await AppDataSource.getRepository(FormContribution).find({
    where: { submittedByUserId: userId, status: Not("draft") },
    order: { submittedAt: "DESC" },
  });
  if (rows.length === 0) return [];

  const formIds = [...new Set(rows.map((r) => r.formId))];
  const forms = await AppDataSource.getRepository(Form).find({ where: { id: In(formIds) } });
  const nameById = new Map(forms.map((f) => [f.id, f.name]));

  return rows.map((row) => ({ ...toSummary(row), formName: nameById.get(row.formId) ?? "(deleted form)" }));
}

export type ReviewContributionOutcome = "ok" | "not_found" | "not_pending";

export interface ReviewContributionResult {
  outcome: ReviewContributionOutcome;
}

/**
 * Approving merges the contribution onto the form's *current draft* (never the
 * published version directly) and marks it "approved" — deliberately **not** a
 * publish. An admin can approve several subsidiary submissions and only go live
 * once, via the same "Publish" action used everywhere else
 * (`formBuilderService.publishForm`, which also stamps every now-live approved
 * contribution's `publishedAt`) — see the admin review UI's separate Approve/
 * Publish buttons. If the draft has moved on since `baseVersionId` (the admin made
 * their own unrelated edits), the merge still applies on top of that current draft
 * rather than the stale baseline — reasonable for additive-only content, but the
 * caller should warn the reviewer when baseVersionId no longer matches the form's
 * published version (see the admin review UI).
 */
export async function approveContribution(contributionId: string, adminUserId: string, reviewNote?: string): Promise<ReviewContributionResult> {
  const contributionRepo = AppDataSource.getRepository(FormContribution);
  const contribution = await contributionRepo.findOne({ where: { id: contributionId } });
  if (!contribution) return { outcome: "not_found" };
  if (contribution.status !== "pending") return { outcome: "not_pending" };

  const form = await AppDataSource.getRepository(Form).findOne({ where: { id: contribution.formId, isDeleted: false } });
  if (!form || !form.currentDraftVersionId) return { outcome: "not_found" };

  const draftVersion = await AppDataSource.getRepository(FormVersion).findOne({ where: { id: form.currentDraftVersionId } });
  if (!draftVersion) return { outcome: "not_found" };

  const draftDefinition = JSON.parse(draftVersion.definition) as FormDefinition;
  const draftConfig = JSON.parse(draftVersion.config) as BuilderConfig;
  const content = JSON.parse(contribution.content) as ContributionContent;
  const merged = applyContribution(draftDefinition, content);

  await updateDraft(form.id, merged, draftConfig);

  await contributionRepo.update(contributionId, {
    status: "approved",
    reviewedByUserId: adminUserId,
    reviewedAt: new Date(),
    reviewNote: reviewNote ?? null,
  });

  return { outcome: "ok" };
}

/** Rejecting leaves the form entirely untouched — just records the decision. */
export async function rejectContribution(contributionId: string, adminUserId: string, reviewNote?: string): Promise<ReviewContributionOutcome> {
  const contributionRepo = AppDataSource.getRepository(FormContribution);
  const contribution = await contributionRepo.findOne({ where: { id: contributionId } });
  if (!contribution) return "not_found";
  if (contribution.status !== "pending") return "not_pending";

  await contributionRepo.update(contributionId, {
    status: "rejected",
    reviewedByUserId: adminUserId,
    reviewedAt: new Date(),
    reviewNote: reviewNote ?? null,
  });
  return "ok";
}
