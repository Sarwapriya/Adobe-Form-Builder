import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * One selectable model for a fallback AI provider, shown as a picklist in
 * the admin UI (Configuration > AI Assistant > Other AI Providers — see
 * otherAiModelsService.ts). Table/entity name is deliberately provider-
 * generic (not "Claude*") to match the rest of that section's interface,
 * even though every row today is a Claude/Anthropic model id — no other
 * provider is actually wired up server-side yet. Unlike FabrixModel, there's
 * no `isEnabled` flag here: Anthropic's Messages API takes exactly one
 * `model` string per request, not an array, so there's nothing to "enable
 * together" — which single model is actually used is claudeSettingsService.ts's
 * own `model` field (an AdminSetting row), not a flag on these catalog rows.
 * This table is just a reference list of known model ids to pick from (the
 * Model field is still free-text-capable in the UI, so an id newer than this
 * seeded list still works — this table is a convenience, not a whitelist).
 */
@Entity("OtherAiModels")
export class OtherAiModel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** Human-readable label shown in the admin UI (e.g. "Claude Opus 5"). */
  @Column({ type: "nvarchar", length: 100 })
  name!: string;

  @Column({ type: "nvarchar", length: 100 })
  modelId!: string;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
