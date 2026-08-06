import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * The admin-managed picklist behind the upload form's "Subsidiary" dropdown
 * and the user-creation form's subsidiary scoping. Just a named list — unlike
 * ProjectCode there is no blanket open/closed toggle here; per-subsidiary
 * upload restrictions are always scoped to a specific project code, see
 * SubsidiaryProjectBlock.ts. Upload.subsidiaryId and User.subsidiaryId both
 * still store this as a plain text snapshot, not a foreign key (same
 * convention ProjectCode already established for Upload.projectCode).
 */
@Entity("Subsidiaries")
export class Subsidiary {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "nvarchar", length: 100, unique: true })
  name!: string;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
