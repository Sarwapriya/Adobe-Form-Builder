import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type GeneratedFileType = "html" | "js" | "css" | "data-js";

/** One generated output file, owned by either an Upload (Excel-authored) or a
 * FormVersion (builder-authored) — exactly one of `uploadId`/`formVersionId` is set,
 * enforced by a CHECK constraint (see the AddFormVersionToGeneratedFiles migration),
 * not by TypeScript — a plain `@Column` pair remains the simplest way to model "one of
 * two nullable owner columns" in this codebase's existing entity style. */
@Entity("GeneratedFiles")
export class GeneratedFile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier", nullable: true })
  uploadId!: string | null;

  @Column({ type: "uniqueidentifier", nullable: true })
  formVersionId!: string | null;

  @Column({ type: "nvarchar", length: 255 })
  fileName!: string;

  @Column({ type: "nvarchar", length: 2000 })
  filePath!: string;

  @Column({ type: "nvarchar", length: 20 })
  fileType!: GeneratedFileType;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
