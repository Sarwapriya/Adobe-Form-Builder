/**
 * Minimal in-memory stand-in for TypeORM's `Repository`/`DataSource`, used
 * only by the AI-assistant tests (aiAssistantService.test.ts,
 * aiRouter.test.ts) since this backend has no real-database test harness —
 * every existing backend/tests/*.test.ts file before this feature tested
 * pure utility functions only. Supports just the handful of Repository
 * methods aiAssistantService.ts actually calls (create/save/findOne/find/
 * update/delete with a flat equality `where`), not real TypeORM semantics
 * (no relations, no query builder, no operators).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
type WhereClause = Row;

function matches(row: Row, where: WhereClause | WhereClause[]): boolean {
  const clauses = Array.isArray(where) ? where : [where];
  return clauses.some((clause) => Object.entries(clause).every(([k, v]) => (v === undefined ? true : row[k] === v)));
}

export class FakeRepo<T extends Row = Row> {
  rows: T[] = [];
  private idCounter = 0;

  create(partial: Partial<T>): T {
    return { ...partial } as T;
  }

  async save(entity: T | T[]): Promise<T | T[]> {
    if (Array.isArray(entity)) {
      return Promise.all(entity.map((e) => this.save(e))) as unknown as T[];
    }
    const row = entity as Row;
    if (!row.id) row.id = `id-${++this.idCounter}`;
    if (row.createdAt === undefined) row.createdAt = new Date(Date.now() + this.idCounter);
    if (row.updatedAt === undefined) row.updatedAt = row.createdAt;
    const idx = this.rows.findIndex((r) => r.id === row.id);
    if (idx >= 0) this.rows[idx] = entity as T;
    else this.rows.push(entity as T);
    return entity;
  }

  async findOne(opts: { where: WhereClause }): Promise<T | null> {
    return this.rows.find((r) => matches(r, opts.where)) ?? null;
  }

  async find(opts: { where?: WhereClause; order?: Record<string, "ASC" | "DESC">; take?: number } = {}): Promise<T[]> {
    let result = opts.where ? this.rows.filter((r) => matches(r, opts.where!)) : [...this.rows];
    if (opts.order) {
      const [key, dir] = Object.entries(opts.order)[0];
      result = result.sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        const cmp = av > bv ? 1 : av < bv ? -1 : 0;
        return dir === "DESC" ? -cmp : cmp;
      });
    }
    if (opts.take !== undefined) result = result.slice(0, opts.take);
    return result;
  }

  async update(id: string, partial: Partial<T>): Promise<void> {
    const row = this.rows.find((r) => r.id === id);
    if (row) Object.assign(row, partial);
  }

  async delete(where: WhereClause): Promise<void> {
    this.rows = this.rows.filter((r) => !matches(r, where));
  }
}

function createFakeDataSource() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repos = new Map<any, FakeRepo>();
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getRepository(entityClass: any): FakeRepo {
      if (!repos.has(entityClass)) repos.set(entityClass, new FakeRepo());
      return repos.get(entityClass)!;
    },
    reset(): void {
      repos.clear();
    },
  };
}

/**
 * A single module-level instance, imported both by the `vi.mock("../src/config/data-source", ...)`
 * factory below (via a dynamic `import()`, since a mock factory can't
 * reference outer-scope variables directly without `vi.hoisted`) and by
 * test files that need to seed rows directly — ESM's module cache
 * guarantees both sides see the exact same object.
 */
export const fakeDataSource = createFakeDataSource();

