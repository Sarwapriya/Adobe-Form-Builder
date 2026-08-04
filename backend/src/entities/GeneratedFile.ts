import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type GeneratedFileType = "html" | "js" | "css" | "data-js";

@Entity("GeneratedFiles")
export class GeneratedFile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  uploadId!: string;

  @Column({ type: "nvarchar", length: 255 })
  fileName!: string;

  @Column({ type: "nvarchar", length: 2000 })
  filePath!: string;

  @Column({ type: "nvarchar", length: 20 })
  fileType!: GeneratedFileType;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
