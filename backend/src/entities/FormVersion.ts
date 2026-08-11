import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type FormVersionStatus = "draft" | "published" | "archived";

/**
 * One snapshot of a builder-authored form's content — see Form.ts for the overall
 * lifecycle. Most edits ("Save Draft") UPDATE one draft row in place (no
 * intermediate-edit history); a *new* row is only ever created at a real lifecycle
 * transition:
 *  - Publish: this row's own status flips to "published", `versionNumber` is assigned
 *    (see submissionService.submitUpload's identically-shaped locked-transaction
 *    pattern for Upload.version — same "assigned only at the meaningful transition,
 *    never reused" contract), and a fresh "draft" row is cloned from it so further
 *    edits never touch this now-published row's `definition`/`config`/generated
 *    output again.
 *  - Unpublish: this row's own `unpublishedAt` is stamped (see formBuilderService.ts)
 *    — nothing is deleted, this only gates preview/download (previewService.ts /
 *    zipService.ts), not the underlying data.
 */
@Entity("FormVersions")
export class FormVersion {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  formId!: string;

  /** Assigned only once this version is published — null until then, same
   * null-until-submitted contract as Upload.version. */
  @Column({ type: "int", nullable: true })
  versionNumber!: number | null;

  /** JSON-encoded FormDefinition (`@formbuilder/shared`) — JSON.stringify-on-write /
   * parse-with-fallback-on-read, same pattern as Upload.questionOverrides. */
  @Column({ type: "nvarchar", length: "MAX" })
  definition!: string;

  /** JSON-encoded BuilderConfig used when this version was (or will be) generated. */
  @Column({ type: "nvarchar", length: "MAX" })
  config!: string;

  @Column({ type: "nvarchar", length: 20, default: "draft" })
  status!: FormVersionStatus;

  @Column({ type: "uniqueidentifier" })
  createdByUserId!: string;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;

  @Column({ type: "datetimeoffset", nullable: true })
  publishedAt!: Date | null;

  @Column({ type: "datetimeoffset", nullable: true })
  unpublishedAt!: Date | null;
}
