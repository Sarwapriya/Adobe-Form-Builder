import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type FormStatus = "draft" | "published" | "unpublished";

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
