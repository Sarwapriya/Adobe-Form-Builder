import type { ValidationResult } from "../excel/types";
import type { FormDefinition } from "./formDefinition";
/**
 * `FormDefinition`-native validator for builder-authored forms — the counterpart to
 * `excel/validator.ts`'s `validateWorkbook`, which is entirely `MapResult`/Excel-shaped
 * and can't be reused here. Shares the same `Issue`/`ValidationResult` shape so the
 * frontend's existing validation-panel rendering works unchanged for both pipelines.
 * Generation (`generateSolution`) should only run once `errors` is empty, same
 * convention as the Excel path.
 */
export declare function validateFormDefinition(form: FormDefinition): ValidationResult;
