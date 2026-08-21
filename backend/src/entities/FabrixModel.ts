import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * One selectable FabriX LLM the AI Assistant can call — admin-managed via
 * Configuration > AI Assistant > Models. Every *enabled* model's `modelId`,
 * in `sortOrder`, is sent together as the request's `modelIds: [...]` array
 * (see fabrixAIService.ts's callFabrixAgent) — the FabriX OpenAPI endpoint
 * accepts a list there specifically so it can route around/fall back past a
 * model that's unavailable or token/rate-limited, so listing more than one
 * enabled model is what gives you automatic "swap and use another" behavior,
 * without this app needing its own retry-with-different-model logic.
 *
 * `modelId` is deliberately NOT unique — FabriX names multiple aliases
 * (e.g. "gpt-4o", "gpt-4", "gpt-oss-120b(Mid)") that resolve to the exact
 * same underlying model id; the request-building code dedupes by modelId
 * value before sending, so listing every alias here is harmless.
 */
@Entity("FabrixModels")
export class FabrixModel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** Human-readable label shown in the admin UI (e.g. "Glm 5.2") — purely
   * descriptive, never sent to FabriX. */
  @Column({ type: "nvarchar", length: 100 })
  name!: string;

  @Column({ type: "nvarchar", length: 100 })
  modelId!: string;

  /** Whether this model is currently included in the `modelIds` array sent
   * on every chat request. */
  @Column({ type: "bit", default: true })
  isEnabled!: boolean;

  /** Priority order within the `modelIds` array — lower sorts first. */
  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
