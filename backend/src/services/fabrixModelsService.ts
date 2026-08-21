import { AppDataSource } from "../config/data-source";
import { FabrixModel } from "../entities/FabrixModel";

/** Every configured FabriX model, enabled and disabled alike, sortOrder
 * ascending — the admin management view (Configuration > AI Assistant >
 * Models). */
export function listFabrixModels(): Promise<FabrixModel[]> {
  return AppDataSource.getRepository(FabrixModel).find({ order: { sortOrder: "ASC" } });
}

/** Just the modelId of every *enabled* model, sortOrder ascending, deduped —
 * exactly what fabrixAIService.ts's callFabrixAgent sends as the request's
 * `modelIds` array. Several catalog entries deliberately alias the same
 * underlying modelId (e.g. "gpt-4o"/"gpt-4"/"gpt-oss-120b(Mid)"), so this
 * collapses duplicates rather than sending the same id twice. */
export async function listEnabledModelIds(): Promise<string[]> {
  const rows = await AppDataSource.getRepository(FabrixModel).find({
    where: { isEnabled: true },
    order: { sortOrder: "ASC" },
  });
  return Array.from(new Set(rows.map((r) => r.modelId)));
}

export interface CreateFabrixModelInput {
  name: string;
  modelId: string;
}

/** New rows sort after every existing one by default (max sortOrder + 1). */
export async function createFabrixModel(input: CreateFabrixModelInput): Promise<FabrixModel> {
  const repo = AppDataSource.getRepository(FabrixModel);
  const maxOrder = await repo
    .createQueryBuilder("m")
    .select("MAX(m.sortOrder)", "max")
    .getRawOne<{ max: number | null }>();
  const nextOrder = (maxOrder?.max ?? -1) + 1;

  return repo.save(
    repo.create({ name: input.name.trim(), modelId: input.modelId.trim(), isEnabled: true, sortOrder: nextOrder }),
  );
}

export interface UpdateFabrixModelInput {
  name?: string;
  modelId?: string;
  isEnabled?: boolean;
  sortOrder?: number;
}

/** Returns null if the id doesn't exist — callers map that to a 404, same
 * convention as the rest of the admin API. */
export async function updateFabrixModel(id: string, input: UpdateFabrixModelInput): Promise<FabrixModel | null> {
  const repo = AppDataSource.getRepository(FabrixModel);
  const existing = await repo.findOne({ where: { id } });
  if (!existing) return null;

  if (input.name !== undefined) existing.name = input.name.trim();
  if (input.modelId !== undefined) existing.modelId = input.modelId.trim();
  if (input.isEnabled !== undefined) existing.isEnabled = input.isEnabled;
  if (input.sortOrder !== undefined) existing.sortOrder = input.sortOrder;
  return repo.save(existing);
}

/** Swaps sortOrder with the model immediately before/after this one in the
 * current ordering — the up/down reorder buttons in the admin UI, without
 * requiring a drag-and-drop implementation. No-op (returns the row as-is) if
 * already at that end of the list. Returns null if the id doesn't exist. */
export async function moveFabrixModel(id: string, direction: "up" | "down"): Promise<FabrixModel | null> {
  const repo = AppDataSource.getRepository(FabrixModel);
  const all = await repo.find({ order: { sortOrder: "ASC" } });
  const index = all.findIndex((m) => m.id === id);
  if (index === -1) return null;

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= all.length) return all[index];

  const a = all[index];
  const b = all[swapWith];
  const aOrder = a.sortOrder;
  a.sortOrder = b.sortOrder;
  b.sortOrder = aOrder;
  await repo.save([a, b]);
  return a;
}

export async function deleteFabrixModel(id: string): Promise<boolean> {
  const result = await AppDataSource.getRepository(FabrixModel).delete({ id });
  return (result.affected ?? 0) > 0;
}
