import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

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
}
