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

  /** A separate, more permanent freeze from `isOpen` above: once locked, subsidiary
   * (non-admin) users can no longer submit Form Builder contributions or Excel uploads
   * for this project code — see projectCodeService.assertProjectCodeUnlockedForUpload
   * (uploads) and formContributionService.submitContribution (contributions), neither of
   * which `isOpen` ever covered (it only ever gated new uploads). Admins stay exempt from
   * both checks. Also the precondition for generating a Question Master (see
   * questionMasterService.generateQuestionMaster) — locking guarantees nothing can
   * change out from under a generated snapshot. Toggled by an admin, independent of
   * `isOpen`. */
  @Column({ type: "bit", default: false })
  isLocked!: boolean;

  /** Informational campaign date range (e.g. "this campaign runs Jun 1 -
   * Jun 30") — purely descriptive, shown in the admin UI. Neither bound is
   * enforced against new uploads; `isOpen` above is the only thing that
   * actually gates upload eligibility, so a code doesn't silently stop
   * accepting uploads just because "today" drifted past `endDate` — an
   * admin closes it explicitly instead. Both nullable: a code can exist
   * with no set dates at all. */
  @Column({ type: "date", nullable: true })
  startDate!: Date | null;

  @Column({ type: "date", nullable: true })
  endDate!: Date | null;

  /** The deadline by which subsidiary users should finish getting their
   * contributions to this project's forms approved. Stored/managed the same way
   * as startDate/endDate (admin-set, nullable, shown in the Configuration UI),
   * but — unlike those two, which are purely descriptive — this one is meant to
   * drive a not-yet-built reminder-email feature for forms still pending
   * approval as the deadline nears. */
  @Column({ type: "date", nullable: true })
  cutoffDate!: Date | null;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
