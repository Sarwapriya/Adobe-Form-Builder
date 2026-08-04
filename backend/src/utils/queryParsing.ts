/** Parses a query-string value into a positive integer, or undefined if it's
 * missing/not a valid positive integer. Shared by every route that accepts
 * ?page=&pageSize= (or similar) pagination params — so "what counts as a
 * valid page number" is defined in exactly one place. */
export function parsePositiveInt(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export interface PagingInput {
  page?: number;
  pageSize?: number;
}

export interface ResolvedPaging {
  page: number;
  pageSize: number;
  skip: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** Normalizes optional page/pageSize input into a safe page (>=1) and pageSize
 * (1..100, defaulting to 20), plus the computed `skip` offset — shared by every
 * paginated listing query so the bounds/defaults are defined in one place. */
export function resolvePaging(input: PagingInput): ResolvedPaging {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, input.pageSize ?? DEFAULT_PAGE_SIZE));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
