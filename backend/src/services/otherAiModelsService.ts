import { AppDataSource } from "../config/data-source";
import { OtherAiModel } from "../entities/OtherAiModel";

/** The known-models picklist for Other AI Providers (Configuration > AI
 * Assistant > Other AI Providers), sortOrder ascending — read-only reference
 * data, not something the admin curates the way FabrixModel is (these are
 * Anthropic's own official model ids, a small well-known set; the Model
 * field stays free-text-capable in the UI regardless, so a newer id than
 * this seeded list still works). */
export function listOtherAiModels(): Promise<OtherAiModel[]> {
  return AppDataSource.getRepository(OtherAiModel).find({ order: { sortOrder: "ASC" } });
}
