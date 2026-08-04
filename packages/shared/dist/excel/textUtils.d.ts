/** Shared text-normalization helpers for header/label matching. The Excel headers must be
 * matched tolerant of whitespace/casing per spec; loose matching additionally collapses
 * underscores/slashes so "Language_Country" and "Language / Country" compare equal. */
/** Trims and collapses horizontal whitespace runs, but preserves intentional line
 * breaks (Alt+Enter cell content, e.g. multi-paragraph privacy-policy text) — collapsing
 * those would be an unintended modification of the source text. */
export declare function normalize(s: string | undefined | null): string;
export declare function normalizeLoose(s: string | undefined | null): string;
/** True for Excel bracket-style placeholder text like "[Update if needed]". */
export declare function isBracketPlaceholder(s: string): boolean;
