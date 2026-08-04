import type { MapResult } from "./mapper";
import type { Issue, ValidationResult } from "./types";
/**
 * Combines the structural issues surfaced during parsing/mapping with a handful of
 * additional whole-workbook checks, and partitions everything into blocking errors
 * vs. non-blocking warnings. Generation should only be enabled once `errors` is empty.
 */
export declare function validateWorkbook(mapResult: MapResult, parserIssues: Issue[]): ValidationResult;
