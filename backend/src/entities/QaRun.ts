import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type QaRunStatus = "pending" | "running" | "passed" | "failed" | "error";
export type QaRunVariant = "ff" | "oc";

/**
 * One QA automation run against a single generated form variant (Full Form
 * or One-Click) of one upload — triggered from the Admin Dashboard, executed
 * in the background by qaRunService.runQaJob (a real headless-Chromium
 * Playwright session against a self-contained copy of the generated
 * HTML/CSS/JS, same inlining technique previewService.buildUploadPreview
 * already uses for the "View" button). `status` starts "pending", flips to
 * "running" once the job actually starts, and lands on "passed" (every test
 * case passed), "failed" (at least one test case failed), or "error" (the
 * run itself couldn't complete — e.g. Chromium failed to launch) —
 * distinct from "failed" so the admin dashboard can tell "the form has bugs"
 * apart from "the QA tool itself broke".
 */
@Entity("QaRuns")
export class QaRun {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  uploadId!: string;

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
