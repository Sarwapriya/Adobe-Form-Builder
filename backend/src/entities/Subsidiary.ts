import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * The admin-managed picklist behind the upload form's "Subsidiary" dropdown
 * and the user-creation form's subsidiary scoping. Upload.subsidiaryId and
 * User.subsidiaryId both still store this as a plain text snapshot, not a
 * foreign key (same convention ProjectCode already established for
 * Upload.projectCode) — deleting or disabling a subsidiary here never
 * touches those historical records.
 */
@Entity("Subsidiaries")
export class Subsidiary {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "nvarchar", length: 100, unique: true })
  name!: string;

  /** Whether this subsidiary may currently be selected for a new upload or a
   * new user — see subsidiaryService.assertSubsidiaryActiveForUpload,
   * checked on every POST /api/v1/uploads. Independent of, and layered
   * "above", SubsidiaryProjectBlock.ts's per-project restriction: disabling
   * a subsidiary here blocks *every* project for it in one step, rather than
   * requiring a block row per project code. Toggled by an admin; disabling
   * (not deleting) is the reversible option — see also
   * subsidiaryService.deleteSubsidiary for the permanent one. */
  @Column({ type: "bit", default: true })
  isActive!: boolean;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
