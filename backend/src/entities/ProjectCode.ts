import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * The admin-managed picklist behind the upload form's "Project Code" dropdown
 * (see projectCodeService.ts). Deliberately separate from Upload.subsidiaryId
 * — a subsidiary is free-text and never validated, while a project code is a
 * closed set an admin curates and can close to new uploads (isOpen). Uploads
 * store the code as a plain text snapshot (Upload.projectCode), not a foreign
 * key, mirroring how subsidiaryId already works — no join needed to display
 * or filter by it.
 */
@Entity("ProjectCodes")
export class ProjectCode {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "nvarchar", length: 100, unique: true })
  code!: string;

  /** Whether new uploads may currently select this code — see
   * projectCodeService.assertProjectCodeOpenForUpload, checked on every
   * POST /api/v1/uploads. Toggled by an admin; never deleted, so historical
   * uploads that used a since-closed code keep their record intact. */
  @Column({ type: "bit", default: true })
  isOpen!: boolean;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
