import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type ContributionStatus = "draft" | "pending" | "approved" | "rejected";

/**
 * A subsidiary-scoped standard user's proposed translations/additions to a
 * *published* Form — never a direct edit. Approving one merges `translations`/
 * `newQuestions`/`newConsents` (see `@formbuilder/shared`'s `ContributionContent`)
 * onto the form's current draft (`formContributionService.approveContribution`) —
 * deliberately *not* an immediate publish, so an admin can approve several
 * subsidiary submissions before going live with all of them at once via the same
 * "Publish" action used everywhere else (`formBuilderService.publishForm`), which
 * also stamps `publishedAt` on every contribution that publish just carried live.
 * Rejecting one leaves the form untouched.
 *
 * "draft" is a save-in-progress row, never admin-visible (see
 * `listContributionsForForm`/`listOwnContributionsAllForms`, both of which filter
 * it out) — a subsidiary user's own scratch space so Ctrl+S/"Save Draft" on the
 * Translate & Extend page can persist work across sessions without queuing it for
 * review. At most one draft row exists per (formId, submittedByUserId) — see
 * `saveContributionDraft`'s upsert. `submitContribution` promotes that same row to
 * "pending" in place (re-stamping `submittedAt`) instead of inserting a second row,
 * so a save-then-submit session never leaves an orphaned draft behind. For a draft
 * row, `submittedAt` means "last saved at", not a real submission time.
 */
@Entity("FormContributions")
export class FormContribution {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  formId!: string;

  @Column({ type: "uniqueidentifier" })
  submittedByUserId!: string;

  /** Which published FormVersion this was proposed against — purely informational
   * (lets the admin review UI flag "the form has moved on since this was submitted"
   * rather than silently approving against stale content); approval always merges
   * onto the form's *current* draft, not this snapshot. */
  @Column({ type: "uniqueidentifier", nullable: true })
  baseVersionId!: string | null;

  @Column({ type: "nvarchar", length: 20, default: "pending" })
  status!: ContributionStatus;

  /** JSON-encoded ContributionContent (`@formbuilder/shared`) — same
   * JSON.stringify-on-write/parse-with-fallback-on-read convention as
   * FormVersion.definition. */
  @Column({ type: "nvarchar", length: "MAX" })
  content!: string;

  /** The submitter's own note/context for the admin reviewing this. */
  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  note!: string | null;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  reviewNote!: string | null;

  @Column({ type: "uniqueidentifier", nullable: true })
  reviewedByUserId!: string | null;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  submittedAt!: Date;

  @Column({ type: "datetimeoffset", nullable: true })
  reviewedAt!: Date | null;

  /** Stamped by `formBuilderService.publishForm` the moment a publish actually
   * carries this (already-approved) contribution's merged content live — not set
   * at approval time, since approve only merges onto the draft. Null means
   * "approved but the draft hasn't been published yet" for an approved
   * contribution, and is simply unused/always null for pending/rejected ones. */
  @Column({ type: "datetimeoffset", nullable: true })
  publishedAt!: Date | null;
}
