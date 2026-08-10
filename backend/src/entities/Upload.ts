import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type UploadStatus = "uploaded" | "generated" | "submitted" | "failed";

@Entity("Uploads")
export class Upload {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "nvarchar", length: 50 })
  subsidiaryId!: string;

  /** The project code selected from the upload form's dropdown (see
   * projectCodeService.ts / ProjectCode entity) — a text snapshot taken at
   * upload time, not a foreign key, mirroring subsidiaryId's own pattern.
   * Nullable only because rows created before this feature existed have none. */
  @Column({ type: "nvarchar", length: 100, nullable: true })
  projectCode!: string | null;

  @Column({ type: "nvarchar", length: 255 })
  fileName!: string;

  @Column({ type: "nvarchar", length: 2000 })
  filePath!: string;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  uploadDate!: Date;

  @Column({ type: "int", default: 0 })
  submissionCount!: number;

  /** Nullable so pre-existing rows (uploaded before Users existed) stay valid. */
  @Column({ type: "uniqueidentifier", nullable: true })
  userId!: string | null;

  /** Global, per-subsidiary version counter — assigned only once this upload is
   * submitted (see submissionService.ts), scoped to *submitted* uploads for
   * the subsidiary, so an upload that's merely generated, or that fails, never
   * consumes a version number. Null until then. Enforced unique per
   * subsidiary by a filtered database index (NULLs excluded), not just this
   * column. */
  @Column({ type: "int", nullable: true })
  version!: number | null;

  /** Directory (relative to UPLOAD_DIR) holding this version's generated solution
   * files, once generation has run. Null until then. */
  @Column({ type: "nvarchar", length: 2000, nullable: true })
  generatedPath!: string | null;

  @Column({ type: "nvarchar", length: 20, default: "uploaded" })
  status!: UploadStatus;

  @Column({ type: "datetimeoffset", nullable: true })
  submittedAt!: Date | null;

  /** Soft-delete flag — DELETE /uploads/:id never removes the row (audit trail),
   * it just hides it from listings. */
  @Column({ type: "bit", default: false })
  isDeleted!: boolean;

  /** JSON-encoded `Record<questionId, boolean>` — which questions the uploader
   * marked optional at upload time (see generationService.generateFromWorkbook's
   * `requiredOverrides` param). Null if none were overridden. Persisted so
   * regenerateUpload can re-apply the same choices instead of resetting every
   * question back to its Excel-parsed default (required: true). */
  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  questionOverrides!: string | null;

  /** JSON-encoded `FormVariant[]` (e.g. '["ff"]', '["ff","oc"]') — which
   * generated-output variant(s) the uploader chose at upload time. Null means
   * "both" (the original, still-default behavior, and what every row created
   * before this feature existed implicitly has). Persisted so regenerateUpload
   * re-applies the same selection instead of silently generating both again. */
  @Column({ type: "nvarchar", length: 50, nullable: true })
  variants!: string | null;
}
