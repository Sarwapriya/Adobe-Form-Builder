import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

/**
 * A specific (subsidiary, project code) pair an admin has blocked from new
 * uploads — e.g. closing "F2H26" for "SGE" only, while every other
 * subsidiary can still upload it. Row presence *is* the block: creating one
 * blocks the pair, deleting it unblocks — no separate isBlocked flag, since
 * (unlike ProjectCode/Subsidiary) there's no need to remember a pair was ever
 * blocked once it's lifted. Independent of, and layered on top of,
 * ProjectCode.isOpen — see uploadService.createUpload, which checks both.
 */
@Entity("SubsidiaryProjectBlocks")
@Index("UQ_SubsidiaryProjectBlocks_pair", ["subsidiaryName", "projectCode"], { unique: true })
export class SubsidiaryProjectBlock {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "nvarchar", length: 100 })
  subsidiaryName!: string;

  @Column({ type: "nvarchar", length: 100 })
  projectCode!: string;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
