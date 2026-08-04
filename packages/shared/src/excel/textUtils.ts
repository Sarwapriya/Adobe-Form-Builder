/** Shared text-normalization helpers for header/label matching. The Excel headers must be
 * matched tolerant of whitespace/casing per spec; loose matching additionally collapses
 * underscores/slashes so "Language_Country" and "Language / Country" compare equal. */

/** Trims and collapses horizontal whitespace runs, but preserves intentional line
 * breaks (Alt+Enter cell content, e.g. multi-paragraph privacy-policy text) — collapsing
 * those would be an unintended modification of the source text. */
export function normalize(s: string | undefined | null): string {
  return (s ?? "")
    .toString()
    .trim()
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n");
}

export function normalizeLoose(s: string | undefined | null): string {
  return (s ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s_/]+/g, "");
}

/** True for Excel bracket-style placeholder text like "[Update if needed]". */
export function isBracketPlaceholder(s: string): boolean {
  return /^\[.*\]$/.test(s.trim());
}
