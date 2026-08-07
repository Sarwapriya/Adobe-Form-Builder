import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type QaTestCaseStatus = "passed" | "failed";

/**
 * One individual assertion within a QaRun (e.g. "Q2 required-marker is
 * enforced", "email field rejects an invalid address") — see
 * qaIntrospection.ts for where these are produced. `fieldId` (when set) is
 * the generated form's own DOM id for the field the check concerns (e.g.
 * "Q2", "email") — this is what lets the admin dashboard answer "which
 * fields should be fixed" directly, rather than just a pass/fail count.
 */
@Entity("QaTestCaseResults")
export class QaTestCaseResult {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  qaRunId!: string;

  /** Grouping used by the report UI, e.g. "structure", "field-validation",
   * "submit-flow" — see qaIntrospection.ts's QA_CATEGORY constants. */
  @Column({ type: "nvarchar", length: 40 })
  category!: string;

  @Column({ type: "nvarchar", length: 255 })
  name!: string;

  @Column({ type: "nvarchar", length: 10 })
  status!: QaTestCaseStatus;

  /** The DOM id of the field this check concerns, if any (e.g. "Q2",
   * "email") — null for page-level checks (title, submit button presence). */
  @Column({ type: "nvarchar", length: 100, nullable: true })
  fieldId!: string | null;

  /** Human-readable detail — populated on both pass and fail, but only
   * meaningfully informative on failure (what was expected vs. observed). */
  @Column({ type: "nvarchar", length: 2000, nullable: true })
  message!: string | null;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
