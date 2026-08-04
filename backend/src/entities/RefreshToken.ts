import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("RefreshTokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  userId!: string;

  @Column({ type: "nvarchar", length: 128, unique: true })
  tokenHash!: string;

  @Column({ type: "datetimeoffset" })
  expiresAt!: Date;

  @Column({ type: "datetimeoffset", nullable: true })
  revokedAt!: Date | null;

  @Column({ type: "nvarchar", length: 45, nullable: true })
  createdByIp!: string | null;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
