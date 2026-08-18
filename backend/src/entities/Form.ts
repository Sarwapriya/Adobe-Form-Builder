import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type FormStatus = "draft" | "published" | "unpublished";
export type FormOrigin = "admin" | "adhoc";

/**
 * A builder-authored form/campaign — the schema-authored counterpart to Upload's
 * Excel-authored one, deliberately kept as a separate table/lifecycle (see
 * formBuilderService.ts's own doc comment) rather than folded into Uploads, since a
 * builder form has no source .xlsx and a repeatedly-editable draft/publish/unpublish
 * lifecycle Upload's submission-time-only versioning doesn't fit.
 *
 * subsidiaryId/projectCode are text snapshots, mirroring Upload's own convention (not
 * foreign keys — see ProjectCode/Subsidiary entities' own doc comments for why).
 *
 * currentDraftVersionId/publishedVersionId point at FormVersions rows: the draft one
 * is what the builder UI edits and is replaced (new row) every time this form is
 * published, so a published version's own data/generated output never changes
 * retroactively (see FormVersion.ts's own doc comment for the full lifecycle).
 */
@Entity("Forms")
export class Form {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "nvarchar", length: 200 })
  name!: string;

  @Column({ type: "nvarchar", length: 50 })
  subsidiaryId!: string;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  projectCode!: string | null;

  @Column({ type: "nvarchar", length: 20, default: "draft" })
  status!: FormStatus;

  /** "admin" for every form created via Form Initiator (the only kind before this
   * column existed — see default below), "adhoc" for one a subsidiary user created
   * themselves via My Forms. Purely informational (a badge in admin's Form
   * Initiator list) — an approved-and-published adhoc form behaves identically to
   * an admin-authored one everywhere downstream (Question Master, generation). */
  @Column({ type: "nvarchar", length: 10, default: "admin" })
  origin!: FormOrigin;

  /** True while a subsidiary-submitted adhoc form is awaiting admin review — see
   * formBuilderService.submitAdHocFormForReview/approveAdHocForm/rejectAdHocForm.
   * Draft edits are blocked (both client-side and server-side) while this is true.
   * Always false for "admin"-origin forms. */
  @Column({ type: "bit", default: false })
  pendingReview!: boolean;

  @Column({ type: "datetimeoffset", nullable: true })
  submittedForReviewAt!: Date | null;

  @Column({ type: "datetimeoffset", nullable: true })
  reviewedAt!: Date | null;

  /** Set by rejectAdHocForm so the subsidiary user knows why — shown on their own
   * ad-hoc editor page. Cleared on the next approve/reject cycle, same "only the
   * latest review's own note" convention as FormContribution.reviewNote. */
  @Column({ type: "nvarchar", length: 2000, nullable: true })
  reviewNote!: string | null;

  @Column({ type: "uniqueidentifier", nullable: true })
  currentDraftVersionId!: string | null;

  @Column({ type: "uniqueidentifier", nullable: true })
  publishedVersionId!: string | null;

  /** Soft-delete flag — only set once a form has been published at least once (a
   * form that's never left draft is hard-deleted instead, since nothing downstream
   * references it yet). Mirrors Upload.isDeleted's own audit-trail convention. */
  @Column({ type: "bit", default: false })
  isDeleted!: boolean;

  @Column({ type: "uniqueidentifier" })
  createdByUserId!: string;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  updatedAt!: Date;
}
