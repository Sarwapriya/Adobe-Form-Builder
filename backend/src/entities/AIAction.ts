import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import type { AIToolName } from "@formbuilder/shared";

/**
 * A mutating tool call the assistant proposed (see `aiCampaignTools.ts`'s
 * read-only vs. proposal split) — the audit trail required by the AI
 * assistant spec. Nothing in `Forms`/`FormVersions` changes until a human
 * confirms: `confirmed`/`executed` are set by `POST /ai/actions/:id/confirm`
 * (`aiAssistantService.confirmAction`), never by the model's response alone.
 */
@Entity("AIActions")
export class AIAction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  conversationId!: string;

  @Column({ type: "uniqueidentifier", nullable: true })
  formId!: string | null;

  @Column({ type: "uniqueidentifier" })
  userId!: string;

  @Column({ type: "nvarchar", length: 50 })
  actionType!: AIToolName;

  /** JSON-encoded tool args, validated against the shared zod schema before
   * this row is ever created — see `aiAssistantService.ts`. */
  @Column({ type: "nvarchar", length: "MAX" })
  requestJson!: string;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  responseJson!: string | null;

  @Column({ type: "bit", default: false })
  confirmed!: boolean;

  @Column({ type: "bit", default: false })
  executed!: boolean;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  executionResult!: string | null;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
