import type { FormDefinition } from "../form/formDefinition";
import { type UnresolvedLocale } from "./localeDetection";
import type { Issue, ParsedWorkbook } from "./types";
export interface MapResult {
    form: FormDefinition;
    unresolvedLocales: UnresolvedLocale[];
    issues: Issue[];
}
/**
 * Walks the raw rows of the "Complete Translations" sheet and produces a `FormDefinition`.
 * Column A is the sheet's own documented row-type key ("(Do not change this column)") —
 * only non-blank values there are treated as meaningful, machine-readable keys; every
 * blank-key row (spacer, section sub-header like "Fields needed (English)", the
 * "(Single answer)"/"(Multiple answers)" marker) is handled generically rather than
 * erroring, since the sheet's own convention is that blank column A means "not for
 * automated processing".
 */
export declare function mapWorkbook(parsed: ParsedWorkbook): MapResult;
