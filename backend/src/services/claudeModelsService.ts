import { AppDataSource } from "../config/data-source";
import { ClaudeModel } from "../entities/ClaudeModel";

/** The known-Claude-models picklist (Configuration > AI Assistant > Claude
 * Settings), sortOrder ascending — read-only reference data, not something
 * the admin curates the way FabrixModels is (Anthropic's model ids are a
 * small, official, well-known set; the Model field stays free-text-capable
 * in the UI regardless, so a newer id than this seeded list still works). */
export function listClaudeModels(): Promise<ClaudeModel[]> {
  return AppDataSource.getRepository(ClaudeModel).find({ order: { sortOrder: "ASC" } });
}
