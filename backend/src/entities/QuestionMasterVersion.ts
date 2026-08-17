import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * One generated snapshot of the "Question Master" admin export for a project code —
 * a flat, versioned `.xlsx` compiled from every active subsidiary's *published* Form
 * under that project (see questionMasterService.ts). `projectCode` is a text snapshot,
 * mirroring Form/Upload's own convention (not a foreign key). `version` is assigned
 * once, at generation time (unlike Upload.version/FormVersion.versionNumber, which are
 * null until a later lifecycle transition — here there's no earlier "in progress" state
 * to distinguish from). `division` has no equivalent anywhere else in the app — an
 * admin types it into the Generate dialog each time, so it's recorded per-version here
 * rather than assumed to be constant across a project's whole history.
 */
@Entity("QuestionMasterVersions")
export class QuestionMasterVersion {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "nvarchar", length: 100 })
  projectCode!: string;

  @Column({ type: "int" })
  version!: number;

  @Column({ type: "nvarchar", length: 50 })
  division!: string;

  /** Relative-to-UPLOAD_DIR path of the generated .xlsx — see fileService.ts's
   * questionMasterDir/saveQuestionMasterFile. */
  @Column({ type: "nvarchar", length: 500 })
  filePath!: string;

  @Column({ type: "int", default: 0 })
  subsidiaryCount!: number;

  // Named totalRows, not rowCount — ROWCOUNT is a reserved Transact-SQL keyword
  // (tied to SET ROWCOUNT), which breaks unquoted use as a column name in raw DDL.
  @Column({ type: "int", default: 0 })
  totalRows!: number;

  @Column({ type: "uniqueidentifier" })
  generatedByUserId!: string;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  generatedAt!: Date;
}
