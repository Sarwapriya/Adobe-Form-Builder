import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type EmailLogStatus = "sent" | "failed";

@Entity("EmailLogs")
export class EmailLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  uploadId!: string;

  @Column({ type: "nvarchar", length: 255 })
  recipient!: string;

  @Column({ type: "nvarchar", length: 20 })
  status!: EmailLogStatus;

  @Column({ type: "nvarchar", length: 1000, nullable: true })
  errorMessage!: string | null;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  sentAt!: Date;
}
