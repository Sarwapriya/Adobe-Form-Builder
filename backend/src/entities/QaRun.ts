import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type QaRunStatus = "pending" | "running" | "passed" | "failed" | "error";
export type QaRunVariant = "ff" | "oc";

/**
 * One QA automation run against a single generated form variant (Full Form
 * or One-Click), triggered from the Admin Dashboard (an upload) or the Form
 * Builder review panels (a Configuration form) and executed in the
 * background by qaRunService.runQaJob (a real headless-Chromium Playwright
 * session against a self-contained copy of the generated HTML/CSS/JS).
 * Exactly one of `uploadId`/`formId` is set (a plain `@Column` pair, not a
 * TypeORM relation, enforced by a DB CHECK constraint — same "one of two
 * nullable owner columns" convention as GeneratedFile's own uploadId/
 * formVersionId): `uploadId` for a submitted Excel upload (same inlined HTML
 * previewService.buildUploadPreview already produces for the "View" button);
 * `formId` for a Configuration form — either a pending subsidiary
 * contribution merged onto that form's current draft in memory
 * (`contributionId` also set, never persisted to GeneratedFiles) or an
 * ad-hoc form's own draft while it awaits admin review (`contributionId`
 * null). `status` starts "pending", flips to "running" once the job
 * actually starts, and lands on "passed" (every test case passed), "failed"
 * (at least one test case failed), or "error" (the run itself couldn't
 * complete — e.g. Chromium failed to launch) — distinct from "failed" so
 * the admin dashboard can tell "the form has bugs" apart from "the QA tool
 * itself broke".
 */
@Entity("QaRuns")
export class QaRun {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier", nullable: true })
  uploadId!: string | null;

  @Column({ type: "uniqueidentifier", nullable: true })
  formId!: string | null;

  /** Only set for a run against a pending Translate & Extend contribution
   * (formId is set alongside it) — null for every upload-based run and for
   * an ad-hoc pending-review run (which has no separate FormContribution
   * row; formId alone identifies its own draft). */
  @Column({ type: "uniqueidentifier", nullable: true })
  contributionId!: string | null;

  @Column({ type: "nvarchar", length: 10 })
  variant!: QaRunVariant;

  @Column({ type: "nvarchar", length: 20, default: "pending" })
  status!: QaRunStatus;

  /** Who clicked "Run QA" — admin-only feature, but kept for audit alongside
   * every other admin action in this app. */
  @Column({ type: "uniqueidentifier" })
  triggeredByUserId!: string;

  @Column({ type: "int", default: 0 })
  totalTests!: number;

  @Column({ type: "int", default: 0 })
  passedTests!: number;

  @Column({ type: "int", default: 0 })
  failedTests!: number;

  /** Populated only when status is "error" — a crash/setup failure message,
   * not a test-case failure (those live in QaTestCaseResults instead). */
  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  errorMessage!: string | null;

  /** Relative-to-UPLOAD_DIR path of the downloadable HTML report — see
   * qaRunService.buildQaReportHtml. Null until the run completes. */
  @Column({ type: "nvarchar", length: 2000, nullable: true })
  reportPath!: string | null;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;

  @Column({ type: "datetimeoffset", nullable: true })
  startedAt!: Date | null;

  @Column({ type: "datetimeoffset", nullable: true })
  completedAt!: Date | null;
}
