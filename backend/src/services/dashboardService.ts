import { In } from "typeorm";
import { validateFormDefinition, type FormDefinition } from "@formbuilder/shared";
import { AppDataSource } from "../config/data-source";
import { Form, type FormOrigin, type FormStatus } from "../entities/Form";
import { FormVersion } from "../entities/FormVersion";
import { FormContribution } from "../entities/FormContribution";
import { User } from "../entities/User";

/**
 * Aggregation queries backing the "Dashboard" landing page for both roles
 * (Configuration > ... has nothing to do with this — this is the new
 * post-login overview, see AdminOverviewDashboardPage.tsx / SubsidiaryDashboardPage.tsx).
 *
 * `Form.status` (draft/published/unpublished) and `FormContribution.status`
 * (draft/pending/approved/rejected) are two independent lifecycles that can
 * coexist on the same form (a published form can still have a pending
 * contribution) — there is no single literal "Pending Review"/"Approved"
 * status anywhere in the schema. To keep every dashboard stat and its donut
 * chart a clean partition that always sums to the total, every form is
 * assigned to exactly one bucket via a fixed priority, computed identically
 * everywhere below: **Pending Review > Approved > Published > Draft**
 * (admin), or, for a subsidiary's own ad-hoc forms specifically, **Pending
 * Review > Published > Changes Requested > Draft** — the ad-hoc lifecycle
 * (`Form.pendingReview`/`reviewNote`, both reset to null on every new
 * submission — see `formBuilderService.submitAdHocFormForReview`) already
 * keeps those four states mutually exclusive on its own, so no priority
 * resolution is actually needed there, only for admin's contribution-based
 * "Approved" bucket.
 */

export type DashboardBucket = "pendingReview" | "approved" | "published" | "draft";

export interface BucketableForm {
  id: string;
  origin: FormOrigin;
  pendingReview: boolean;
  status: FormStatus;
  subsidiaryId: string;
}

/** Exported for unit testing — pure, no DB access (see dashboardService.test.ts). */
export function bucketForm(form: BucketableForm, pendingContributionFormIds: Set<string>, approvedContributionFormIds: Set<string>): DashboardBucket {
  if ((form.origin === "adhoc" && form.pendingReview) || pendingContributionFormIds.has(form.id)) return "pendingReview";
  if (approvedContributionFormIds.has(form.id)) return "approved";
  if (form.status === "published") return "published";
  return "draft";
}

async function loadPendingAndApprovedContributionFormIds(): Promise<{ pending: Set<string>; approved: Set<string> }> {
  const [pendingRows, approvedRows] = await Promise.all([
    AppDataSource.getRepository(FormContribution)
      .createQueryBuilder("c")
      .select("DISTINCT c.formId", "formId")
      .where("c.status = :status", { status: "pending" })
      .getRawMany<{ formId: string }>(),
    AppDataSource.getRepository(FormContribution)
      .createQueryBuilder("c")
      .select("DISTINCT c.formId", "formId")
      .where("c.status = :status", { status: "approved" })
      .andWhere("c.publishedAt IS NULL")
      .getRawMany<{ formId: string }>(),
  ]);
  return {
    pending: new Set(pendingRows.map((r) => r.formId)),
    approved: new Set(approvedRows.map((r) => r.formId)),
  };
}

export interface AdminDashboardCounts {
  total: number;
  draft: number;
  pendingReview: number;
  approved: number;
  published: number;
}

export interface MonthlyActivity {
  /** Short month label, e.g. "Mar" — always the 6 most recent calendar months, oldest first. */
  month: string;
  created: number;
  /** Forms published for the first time this month (FormVersion.versionNumber = 1). */
  published: number;
}

/** Per-subsidiary counts, split the same way the stat cards are — lets the
 * admin dashboard's "Subsidiary Activity" chart re-scope itself to whichever
 * stat card is currently selected (see AdminOverviewDashboardPage.tsx) while
 * always summing back to that card's own total. Computed in-memory from the
 * same `forms` array `getAdminDashboardSummary` already loads for the stat
 * counts, rather than a separate grouped query. */
export interface SubsidiaryBucketBreakdown {
  subsidiaryId: string;
  total: number;
  draft: number;
  pendingReview: number;
  approved: number;
  published: number;
}

export type PendingApprovalType = "adhoc_review" | "contribution";

export interface PendingApprovalItem {
  formId: string;
  formName: string;
  subsidiaryId: string;
  type: PendingApprovalType;
  submittedAt: Date;
}

export type RecentActivityKind = "submitted_for_review" | "published" | "contribution_approved" | "contribution_rejected" | "user_created";

export interface RecentActivityItem {
  kind: RecentActivityKind;
  message: string;
  occurredAt: Date;
}

export interface AdminDashboardSummary {
  counts: AdminDashboardCounts;
  activityByMonth: MonthlyActivity[];
  subsidiaryBreakdown: SubsidiaryBucketBreakdown[];
  pendingApprovals: PendingApprovalItem[];
  recentActivity: RecentActivityItem[];
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date): string {
  return d.toLocaleString("en-US", { month: "short" });
}

/** The 6 most recent calendar months (oldest first), including the current one. */
function lastSixMonths(): Date[] {
  const months: Date[] = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() - i);
    months.push(d);
  }
  return months;
}

async function getActivityByMonth(): Promise<MonthlyActivity[]> {
  const months = lastSixMonths();
  const rangeStart = months[0];

  const [createdRows, publishedRows] = await Promise.all([
    AppDataSource.manager.query<Array<{ bucket: string; count: number }>>(
      `SELECT FORMAT(createdAt, 'yyyy-MM') AS bucket, COUNT(*) AS count FROM Forms WHERE isDeleted = 0 AND createdAt >= @0 GROUP BY FORMAT(createdAt, 'yyyy-MM')`,
      [rangeStart],
    ),
    AppDataSource.manager.query<Array<{ bucket: string; count: number }>>(
      `SELECT FORMAT(publishedAt, 'yyyy-MM') AS bucket, COUNT(*) AS count FROM FormVersions WHERE versionNumber = 1 AND publishedAt IS NOT NULL AND publishedAt >= @0 GROUP BY FORMAT(publishedAt, 'yyyy-MM')`,
      [rangeStart],
    ),
  ]);
  const createdByMonth = new Map(createdRows.map((r) => [r.bucket, Number(r.count)]));
  const publishedByMonth = new Map(publishedRows.map((r) => [r.bucket, Number(r.count)]));

  return months.map((d) => {
    const key = monthKey(d);
    return { month: monthLabel(d), created: createdByMonth.get(key) ?? 0, published: publishedByMonth.get(key) ?? 0 };
  });
}

function computeSubsidiaryBreakdown(
  forms: BucketableForm[],
  pendingContributionFormIds: Set<string>,
  approvedContributionFormIds: Set<string>,
): SubsidiaryBucketBreakdown[] {
  const bySubsidiary = new Map<string, SubsidiaryBucketBreakdown>();
  for (const f of forms) {
    let row = bySubsidiary.get(f.subsidiaryId);
    if (!row) {
      row = { subsidiaryId: f.subsidiaryId, total: 0, draft: 0, pendingReview: 0, approved: 0, published: 0 };
      bySubsidiary.set(f.subsidiaryId, row);
    }
    row.total++;
    row[bucketForm(f, pendingContributionFormIds, approvedContributionFormIds)]++;
  }
  return [...bySubsidiary.values()].sort((a, b) => b.total - a.total);
}

/** Merges ad-hoc forms awaiting a whole-form review with individual pending
 * contributions — the two separate review queues an admin otherwise has to
 * check on two different pages — sorted oldest-first (most overdue on top). */
async function getPendingApprovals(limit = 8): Promise<PendingApprovalItem[]> {
  const [pendingAdhocForms, pendingContributions] = await Promise.all([
    AppDataSource.getRepository(Form).find({ where: { origin: "adhoc", pendingReview: true, isDeleted: false } }),
    AppDataSource.getRepository(FormContribution).find({ where: { status: "pending" } }),
  ]);

  const contributionFormIds = [...new Set(pendingContributions.map((c) => c.formId))];
  const contributionForms = contributionFormIds.length ? await AppDataSource.getRepository(Form).find({ where: { id: In(contributionFormIds) } }) : [];
  const formById = new Map(contributionForms.map((f) => [f.id, f]));

  const items: PendingApprovalItem[] = [
    ...pendingAdhocForms.map((f) => ({
      formId: f.id,
      formName: f.name,
      subsidiaryId: f.subsidiaryId,
      type: "adhoc_review" as const,
      submittedAt: f.submittedForReviewAt ?? f.updatedAt,
    })),
    ...pendingContributions.map((c) => {
      const f = formById.get(c.formId);
      return {
        formId: c.formId,
        formName: f?.name ?? "(deleted form)",
        subsidiaryId: f?.subsidiaryId ?? "",
        type: "contribution" as const,
        submittedAt: c.submittedAt,
      };
    }),
  ];
  items.sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());
  return items.slice(0, limit);
}

/** A best-effort, synthesized activity feed — this codebase has no general
 * audit-log table, so this merges a handful of already-timestamped columns
 * (submission/publish/review/user-creation times) across a few tables rather
 * than adding one. Documented tradeoff, not a real audit trail. */
async function getRecentActivity(limit = 8): Promise<RecentActivityItem[]> {
  const [submittedForms, publishedVersions, reviewedContributions, newUsers] = await Promise.all([
    AppDataSource.getRepository(Form)
      .createQueryBuilder("f")
      .where("f.submittedForReviewAt IS NOT NULL")
      .orderBy("f.submittedForReviewAt", "DESC")
      .take(limit)
      .getMany(),
    AppDataSource.getRepository(FormVersion)
      .createQueryBuilder("v")
      .where("v.publishedAt IS NOT NULL")
      .orderBy("v.publishedAt", "DESC")
      .take(limit)
      .getMany(),
    AppDataSource.getRepository(FormContribution)
      .createQueryBuilder("c")
      .where("c.reviewedAt IS NOT NULL")
      .orderBy("c.reviewedAt", "DESC")
      .take(limit)
      .getMany(),
    AppDataSource.getRepository(User).createQueryBuilder("u").orderBy("u.createdAt", "DESC").take(limit).getMany(),
  ]);

  const relatedFormIds = [...new Set([...publishedVersions.map((v) => v.formId), ...reviewedContributions.map((c) => c.formId)])];
  const relatedForms = relatedFormIds.length ? await AppDataSource.getRepository(Form).find({ where: { id: In(relatedFormIds) } }) : [];
  const nameById = new Map(relatedForms.map((f) => [f.id, f.name]));

  const items: RecentActivityItem[] = [
    ...submittedForms.map((f) => ({
      kind: "submitted_for_review" as const,
      message: `${f.subsidiaryId} submitted "${f.name}" for review`,
      occurredAt: f.submittedForReviewAt!,
    })),
    ...publishedVersions.map((v) => ({
      kind: "published" as const,
      message: `Published "${nameById.get(v.formId) ?? "a form"}"`,
      occurredAt: v.publishedAt!,
    })),
    ...reviewedContributions.map((c) => ({
      kind: c.status === "approved" ? ("contribution_approved" as const) : ("contribution_rejected" as const),
      message:
        c.status === "approved"
          ? `Contribution approved on "${nameById.get(c.formId) ?? "a form"}"`
          : `Changes requested on "${nameById.get(c.formId) ?? "a form"}"`,
      occurredAt: c.reviewedAt!,
    })),
    ...newUsers.map((u) => ({
      kind: "user_created" as const,
      message: `New user added — ${u.username}`,
      occurredAt: u.createdAt,
    })),
  ];
  items.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  return items.slice(0, limit);
}

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const [forms, contributionFormIds, activityByMonth, pendingApprovals, recentActivity] = await Promise.all([
    AppDataSource.getRepository(Form).find({ where: { isDeleted: false } }),
    loadPendingAndApprovedContributionFormIds(),
    getActivityByMonth(),
    getPendingApprovals(),
    getRecentActivity(),
  ]);

  const counts: AdminDashboardCounts = { total: forms.length, draft: 0, pendingReview: 0, approved: 0, published: 0 };
  for (const f of forms) {
    counts[bucketForm(f, contributionFormIds.pending, contributionFormIds.approved)]++;
  }
  const subsidiaryBreakdown = computeSubsidiaryBreakdown(forms, contributionFormIds.pending, contributionFormIds.approved);

  return { counts, activityByMonth, subsidiaryBreakdown, pendingApprovals, recentActivity };
}

export interface SubsidiaryDashboardCounts {
  total: number;
  drafts: number;
  pendingReview: number;
  changesRequested: number;
  published: number;
}

export interface RecentCampaignItem {
  id: string;
  name: string;
  bucket: DashboardBucket | "changesRequested";
  updatedAt: Date;
}

export interface ContinueWorkingItem {
  id: string;
  name: string;
  updatedAt: Date;
  /** From `validateFormDefinition` on the current draft — 0 means ready to submit. */
  issueCount: number;
}

export interface ActionRequiredItem {
  id: string;
  name: string;
  reviewNote: string;
  reviewedAt: Date | null;
}

export interface SubsidiaryDashboardSummary {
  counts: SubsidiaryDashboardCounts;
  recentCampaigns: RecentCampaignItem[];
  continueWorking: ContinueWorkingItem[];
  actionRequired: ActionRequiredItem[];
}

/** A subsidiary-scoped ad-hoc form's bucket — mutually exclusive by
 * construction (see this file's own doc comment): `submitAdHocFormForReview`
 * clears `reviewNote` on every new submission and `approveAdHocForm` clears
 * it again on approval, so a non-null `reviewNote` only ever appears on a
 * still-draft, not-pending, never-published (rejected) form. */
export function subsidiaryBucket(form: Pick<Form, "pendingReview" | "status" | "reviewNote">): "pendingReview" | "published" | "changesRequested" | "draft" {
  if (form.pendingReview) return "pendingReview";
  if (form.status === "published") return "published";
  if (form.reviewNote) return "changesRequested";
  return "draft";
}

async function buildContinueWorking(draftForms: Form[], limit = 3): Promise<ContinueWorkingItem[]> {
  const top = draftForms.slice(0, limit);
  const versionIds = top.map((f) => f.currentDraftVersionId).filter((id): id is string => !!id);
  const versions = versionIds.length ? await AppDataSource.getRepository(FormVersion).find({ where: { id: In(versionIds) } }) : [];
  const versionById = new Map(versions.map((v) => [v.id, v]));

  return top.map((f) => {
    const version = f.currentDraftVersionId ? versionById.get(f.currentDraftVersionId) : undefined;
    let issueCount = 0;
    if (version) {
      try {
        issueCount = validateFormDefinition(JSON.parse(version.definition) as FormDefinition).errors.length;
      } catch {
        issueCount = 1;
      }
    }
    return { id: f.id, name: f.name, updatedAt: f.updatedAt, issueCount };
  });
}

export async function getSubsidiaryDashboardSummary(subsidiaryId: string): Promise<SubsidiaryDashboardSummary> {
  const forms = await AppDataSource.getRepository(Form).find({
    where: { subsidiaryId, origin: "adhoc", isDeleted: false },
    order: { updatedAt: "DESC" },
  });

  const counts: SubsidiaryDashboardCounts = { total: forms.length, drafts: 0, pendingReview: 0, changesRequested: 0, published: 0 };
  const draftForms: Form[] = [];
  const changesRequestedForms: Form[] = [];
  for (const f of forms) {
    const bucket = subsidiaryBucket(f);
    if (bucket === "pendingReview") counts.pendingReview++;
    else if (bucket === "published") counts.published++;
    else if (bucket === "changesRequested") {
      counts.changesRequested++;
      changesRequestedForms.push(f);
    } else {
      counts.drafts++;
      draftForms.push(f);
    }
  }

  const recentCampaigns: RecentCampaignItem[] = forms
    .slice(0, 5)
    .map((f) => ({ id: f.id, name: f.name, bucket: subsidiaryBucket(f), updatedAt: f.updatedAt }));

  const [continueWorking, actionRequired] = await Promise.all([
    buildContinueWorking(draftForms),
    Promise.resolve(
      changesRequestedForms
        .slice(0, 5)
        .map((f) => ({ id: f.id, name: f.name, reviewNote: f.reviewNote!, reviewedAt: f.reviewedAt })),
    ),
  ]);

  return { counts, recentCampaigns, continueWorking, actionRequired };
}
