import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type AIMessageRole = "user" | "assistant" | "system" | "tool";

/**
 * One turn in an `AIConversation`. `role: "tool"` rows record a tool's
 * result being fed back to FabriXAI (see `aiAssistantService.ts` step 6) —
 * kept for audit/debugging, never replayed as conversation history verbatim
 * to the user-facing transcript.
 */
@Entity("AIConversationMessages")
export class AIConversationMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  conversationId!: string;

  @Column({ type: "nvarchar", length: 20 })
  role!: AIMessageRole;

  @Column({ type: "nvarchar", length: "MAX" })
  message!: string;

  @Column({ type: "int", nullable: true })
  tokenUsage!: number | null;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  model!: string | null;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  requestId!: string | null;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
