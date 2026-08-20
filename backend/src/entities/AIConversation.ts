import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type AIConversationStatus = "active" | "archived";

/**
 * One chat thread between a user and the FabriXAI-backed Form Builder
 * assistant (see `aiAssistantService.ts`). `formId` links the conversation to
 * whichever campaign/form editor it was opened from — null for a
 * conversation started without an open form (e.g. a general "find my
 * previous campaigns" chat from a list page).
 */
@Entity("AIConversations")
export class AIConversation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uniqueidentifier" })
  userId!: string;

  @Column({ type: "uniqueidentifier", nullable: true })
  formId!: string | null;

  @Column({ type: "nvarchar", length: 200, nullable: true })
  title!: string | null;

  @Column({ type: "nvarchar", length: 20, default: "active" })
  status!: AIConversationStatus;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  updatedAt!: Date;
}
