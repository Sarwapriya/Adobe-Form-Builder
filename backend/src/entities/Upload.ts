import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type UploadStatus = "uploaded" | "generated" | "submitted" | "failed";

@Entity("Uploads")
export class Upload {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "nvarchar", length: 50 })
  subsidiaryId!: string;

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

  /** Global, per-subsidiary version counter — never overwrite a previous upload,
   * always insert the next version. Enforced by a unique (subsidiaryId, version)
   * constraint at the database level, not just this default. */
  @Column({ type: "int", default: 1 })
  version!: number;

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
}
